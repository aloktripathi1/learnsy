"use client"

import { useEffect, useRef, useState, useCallback } from "react"

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
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const initializePlayer = useCallback(() => {
    if (!containerRef.current || !window.YT || !window.YT.Player) return

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
      },
      events: {
        onReady: (event: any) => {
          console.log("YouTube player ready")
          setIsReady(true)
        },
        onStateChange: (event: any) => {
          const state = event.data
          console.log("Player state changed:", state)

          // Start tracking when video is playing
          if (state === window.YT.PlayerState.PLAYING) {
            startProgressTracking()
          } else {
            stopProgressTracking()
          }

          // Handle video ended
          if (state === window.YT.PlayerState.ENDED && !hasCompleted) {
            console.log("Video ended - marking as complete")
            setHasCompleted(true)
            onComplete?.()
          }
        },
        onError: (event: any) => {
          console.error("YouTube player error:", event.data)
        },
      },
    })
  }, [videoId, onComplete, hasCompleted])

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

  // Load YouTube API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initializePlayer()
      return
    }

    // Load YouTube API if not already loaded
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const script = document.createElement("script")
      script.src = "https://www.youtube.com/iframe_api"
      script.async = true
      document.head.appendChild(script)
    }

    // Set up the callback
    window.onYouTubeIframeAPIReady = () => {
      console.log("YouTube API ready")
      initializePlayer()
    }

    return () => {
      stopProgressTracking()
    }
  }, [initializePlayer, stopProgressTracking])

  // Reset completion state when video changes
  useEffect(() => {
    setHasCompleted(false)
    if (playerRef.current && typeof playerRef.current.loadVideoById === "function") {
      playerRef.current.loadVideoById(videoId)
    }
  }, [videoId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgressTracking()
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        playerRef.current.destroy()
      }
    }
  }, [stopProgressTracking])

  return (
    <div className={`youtube-container enhanced-video-container ${className || ""}`}>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
