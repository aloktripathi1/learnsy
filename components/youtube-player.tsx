"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useAuth } from "@/components/auth-provider"
import { DatabaseService } from "@/lib/database"

interface YouTubePlayerProps {
  videoId: string
  onProgress?: (progress: number) => void
  onComplete?: () => void
  className?: string
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export function YouTubePlayer({ videoId, onProgress, onComplete, className }: YouTubePlayerProps) {
  const { user } = useAuth()
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const currentVideoIdRef = useRef<string>(videoId)
  const [isReady, setIsReady] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [hasResumed, setHasResumed] = useState(false)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timestampIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedTime = useRef<number>(0)
  const isInitializing = useRef<boolean>(false)

  const saveTimestamp = useCallback(async () => {
    if (!user || !playerRef.current || typeof playerRef.current.getCurrentTime !== "function") return

    try {
      const currentTime = playerRef.current.getCurrentTime()
      const duration = playerRef.current.getDuration()

      if (currentTime > 0 && duration > 0) {
        // Only save if time has changed significantly (more than 5 seconds)
        if (Math.abs(currentTime - lastSavedTime.current) >= 5) {
          console.log(`Saving timestamp: ${Math.floor(currentTime)}s / ${Math.floor(duration)}s`)
          await DatabaseService.updateVideoTimestamp(
            user.id,
            currentVideoIdRef.current,
            Math.floor(currentTime),
            Math.floor(duration),
          )
          lastSavedTime.current = currentTime
        }
      }
    } catch (error) {
      console.error("Error saving timestamp:", error)
    }
  }, [user])

  const resumeFromTimestamp = useCallback(
    async (videoId: string) => {
      if (!user || !playerRef.current || typeof playerRef.current.seekTo !== "function") return

      try {
        console.log("Attempting to resume from saved timestamp for video:", videoId)
        const timestampData = await DatabaseService.getVideoTimestamp(user.id, videoId)

        if (timestampData && timestampData.timestamp > 10) {
          // Only resume if more than 10 seconds in
          console.log(`Resuming video from ${timestampData.timestamp} seconds`)

          // Wait for player to be ready before seeking
          const seekWhenReady = () => {
            if (playerRef.current && typeof playerRef.current.getPlayerState === "function") {
              const state = playerRef.current.getPlayerState()
              // Wait for player to be ready (state 1 = playing, state 2 = paused, state 3 = buffering)
              if (state >= 1) {
                playerRef.current.seekTo(timestampData.timestamp, true)
                lastSavedTime.current = timestampData.timestamp
                console.log("Successfully resumed from timestamp")
              } else {
                // Retry after a short delay
                setTimeout(seekWhenReady, 500)
              }
            }
          }

          seekWhenReady()
        } else {
          console.log("No saved timestamp found or timestamp too early, starting from beginning")
        }
      } catch (error) {
        console.error("Error resuming from timestamp:", error)
      }
    },
    [user],
  )

  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }

    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
        try {
          const currentTime = playerRef.current.getCurrentTime()
          const duration = playerRef.current.getDuration()

          if (duration > 0) {
            const progress = (currentTime / duration) * 100
            onProgress?.(progress)

            // Auto-complete at 90% progress
            if (progress >= 90 && !hasCompleted) {
              console.log(`Video reached ${progress.toFixed(1)}% - auto-completing`)
              setHasCompleted(true)
              onComplete?.()
              stopProgressTracking()
              stopTimestampTracking()

              // Dispatch progress update event
              window.dispatchEvent(new CustomEvent("progressUpdated"))
            }
          }
        } catch (error) {
          console.error("Error tracking progress:", error)
        }
      }
    }, 1000) // Check every second
  }, [onProgress, onComplete, hasCompleted])

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }, [])

  const startTimestampTracking = useCallback(() => {
    if (timestampIntervalRef.current) {
      clearInterval(timestampIntervalRef.current)
    }

    timestampIntervalRef.current = setInterval(() => {
      saveTimestamp()
    }, 5000) // Save every 5 seconds
  }, [saveTimestamp])

  const stopTimestampTracking = useCallback(() => {
    if (timestampIntervalRef.current) {
      clearInterval(timestampIntervalRef.current)
      timestampIntervalRef.current = null
    }
  }, [])

  const initializePlayer = useCallback(() => {
    if (!containerRef.current || !window.YT || !window.YT.Player || isInitializing.current) return

    console.log("Initializing YouTube player for video:", videoId)
    isInitializing.current = true

    try {
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          enablejsapi: 1,
          origin: window.location.origin,
          autoplay: 0,
          start: 0,
        },
        events: {
          onReady: (event: any) => {
            console.log("YouTube player ready")
            setIsReady(true)
            isInitializing.current = false
            currentVideoIdRef.current = videoId

            // Resume from timestamp after player is ready
            setTimeout(() => {
              resumeFromTimestamp(videoId)
            }, 1000)
          },
          onStateChange: (event: any) => {
            const state = event.data
            console.log("Player state changed:", state)

            // Start tracking when video is playing
            if (state === window.YT.PlayerState.PLAYING) {
              startProgressTracking()
              startTimestampTracking()
            } else {
              stopProgressTracking()
              stopTimestampTracking()
            }

            // Handle video ended
            if (state === window.YT.PlayerState.ENDED && !hasCompleted) {
              console.log("Video ended - marking as complete")
              setHasCompleted(true)
              onComplete?.()
              saveTimestamp()

              // Dispatch progress update event
              window.dispatchEvent(new CustomEvent("progressUpdated"))
            }

            // Save timestamp when paused
            if (state === window.YT.PlayerState.PAUSED) {
              saveTimestamp()
            }
          },
          onError: (event: any) => {
            console.error("YouTube player error:", event.data)
            isInitializing.current = false
          },
        },
      })
    } catch (error) {
      console.error("Error initializing player:", error)
      isInitializing.current = false
    }
  }, [
    videoId,
    onComplete,
    hasCompleted,
    resumeFromTimestamp,
    startProgressTracking,
    stopProgressTracking,
    startTimestampTracking,
    stopTimestampTracking,
    saveTimestamp,
  ])

  // Load YouTube API only once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      if (!playerRef.current) {
        initializePlayer()
      }
      return
    }

    // Load YouTube API if not already loaded
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      console.log("Loading YouTube API...")
      const script = document.createElement("script")
      script.src = "https://www.youtube.com/iframe_api"
      script.async = true
      document.head.appendChild(script)
    }

    // Set up the callback
    window.onYouTubeIframeAPIReady = () => {
      console.log("YouTube API ready")
      if (!playerRef.current) {
        initializePlayer()
      }
    }
  }, [initializePlayer])

  // Handle video changes without re-initializing the player
  useEffect(() => {
    if (videoId !== currentVideoIdRef.current && playerRef.current && isReady) {
      console.log("Changing video from", currentVideoIdRef.current, "to", videoId)

      // Reset states for new video
      setHasCompleted(false)
      setHasResumed(false)
      lastSavedTime.current = 0

      // Stop current tracking
      stopProgressTracking()
      stopTimestampTracking()

      // Save timestamp for current video before switching
      if (currentVideoIdRef.current) {
        saveTimestamp()
      }

      // Load new video
      if (typeof playerRef.current.loadVideoById === "function") {
        playerRef.current.loadVideoById(videoId)
        currentVideoIdRef.current = videoId

        // Resume from timestamp for new video after a short delay
        setTimeout(() => {
          resumeFromTimestamp(videoId)
        }, 1500)
      }
    }
  }, [videoId, isReady, stopProgressTracking, stopTimestampTracking, saveTimestamp, resumeFromTimestamp])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("Cleaning up YouTube player")
      stopProgressTracking()
      stopTimestampTracking()

      // Save timestamp before unmounting
      if (user && playerRef.current && currentVideoIdRef.current) {
        saveTimestamp()
      }

      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
  }, [stopProgressTracking, stopTimestampTracking, saveTimestamp, user])

  return (
    <div className={`youtube-container enhanced-video-container ${className || ""}`}>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}

// Default export for compatibility
export default YouTubePlayer