"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BookOpen, Play, Search, Clock, CheckCircle, Trash2, MoreHorizontal, Plus } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { DatabaseService } from "@/lib/database"
import { checkPlaylistLimit } from "@/app/actions/youtube"
import type { Course } from "@/lib/supabase"
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

export default function CoursesPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [playlistLimit, setPlaylistLimit] = useState({
    canImport: true,
    currentCount: 0,
    maxCount: 4,
    remaining: 4,
  })
  const router = useRouter()
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)

  useEffect(() => {
    if (user) {
      loadCourses()
    }
  }, [user])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = courses.filter((course) => course.title.toLowerCase().includes(searchQuery.toLowerCase()))
      setFilteredCourses(filtered)
    } else {
      setFilteredCourses(courses)
    }
  }, [searchQuery, courses])

  const loadCourses = async () => {
    if (!user) return

    try {
      const coursesData = await DatabaseService.getCourses(user.id)

      // Update courses state
      setCourses(coursesData)
      setFilteredCourses(coursesData)

      // Calculate the correct playlist limit values
      const maxCount = 4 // This is the MAX_PLAYLISTS_PER_USER value
      const currentCount = coursesData.length
      const remaining = Math.max(0, maxCount - currentCount)

      // Update the playlist limit state with accurate values
      setPlaylistLimit({
        canImport: currentCount < maxCount,
        currentCount: currentCount,
        maxCount: maxCount,
        remaining: remaining,
      })

      console.log("Courses page data loaded:", {
        courses: coursesData.length,
        playlistLimit: {
          currentCount: currentCount,
          maxCount: maxCount,
          remaining: remaining,
        },
      })
    } catch (error) {
      console.error("Error loading courses:", error)
    } finally {
      setLoading(false)
    }
  }

  const continueCourse = async (course: Course) => {
    try {
      const videos = await DatabaseService.getVideos(course.id)
      const progress = await DatabaseService.getUserProgress(user!.id)

      const nextVideo = videos.find((v) => {
        const videoProgress = progress.find((p) => p.video_id === v.video_id)
        return !videoProgress?.completed
      })

      if (nextVideo) {
        router.push(`/study/${course.id}/${nextVideo.video_id}`)
      } else if (videos.length > 0) {
        // If all videos are completed, go to first video
        router.push(`/study/${course.id}/${videos[0].video_id}`)
      }
    } catch (error) {
      console.error("Error continuing course:", error)
    }
  }

  const deleteCourse = async (course: Course) => {
    if (!user) return

    setDeletingCourseId(course.id)

    try {
      await DatabaseService.deleteCourseWithRelatedData(course.id, user.id)

      // Remove from local state
      setCourses(courses.filter((c) => c.id !== course.id))
      setFilteredCourses(filteredCourses.filter((c) => c.id !== course.id))

      // Refresh limit check
      const limitCheck = await checkPlaylistLimit(user.id)
      setPlaylistLimit(limitCheck)

      setCourseToDelete(null)
    } catch (error) {
      console.error("Error deleting course:", error)
      alert("Failed to delete course. Please try again.")
    } finally {
      setDeletingCourseId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 sm:space-y-8 p-4 sm:p-8 pb-20 md:pb-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="responsive-heading font-bold tracking-tight">My Courses</h1>
            <p className="text-muted-foreground responsive-text">
              Manage and continue your learning journey ({playlistLimit.currentCount}/{playlistLimit.maxCount}{" "}
              playlists)
            </p>
          </div>
          <ImportPlaylistModal
            onSuccess={loadCourses}
            playlistLimit={playlistLimit}
            trigger={
              <Button className="touch-target" disabled={!playlistLimit.canImport}>
                <Plus className="h-4 w-4 mr-2" />
                Import Playlist
              </Button>
            }
          />
        </div>
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-base" // Prevents zoom on iOS
          />
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            <BookOpen className="h-3 w-3 mr-1" />
            {filteredCourses.length} courses
          </Badge>
          <Badge variant={playlistLimit.canImport ? "outline" : "destructive"} className="text-sm">
            {playlistLimit.remaining} slots remaining
          </Badge>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card className="text-center py-8 sm:py-12 mx-0">
          <CardContent>
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="responsive-title font-medium mb-2">
              {courses.length === 0 ? "No courses yet" : "No courses found"}
            </h3>
            <p className="text-muted-foreground responsive-text mb-4">
              {courses.length === 0
                ? `Import your first YouTube playlist to get started (${playlistLimit.remaining} slots available)`
                : "Try adjusting your search terms"}
            </p>
            {courses.length === 0 && playlistLimit.canImport && (
              <ImportPlaylistModal
                onSuccess={loadCourses}
                playlistLimit={playlistLimit}
                trigger={<Button className="touch-target">Import Playlist</Button>}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="responsive-grid">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onContinue={continueCourse}
              onDelete={(course) => setCourseToDelete(course)}
            />
          ))}
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!courseToDelete} onOpenChange={() => setCourseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{courseToDelete?.title}"? This will permanently remove the course and all
              your progress, bookmarks, and notes for this course.
              {!playlistLimit.canImport && (
                <span className="block mt-2 text-sm text-green-600">
                  Deleting this course will free up a slot for importing new playlists.
                </span>
              )}
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

function CourseCard({
  course,
  onContinue,
  onDelete,
}: {
  course: Course
  onContinue: (course: Course) => void
  onDelete: (course: Course) => void
}) {
  const { user } = useAuth()
  const [completedCount, setCompletedCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadProgress()
    }
  }, [user, course.id])

  const loadProgress = async () => {
    if (!user) return

    try {
      const videos = await DatabaseService.getVideos(course.id)
      const progress = await DatabaseService.getUserProgress(user.id)

      const completed = videos.filter((v) => {
        const videoProgress = progress.find((p) => p.video_id === v.video_id)
        return videoProgress?.completed
      }).length

      setCompletedCount(completed)
    } catch (error) {
      console.error("Error loading progress:", error)
    } finally {
      setLoading(false)
    }
  }

  const progressPercent = course.video_count > 0 ? (completedCount / course.video_count) * 100 : 0

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Card className="group hover:shadow-lg transition-shadow touch-target">
      <div className="aspect-video relative overflow-hidden rounded-t-lg">
        <img
          src={course.thumbnail || "/placeholder.svg?height=180&width=320"}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-black/50 text-white text-xs">
            {course.video_count} videos
          </Badge>
        </div>
        <div className="absolute top-3 left-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70">
                <MoreHorizontal className="h-4 w-4 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onDelete(course)} className="text-red-600 focus:text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Course
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="line-clamp-2 responsive-text">{course.title}</CardTitle>
        <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
          <Clock className="h-3 w-3" />
          Added {formatDate(course.created_at)}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            {loading ? (
              <span className="text-muted-foreground">Loading...</span>
            ) : (
              <span className="font-medium">
                {completedCount}/{course.video_count} completed
              </span>
            )}
          </div>
          <Progress value={progressPercent} className="h-2 mobile-progress" />
        </div>

        <div className="flex gap-2">
          <Button onClick={() => onContinue(course)} className="flex-1 touch-target" size="sm" disabled={loading}>
            <Play className="h-4 w-4 mr-2" />
            {progressPercent > 0 ? "Continue" : "Start"}
          </Button>

          {progressPercent === 100 && (
            <Button variant="outline" size="sm" className="touch-target">
              <CheckCircle className="h-4 w-4 text-green-500" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
