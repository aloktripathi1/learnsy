"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Bookmark, Search, Play, Trash2, Clock } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { DatabaseService } from "@/lib/database"

interface BookmarkItem {
  id: string
  video_id: string
  notes: string
  updated_at: string
  videos: {
    id: string
    video_id: string
    title: string
    thumbnail: string
    duration: string
    courses: {
      id: string
      title: string
    }
  }
}

export default function BookmarksPage() {
  const { user } = useAuth()
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredBookmarks, setFilteredBookmarks] = useState<BookmarkItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (user) {
      loadBookmarks()
    }
  }, [user])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = bookmarks.filter(
        (bookmark) =>
          bookmark.videos.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bookmark.videos.courses.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredBookmarks(filtered)
    } else {
      setFilteredBookmarks(bookmarks)
    }
  }, [searchQuery, bookmarks])

  const loadBookmarks = async () => {
    if (!user) return

    try {
      const bookmarksData = await DatabaseService.getBookmarks(user.id)
      setBookmarks(bookmarksData)
      setFilteredBookmarks(bookmarksData)
    } catch (error) {
      console.error("Error loading bookmarks:", error)
    } finally {
      setLoading(false)
    }
  }

  const removeBookmark = async (bookmark: BookmarkItem) => {
    if (!user) return

    try {
      await DatabaseService.updateProgress({
        user_id: user.id,
        video_id: bookmark.video_id,
        bookmarked: false,
      })

      await loadBookmarks()
    } catch (error) {
      console.error("Error removing bookmark:", error)
    }
  }

  const watchVideo = (bookmark: BookmarkItem) => {
    router.push(`/study/${bookmark.videos.courses.id}/${bookmark.video_id}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const groupedBookmarks = filteredBookmarks.reduce(
    (acc, bookmark) => {
      const courseTitle = bookmark.videos.courses.title
      if (!acc[courseTitle]) {
        acc[courseTitle] = []
      }
      acc[courseTitle].push(bookmark)
      return acc
    },
    {} as Record<string, BookmarkItem[]>,
  )

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
        <h1 className="responsive-heading font-bold tracking-tight">Bookmarks</h1>
        <p className="text-muted-foreground responsive-text">Your saved videos for quick access</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search bookmarks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 text-base" // Prevents zoom on iOS
        />
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-4">
        <Badge variant="secondary" className="text-sm">
          <Bookmark className="h-3 w-3 mr-1" />
          {filteredBookmarks.length} bookmarks
        </Badge>
        <Badge variant="outline" className="text-sm">
          {Object.keys(groupedBookmarks).length} courses
        </Badge>
      </div>

      {/* Bookmarks */}
      {filteredBookmarks.length === 0 ? (
        <Card className="text-center py-8 sm:py-12 mx-0">
          <CardContent>
            <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="responsive-title font-medium mb-2">
              {bookmarks.length === 0 ? "No bookmarks yet" : "No bookmarks found"}
            </h3>
            <p className="text-muted-foreground responsive-text mb-4">
              {bookmarks.length === 0
                ? "Bookmark important videos while studying to find them easily later"
                : "Try adjusting your search terms"}
            </p>
            {bookmarks.length === 0 && (
              <Button onClick={() => router.push("/courses")} className="touch-target">
                Browse Courses
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {Object.entries(groupedBookmarks).map(([courseTitle, courseBookmarks]) => (
            <div key={courseTitle}>
              <h2 className="responsive-title font-semibold mb-4">{courseTitle}</h2>
              <div className="grid gap-4">
                {courseBookmarks.map((bookmark) => (
                  <Card key={bookmark.id} className="hover:shadow-md transition-shadow touch-target">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex-1 space-y-2 w-full">
                          <h3 className="font-medium line-clamp-2 responsive-text">{bookmark.videos.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Bookmarked {formatDate(bookmark.updated_at)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Button
                            size="sm"
                            onClick={() => watchVideo(bookmark)}
                            className="flex-1 sm:flex-none touch-target"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Watch
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeBookmark(bookmark)}
                            className="touch-target"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
