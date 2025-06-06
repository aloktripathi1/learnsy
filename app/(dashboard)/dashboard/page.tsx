"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  Bookmark,
  Calendar,
  Play,
  Plus,
  TrendingUp,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  HelpCircle,
} from "lucide-react"
import { StreakCalendar } from "@/components/streak-calendar"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { importPlaylistAction } from "@/app/actions/youtube"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function DashboardPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [playlistUrl, setPlaylistUrl] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const [stats, setStats] = useState({
    watchedVideos: 0,
    activeStreak: 0,
    totalCourses: 0,
    bookmarkedVideos: 0,
  })
  const router = useRouter()

  const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  useEffect(() => {
    if (user && hasSupabase) {
      loadData()
    }
  }, [user, hasSupabase])

  const loadData = async () => {
    if (!user || !hasSupabase) return

    try {
      const { DatabaseService } = await import("@/lib/database")
      const [coursesData, bookmarks, progress] = await Promise.all([
        DatabaseService.getCourses(user.id),
        DatabaseService.getBookmarks(user.id),
        DatabaseService.getUserProgress(user.id),
      ])

      setCourses(coursesData)

      const watchedCount = progress.filter((p) => p.completed).length

      setStats({
        watchedVideos: watchedCount,
        activeStreak: await calculateStreak(),
        totalCourses: coursesData.length,
        bookmarkedVideos: bookmarks.length,
      })
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const calculateStreak = async () => {
    if (!user || !hasSupabase) return 0

    try {
      const { DatabaseService } = await import("@/lib/database")
      const streakData = await DatabaseService.getStreakActivity(user.id)
      const today = new Date().toISOString().split("T")[0]

      let streak = 0
      const currentDate = new Date()

      while (true) {
        const dateString = currentDate.toISOString().split("T")[0]
        const hasActivity = streakData.some((s) => s.date === dateString)

        if (hasActivity) {
          streak++
          currentDate.setDate(currentDate.getDate() - 1)
        } else if (dateString !== today) {
          break
        } else {
          currentDate.setDate(currentDate.getDate() - 1)
        }
      }

      return streak
    } catch (error) {
      console.error("Error calculating streak:", error)
      return 0
    }
  }

  const importPlaylist = async () => {
    if (!playlistUrl.trim() || !user) {
      return
    }

    setIsImporting(true)
    setImportError(null)
    setImportSuccess(null)

    try {
      console.log("Starting import process...")
      const result = await importPlaylistAction(playlistUrl, user.id)

      if (result.success) {
        console.log("Import successful!")
        await loadData()
        setPlaylistUrl("")
        setImportError(null)
        setImportSuccess(
          `Successfully imported "${result.course?.title}" with ${result.course?.videoCount || 0} videos!`,
        )

        // Clear success message after 5 seconds
        setTimeout(() => setImportSuccess(null), 5000)
      } else {
        console.error("Import failed:", result.error)
        setImportError(result.error || "Failed to import playlist")
      }
    } catch (error) {
      console.error("Import error:", error)
      setImportError("Failed to import playlist. Please check the URL and try again.")
    } finally {
      setIsImporting(false)
    }
  }

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
            <strong>Supabase not configured:</strong> Data persistence is disabled.
          </AlertDescription>
        </Alert>
      )}

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
            Total
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
              <CardDescription className="text-sm mt-1 enhanced-text">Add a YouTube playlist</CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10 enhanced-button">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm enhanced-text">
                    Paste a YouTube playlist URL here. Example:
                    https://www.youtube.com/playlist?list=PLillGF-RfqbY3c2r0htQyVbDJJoBFE6Rb
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3">
            <Input
              placeholder="Paste YouTube playlist URL..."
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              className="text-base h-12 enhanced-input"
              disabled={!hasSupabase}
            />
            <Button
              onClick={importPlaylist}
              disabled={isImporting || !playlistUrl.trim() || !hasSupabase}
              className="w-full h-12 text-base enhanced-button"
            >
              {isImporting ? (
                <div className="flex items-center gap-2">
                  <div className="loading-spinner" />
                  Importing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Import Playlist
                </div>
              )}
            </Button>
          </div>

          {/* Show import success */}
          {importSuccess && (
            <Alert className="enhanced-card">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-sm enhanced-text">{importSuccess}</AlertDescription>
            </Alert>
          )}

          {/* Show import error */}
          {importError && (
            <Alert variant="destructive" className="enhanced-card">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-sm enhanced-heading">Import Failed</AlertTitle>
              <AlertDescription className="text-sm enhanced-text">{importError}</AlertDescription>
            </Alert>
          )}

          {/* Example URL */}
          <p className="text-xs text-muted-foreground enhanced-text">
            Example: youtube.com/playlist?list=PLillGF-RfqbY3c2r0htQyVbDJJoBFE6Rb
          </p>
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
                      <Button
                        onClick={() => resumeCourse(course)}
                        size="sm"
                        className="h-8 px-3 text-xs enhanced-button"
                      >
                        Start
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
