"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Bookmark,
  BookmarkCheck,
  Play,
  Clock,
  FileText,
  Award,
  List,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { DatabaseService } from "@/lib/database"
import type { Course, Video, UserProgress } from "@/lib/supabase"

interface VideoWithProgress extends Video {
  completed: boolean
  bookmarked: boolean
  notes: string
}

export default function StudyPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [videos, setVideos] = useState<VideoWithProgress[]>([])
  const [currentVideo, setCurrentVideo] = useState<VideoWithProgress | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [notes, setNotes] = useState("")
  const [showCertificate, setShowCertificate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (user) {
      loadStudyData()
    }
  }, [user, params.playlistId, params.videoId])

  useEffect(() => {
    // Listen for keyboard shortcuts (desktop only)
    if (!isMobile) {
      const handleKeyboard = (event: CustomEvent) => {
        switch (event.type) {
          case "keyboard-next":
            navigateVideo("next")
            break
          case "keyboard-prev":
            navigateVideo("prev")
            break
          case "keyboard-bookmark":
            toggleBookmark()
            break
          case "keyboard-complete":
            markComplete()
            break
        }
      }

      window.addEventListener("keyboard-next" as any, handleKeyboard)
      window.addEventListener("keyboard-prev" as any, handleKeyboard)
      window.addEventListener("keyboard-bookmark" as any, handleKeyboard)
      window.addEventListener("keyboard-complete" as any, handleKeyboard)

      return () => {
        window.removeEventListener("keyboard-next" as any, handleKeyboard)
        window.removeEventListener("keyboard-prev" as any, handleKeyboard)
        window.removeEventListener("keyboard-bookmark" as any, handleKeyboard)
        window.removeEventListener("keyboard-complete" as any, handleKeyboard)
      }
    }
  }, [currentVideo, isMobile])

  const loadStudyData = async () => {
    if (!user) return

    try {
      const courses = await DatabaseService.getCourses(user.id)
      const foundCourse = courses.find((c) => c.id === params.playlistId)

      if (!foundCourse) {
        router.push("/courses")
        return
      }

      setCourse(foundCourse)

      const videosData = await DatabaseService.getVideos(foundCourse.id)
      const progressData = await DatabaseService.getUserProgress(user.id)

      const videosWithProgress: VideoWithProgress[] = videosData.map((video) => {
        const progress = progressData.find((p) => p.video_id === video.video_id)
        return {
          ...video,
          completed: progress?.completed || false,
          bookmarked: progress?.bookmarked || false,
          notes: progress?.notes || "",
        }
      })

      setVideos(videosWithProgress)

      const videoIndex = videosWithProgress.findIndex((v) => v.video_id === params.videoId)
      if (videoIndex !== -1) {
        setCurrentIndex(videoIndex)
        setCurrentVideo(videosWithProgress[videoIndex])
        setNotes(videosWithProgress[videoIndex].notes || "")
      }
    } catch (error) {
      console.error("Error loading study data:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateVideoProgress = async (updates: Partial<UserProgress>) => {
    if (!user || !currentVideo) return

    try {
      await DatabaseService.updateProgress({
        user_id: user.id,
        video_id: currentVideo.video_id,
        ...updates,
      })

      // Update local state
      const updatedVideos = [...videos]
      updatedVideos[currentIndex] = { ...currentVideo, ...updates }
      setVideos(updatedVideos)
      setCurrentVideo({ ...currentVideo, ...updates })
    } catch (error) {
      console.error("Error updating progress:", error)
    }
  }

  const markComplete = async () => {
    if (!user || !currentVideo || currentVideo.completed) return

    await updateVideoProgress({ completed: true, completed_at: new Date().toISOString() })

    // Update streak
    const today = new Date().toISOString().split("T")[0]
    await DatabaseService.updateStreakActivity(user.id, today)

    // Check if course is completed
    const completedCount = videos.filter((v) => v.completed || v.video_id === currentVideo.video_id).length
    if (completedCount === videos.length) {
      setShowCertificate(true)
    }
  }

  const toggleBookmark = async () => {
    if (!currentVideo) return

    const newBookmarkState = !currentVideo.bookmarked
    await updateVideoProgress({ bookmarked: newBookmarkState })
  }

  const saveNotes = async () => {
    if (!currentVideo) return

    await updateVideoProgress({ notes })
  }

  const navigateVideo = (direction: "prev" | "next") => {
    const newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1
    if (newIndex >= 0 && newIndex < videos.length) {
      const newVideo = videos[newIndex]
      router.push(`/study/${course!.id}/${newVideo.video_id}`)
    }
  }

  const jumpToVideo = (videoId: string) => {
    router.push(`/study/${course!.id}/${videoId}`)
    setShowMobileMenu(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner" />
      </div>
    )
  }

  if (!course || !currentVideo) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h2 className="responsive-title font-semibold mb-2">Video not found</h2>
          <Button onClick={() => router.push("/courses")} className="touch-target">
            Back to Courses
          </Button>
        </div>
      </div>
    )
  }

  const completedCount = videos.filter((v) => v.completed).length
  const progressPercent = (completedCount / videos.length) * 100

  // Mobile Layout - Completely Optimized
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-background">
        {/* Mobile Header - Compact */}
        <div className="flex items-center justify-between p-2 border-b bg-background/95 backdrop-blur">
          <Button variant="ghost" size="icon" onClick={() => router.push("/courses")} className="h-10 w-10">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 text-center px-2">
            <h1 className="font-semibold text-sm truncate">{course.title}</h1>
            <p className="text-xs text-muted-foreground">
              {currentIndex + 1} of {videos.length}
            </p>
          </div>
          <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <List className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-96 p-0">
              <div className="p-4 border-b">
                <SheetTitle className="text-lg">Course Content</SheetTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {completedCount} of {videos.length} completed
                </p>
              </div>
              <div className="p-4 space-y-2 max-h-[calc(100vh-120px)] overflow-auto">
                {videos.map((video, index) => (
                  <div
                    key={video.id}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-colors",
                      video.video_id === currentVideo.video_id ? "bg-primary/10 border-primary" : "hover:bg-muted",
                      video.completed && "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
                    )}
                    onClick={() => jumpToVideo(video.video_id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {video.completed ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Play className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium line-clamp-2">{video.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">{video.duration}</div>
                      </div>
                      {video.bookmarked && <Bookmark className="h-3 w-3 text-yellow-500 flex-shrink-0" />}
                    </div>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Video Player - Optimized for Mobile */}
        <div className="relative bg-black">
          <div className="youtube-container mx-2 mt-2">
            <iframe
              src={`https://www.youtube.com/embed/${currentVideo.video_id}?rel=0&modestbranding=1&iv_load_policy=3`}
              title={currentVideo.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg"
            />
          </div>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-auto">
          {/* Video Info - Compact */}
          <div className="p-3 border-b">
            <h1 className="text-base md:text-lg font-bold mb-2 line-clamp-2 leading-tight">{currentVideo.title}</h1>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {currentVideo.duration}
              </span>
              <span>{Math.round(progressPercent)}% complete</span>
            </div>
            <Progress value={progressPercent} className="mt-2 h-1.5" />
          </div>

          {/* Action Buttons - Mobile Optimized */}
          <div className="p-3 space-y-3">
            {/* Primary Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={markComplete}
                disabled={currentVideo.completed}
                className={cn("h-12 text-sm font-medium", currentVideo.completed && "bg-green-600 hover:bg-green-700")}
              >
                {currentVideo.completed ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Completed
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Mark Complete
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={toggleBookmark}
                className={cn(
                  "h-12 text-sm font-medium",
                  currentVideo.bookmarked &&
                    "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400",
                )}
              >
                {currentVideo.bookmarked ? (
                  <BookmarkCheck className="h-4 w-4 mr-2" />
                ) : (
                  <Bookmark className="h-4 w-4 mr-2" />
                )}
                {currentVideo.bookmarked ? "Saved" : "Save"}
              </Button>
            </div>

            {/* Navigation */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => navigateVideo("prev")}
                disabled={currentIndex === 0}
                className="h-10 text-sm"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <Button
                variant="outline"
                onClick={() => navigateVideo("next")}
                disabled={currentIndex === videos.length - 1}
                className="h-10 text-sm"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Notes Section - Collapsible */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <h3 className="font-medium text-sm">Notes</h3>
              </div>
              <Textarea
                placeholder="Add your notes for this video..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px] text-sm resize-none"
              />
              <Button onClick={saveNotes} variant="outline" className="w-full h-10 text-sm">
                Save Notes
              </Button>
            </div>
          </div>
        </div>

        {/* Certificate Modal - Mobile Optimized */}
        {showCertificate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-sm">
              <CardHeader className="text-center pb-4">
                <Award className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                <CardTitle className="text-lg">Congratulations! 🎉</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-3 pt-0">
                <p className="text-sm">You've successfully completed</p>
                <p className="font-semibold">{course.title}</p>
                <p className="text-xs text-muted-foreground">You watched all {videos.length} videos in this course!</p>
                <Button onClick={() => setShowCertificate(false)} className="w-full h-10">
                  Continue Learning
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  // Desktop Layout (existing layout)
  return (
    <div className="flex h-screen">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col p-6">
        {/* Video Player */}
        <div className="youtube-container mb-6">
          <iframe
            src={`https://www.youtube.com/embed/${currentVideo.video_id}?rel=0&modestbranding=1&iv_load_policy=3`}
            title={currentVideo.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Video Info */}
        <div className="space-y-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{currentVideo.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {currentVideo.duration}
              </span>
              <span>
                Video {currentIndex + 1} of {videos.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Progress value={progressPercent} className="flex-1" />
            <span className="text-sm font-medium">{Math.round(progressPercent)}% Complete</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigateVideo("prev")} disabled={currentIndex === 0}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <Button
            onClick={markComplete}
            disabled={currentVideo.completed}
            className={cn(currentVideo.completed && "bg-green-600 hover:bg-green-700")}
          >
            {currentVideo.completed ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Completed
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Mark Complete
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={toggleBookmark}
            className={cn(
              currentVideo.bookmarked &&
                "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400",
            )}
          >
            {currentVideo.bookmarked ? (
              <BookmarkCheck className="h-4 w-4 mr-2" />
            ) : (
              <Bookmark className="h-4 w-4 mr-2" />
            )}
            {currentVideo.bookmarked ? "Bookmarked" : "Bookmark"}
          </Button>

          <Button variant="outline" onClick={() => navigateVideo("next")} disabled={currentIndex === videos.length - 1}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Right Sidebar - Desktop Only */}
      <div className="w-96 border-l bg-muted/30 flex flex-col">
        {/* Course Progress */}
        <div className="p-4 border-b">
          <h2 className="font-semibold mb-2">{course.title}</h2>
          <div className="text-sm text-muted-foreground mb-2">
            {completedCount} of {videos.length} videos completed
          </div>
          <Progress value={progressPercent} />
        </div>

        {/* Video List */}
        <div className="flex-1 overflow-auto p-4">
          <h3 className="font-medium mb-3">Course Content</h3>
          <div className="space-y-2">
            {videos.map((video, index) => (
              <div
                key={video.id}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-colors",
                  video.video_id === currentVideo.video_id ? "bg-primary/10 border-primary" : "hover:bg-muted",
                  video.completed && "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
                )}
                onClick={() => jumpToVideo(video.video_id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {video.completed ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Play className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium line-clamp-2">{video.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{video.duration}</div>
                  </div>
                  {video.bookmarked && <Bookmark className="h-3 w-3 text-yellow-500 flex-shrink-0" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes Section */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4" />
            <h3 className="font-medium">Notes</h3>
          </div>
          <Textarea
            placeholder="Add your notes for this video..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mb-3 min-h-[100px]"
          />
          <Button onClick={saveNotes} size="sm" className="w-full">
            Save Notes
          </Button>
        </div>
      </div>

      {/* Certificate Modal */}
      {showCertificate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <CardHeader className="text-center">
              <Award className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <CardTitle>Congratulations! 🎉</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p>You've successfully completed</p>
              <p className="font-semibold text-lg">{course.title}</p>
              <p className="text-sm text-muted-foreground">You watched all {videos.length} videos in this course!</p>
              <Button onClick={() => setShowCertificate(false)} className="w-full">
                Continue Learning
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
