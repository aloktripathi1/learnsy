"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Bookmark, Calendar, Play, TrendingUp, Clock, Target, AlertCircle, Plus } from "lucide-react"
import { StreakCalendar } from "@/components/streak-calendar"
import { DailyReminder } from "@/components/daily-reminder"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { checkPlaylistLimit } from "@/app/actions/youtube"
import { Trash2, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ImportPlaylistModal } from "@/components/import-playlist-modal"

export default function DashboardPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [playlistLimit, setPlaylistLimit] = useState({
    canImport: true,
    currentCount: 0,
    maxCount: 4,
    remaining: 4,
  })
  const [stats, setStats] = useState({
    watchedVideos: 0,
    activeStreak: 0,
    totalCourses: 0,
    bookmarkedVideos: 0,
  })
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null)
  const [courseToDelete, setCourseToDelete] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  useEffect(() => {
    if (user && hasSupabase) {
      loadData()
    }
  }, [user, hasSupabase])

  const calculateStreak = async () => {
    if (!user || !hasSupabase) return 0

    try {
      const { DatabaseService } = await import("@/lib/database")
      const streakData = await DatabaseService.getStreakActivity(user.id)

      if (streakData.length === 0) return 0

      // Sort by date descending to start from most recent
      const sortedData = streakData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      const today = new Date().toISOString().split("T")[0]
      let streak = 0
      const currentDate = new Date()

      // Check if user has activity today or yesterday to start counting
      const hasRecentActivity = sortedData.some((s) => {
        const activityDate = new Date(s.date).toISOString().split("T")[0]
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split("T")[0]

        return activityDate === today || activityDate === yesterdayStr
      })

      if (!hasRecentActivity) return 0

      // Count consecutive days backwards from today
      for (let i = 0; i < 365; i++) {
        // Max 365 days to prevent infinite loop
        const dateString = currentDate.toISOString().split("T")[0]
        const hasActivity = sortedData.some((s) => s.date === dateString)

        if (hasActivity) {
          streak++
          currentDate.setDate(currentDate.getDate() - 1)
        } else {
          // If it's today and no activity, don't break the streak yet
          if (dateString === today) {
            currentDate.setDate(currentDate.getDate() - 1)
            continue
          }
          break
        }
      }

      return streak
    } catch (error) {
      console.error("Error calculating streak:", error)
      return 0
    }
  }

  const loadData = async () => {
    if (!user || !hasSupabase) return

    try {
      const { DatabaseService } = await import("@/lib/database")
      const [coursesData, bookmarks, progress, limitCheck] = await Promise.all([
        DatabaseService.getCourses(user.id),
        DatabaseService.getBookmarks(user.id),
        DatabaseService.getUserProgress(user.id),
        checkPlaylistLimit(user.id),
      ])

      // Make sure we update the courses state
      setCourses(coursesData)

      // Ensure we update the playlist limit with the correct count
      setPlaylistLimit({
        ...limitCheck,
        currentCount: coursesData.length, // Ensure this is set correctly from actual courses count
        remaining: Math.max(0, limitCheck.maxCount - coursesData.length),
      })

      // Calculate accurate statistics
      const watchedCount = progress.filter((p) => p.completed === true).length
      const streakCount = await calculateStreak()

      setStats({
        watchedVideos: watchedCount,
        activeStreak: streakCount,
        totalCourses: coursesData.length, // This is the actual count of imported playlists
        bookmarkedVideos: bookmarks.length,
      })

      console.log("Dashboard data loaded:", {
        courses: coursesData.length,
        playlistLimit: {
          currentCount: coursesData.length,
          maxCount: limitCheck.maxCount,
          remaining: Math.max(0, limitCheck.maxCount - coursesData.length),
        },
      })
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  useEffect(() => {
    const handleNotesUpdate = () => {
      console.log("Notes updated, refreshing dashboard...")
      loadData()
    }

    const handleBookmarksUpdate = () => {
      console.log("Bookmarks updated, refreshing dashboard...")
      loadData()
    }

    const handleProgressUpdate = () => {
      console.log("Progress updated, refreshing dashboard...")
      loadData()
    }

    window.addEventListener("notesUpdated", handleNotesUpdate)
    window.addEventListener("bookmarksUpdated", handleBookmarksUpdate)
    window.addEventListener("progressUpdated", handleProgressUpdate)

    return () => {
      window.removeEventListener("notesUpdated", handleNotesUpdate)
      window.removeEventListener("bookmarksUpdated", handleBookmarksUpdate)
      window.removeEventListener("progressUpdated", handleProgressUpdate)
    }
  }, [user, hasSupabase])

  const resumeCourse = async (course: any) => {
    if (!hasSupabase) return

    try {
      const { DatabaseService } = await import("@/lib/database")
      const videos = await DatabaseService.getVideos(course.id)
      const progress = await DatabaseService.getUserProgress(user!.id)

      const nextVideo = videos.find((v) => {
        const videoProgress = progress.find((p) => p.video_id === v.video_id)
        return !videoProgress?.completed
      })

      if (nextVideo) {
        router.push(`/study/${course.id}/${nextVideo.video_id}`)
      } else if (videos.length > 0) {
        // If all videos are completed, go to the first one
        router.push(`/study/${course.id}/${videos[0].video_id}`)
      }
    } catch (error) {
      console.error("Error resuming course:", error)
    }
  }

  const deleteCourse = async (course: any) => {
    if (!user || !hasSupabase) return

    setDeletingCourseId(course.id)

    try {
      const { DatabaseService } = await import("@/lib/database")
      await DatabaseService.deleteCourseWithRelatedData(course.id, user.id)

      // Remove from local state
      setCourses(courses.filter((c) => c.id !== course.id))

      // Update stats and limit check
      await loadData()

      setCourseToDelete(null)
    } catch (error) {
      console.error("Error deleting course:", error)
      alert("Failed to delete course. Please try again.")
    } finally {
      setDeletingCourseId(null)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-3 md:p-8 pb-20 md:pb-8">
      {/* Welcome Section - Enhanced */}
      <div className="space-y-1">
        <h1 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight enhanced-heading">
          Welcome back, {user?.user_metadata?.full_name?.split(" ")[0] || "Learner"}! 👋
        </h1>
        <p className="text-muted-foreground text-sm enhanced-text">Ready to continue your learning journey?</p>
      </div>

      {/* Configuration Alerts */}
      {!hasSupabase && (
        <Alert className="mx-0 enhanced-card">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm enhanced-text">
            <strong>Setup Required:</strong> {error}
            <br />
            <span className="text-sm text-muted-foreground mt-2 block">
              Please configure your Supabase environment variables to enable authentication.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Daily Reminder - New Component */}
      {hasSupabase && <DailyReminder courses={courses} stats={stats} />}

      {/* Stats Cards - Enhanced */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Card className="enhanced-stats-card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs md:text-sm font-medium text-muted-foreground">Videos</div>
            <Play className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </div>
          <div className="text-xl md:text-2xl font-bold enhanced-heading">{stats.watchedVideos}</div>
          <p className="text-xs text-muted-foreground mt-1 enhanced-text">
            <TrendingUp className="inline h-2 w-2 md:h-3 md:w-3 mr-1" />
            Watched
          </p>
        </Card>

        <Card className="enhanced-stats-card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs md:text-sm font-medium text-muted-foreground">Streak</div>
            <Calendar className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </div>
          <div className="text-xl md:text-2xl font-bold enhanced-heading">{stats.activeStreak}</div>
          <p className="text-xs text-muted-foreground mt-1 enhanced-text">
            <Target className="inline h-2 w-2 md:h-3 md:w-3 mr-1" />
            {stats.activeStreak > 0 ? "days" : "Start today!"}
          </p>
        </Card>

        <Card className="enhanced-stats-card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs md:text-sm font-medium text-muted-foreground">Courses</div>
            <BookOpen className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </div>
          <div className="text-xl md:text-2xl font-bold enhanced-heading">{stats.totalCourses}</div>
          <p className="text-xs text-muted-foreground mt-1 enhanced-text">
            <Clock className="inline h-2 w-2 md:h-3 md:w-3 mr-1" />
            {playlistLimit.remaining} remaining
          </p>
        </Card>

        <Card className="enhanced-stats-card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs md:text-sm font-medium text-muted-foreground">Saved</div>
            <Bookmark className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </div>
          <div className="text-xl md:text-2xl font-bold enhanced-heading">{stats.bookmarkedVideos}</div>
          <p className="text-xs text-muted-foreground mt-1 enhanced-text">
            <Bookmark className="inline h-2 w-2 md:h-3 md:w-3 mr-1" />
            Bookmarks
          </p>
        </Card>
      </div>

      {/* Streak Calendar - Enhanced */}
      <Card className="enhanced-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg md:text-xl enhanced-heading">Learning Activity</CardTitle>
          <CardDescription className="text-sm enhanced-text">Your daily learning streak</CardDescription>
        </CardHeader>
        <CardContent className="px-3 md:px-6">
          <StreakCalendar />
        </CardContent>
      </Card>

      {/* Import Playlist - Enhanced */}
      <Card className="enhanced-card">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-lg md:text-xl enhanced-heading">Import Course</CardTitle>
              <CardDescription className="text-sm mt-1 enhanced-text">
                Add a YouTube playlist ({playlistLimit.currentCount}/{playlistLimit.maxCount} used)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImportPlaylistModal
            onSuccess={loadData}
            playlistLimit={playlistLimit}
            trigger={
              <Button className="w-full h-12 enhanced-button" disabled={!playlistLimit.canImport}>
                <Plus className="h-4 w-4 mr-2" />
                {playlistLimit.canImport ? "Import Playlist" : "Limit Reached"}
              </Button>
            }
          />

          {/* Limit Status */}
          <div className="flex items-center justify-between text-sm p-3 bg-muted/30 rounded-lg">
            <span className="text-muted-foreground">
              Playlists: {playlistLimit.currentCount}/{playlistLimit.maxCount}
            </span>
            <span className={`font-medium ${playlistLimit.canImport ? "text-green-600" : "text-orange-600"}`}>
              {playlistLimit.remaining}
            </span>
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-2 p-3 bg-muted/20 rounded-lg">
            <p className="font-medium">Quick Start:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Find a YouTube playlist you want to study</li>
              <li>Copy the playlist URL</li>
              <li>Click "Import Playlist" and paste the URL</li>
              <li>Start learning with progress tracking!</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Recent Courses - Enhanced */}
      {courses.length > 0 && (
        <Card className="enhanced-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg md:text-xl enhanced-heading">Your Courses</CardTitle>
            <CardDescription className="text-sm enhanced-text">Continue where you left off</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {courses.slice(0, 3).map((course) => (
              <div key={course.id} className="flex gap-3 p-3 border rounded-lg bg-card enhanced-card">
                <img
                  src={course.thumbnail || "/placeholder.svg?height=48&width=80"}
                  alt={course.title}
                  className="w-16 h-12 md:w-20 md:h-14 object-cover rounded flex-shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-2">
                  <h3 className="font-medium text-sm md:text-base line-clamp-2 leading-tight enhanced-text">
                    {course.title}
                  </h3>
                  <div className="space-y-1">
                    <Progress value={0} className="h-1.5 md:h-2 enhanced-progress" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground enhanced-text">0% complete</span>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => resumeCourse(course)}
                          size="sm"
                          className="h-8 px-3 text-xs enhanced-button"
                        >
                          Start
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setCourseToDelete(course)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Course
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!courseToDelete} onOpenChange={() => setCourseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{courseToDelete?.title}"? This will permanently remove the course and all
              your progress, bookmarks, and notes for this course.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => courseToDelete && deleteCourse(courseToDelete)}
              disabled={deletingCourseId === courseToDelete?.id}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingCourseId === courseToDelete?.id ? (
                <div className="flex items-center gap-2">
                  <div className="loading-spinner" />
                  Deleting...
                </div>
              ) : (
                "Delete Course"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
