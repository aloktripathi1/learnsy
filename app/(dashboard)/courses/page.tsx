"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BookOpen, Play, Search, Clock, CheckCircle } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { DatabaseService } from "@/lib/database"
import type { Course } from "@/lib/supabase"

export default function CoursesPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

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
      setCourses(coursesData)
      setFilteredCourses(coursesData)
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
        <h1 className="responsive-heading font-bold tracking-tight">My Courses</h1>
        <p className="text-muted-foreground responsive-text">Manage and continue your learning journey</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 text-base" // Prevents zoom on iOS
        />
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
                ? "Import your first YouTube playlist to get started"
                : "Try adjusting your search terms"}
            </p>
            {courses.length === 0 && (
              <Button onClick={() => router.push("/dashboard")} className="touch-target">
                Import Playlist
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="responsive-grid">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} onContinue={continueCourse} />
          ))}
        </div>
      )}
    </div>
  )
}

function CourseCard({ course, onContinue }: { course: Course; onContinue: (course: Course) => void }) {
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
