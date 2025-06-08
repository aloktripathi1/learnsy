"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FileText, Search, Edit3, Trash2, Save, X, Play, Clock, BookOpen } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { DatabaseService } from "@/lib/database"

interface NoteItem {
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

export default function NotesPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredNotes, setFilteredNotes] = useState<NoteItem[]>([])
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (user) {
      loadNotes()
    }
  }, [user, refreshKey])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = notes.filter(
        (note) =>
          note.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.videos.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.videos.courses.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredNotes(filtered)
    } else {
      setFilteredNotes(notes)
    }
  }, [searchQuery, notes])

  // Listen for notes updates from other components
  useEffect(() => {
    const handleNotesUpdate = () => {
      console.log("Notes update event received, refreshing...")
      setRefreshKey((prev) => prev + 1)
    }

    window.addEventListener("notesUpdated", handleNotesUpdate)
    return () => window.removeEventListener("notesUpdated", handleNotesUpdate)
  }, [])

  const loadNotes = async () => {
    if (!user) return

    try {
      console.log("Loading notes for user:", user.id)
      const notesData = await DatabaseService.getNotes(user.id)
      console.log("Raw notes data:", notesData)

      // Filter and map the data to ensure we have valid notes
      const validNotes = notesData
        .filter((note) => note.notes && note.notes.trim() !== "" && note.videos)
        .map((note) => ({
          ...note,
          videos: Array.isArray(note.videos) ? note.videos[0] : note.videos,
        }))

      console.log("Valid notes after processing:", validNotes)
      setNotes(validNotes)
      setFilteredNotes(validNotes)
    } catch (error) {
      console.error("Error loading notes:", error)
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (note: NoteItem) => {
    setEditingNote(note.id)
    setEditContent(note.notes)
  }

  const cancelEditing = () => {
    setEditingNote(null)
    setEditContent("")
  }

  const saveNote = async (note: NoteItem) => {
    if (!user) return

    try {
      await DatabaseService.updateProgress({
        user_id: user.id,
        video_id: note.video_id,
        notes: editContent,
      })

      // Refresh the notes list
      await loadNotes()
      setEditingNote(null)
      setEditContent("")

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent("notesUpdated"))
    } catch (error) {
      console.error("Error saving note:", error)
    }
  }

  const deleteNote = async (note: NoteItem) => {
    if (!user) return

    try {
      await DatabaseService.updateProgress({
        user_id: user.id,
        video_id: note.video_id,
        notes: "",
      })

      // Refresh the notes list
      await loadNotes()

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent("notesUpdated"))
    } catch (error) {
      console.error("Error deleting note:", error)
    }
  }

  const watchVideo = (note: NoteItem) => {
    router.push(`/study/${note.videos.courses.id}/${note.video_id}`)
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

  const groupedNotes = filteredNotes.reduce(
    (acc, note) => {
      // Ensure we have valid video and course data
      if (!note.videos || !note.videos.courses) {
        console.warn("Note missing video or course data:", note)
        return acc
      }

      const courseTitle = note.videos.courses.title || "Unknown Course"
      if (!acc[courseTitle]) {
        acc[courseTitle] = []
      }
      acc[courseTitle].push(note)
      return acc
    },
    {} as Record<string, NoteItem[]>,
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
        <h1 className="responsive-heading font-bold tracking-tight">Notes</h1>
        <p className="text-muted-foreground responsive-text">Your learning notes organized by course</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 text-base" // Prevents zoom on iOS
        />
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-4">
        <Badge variant="secondary" className="text-sm">
          <FileText className="h-3 w-3 mr-1" />
          {filteredNotes.length} notes
        </Badge>
        <Badge variant="outline" className="text-sm">
          <BookOpen className="h-3 w-3 mr-1" />
          {Object.keys(groupedNotes).length} courses
        </Badge>
      </div>

      {/* Notes */}
      {filteredNotes.length === 0 ? (
        <Card className="text-center py-8 sm:py-12 mx-0">
          <CardContent>
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="responsive-title font-medium mb-2">
              {notes.length === 0 ? "No notes yet" : "No notes found"}
            </h3>
            <p className="text-muted-foreground responsive-text mb-4">
              {notes.length === 0
                ? "Take notes while studying to capture important insights and concepts"
                : "Try adjusting your search terms"}
            </p>
            {notes.length === 0 && (
              <Button onClick={() => router.push("/courses")} className="touch-target">
                Start Learning
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {Object.entries(groupedNotes).map(([courseTitle, courseNotes]) => (
            <div key={courseTitle}>
              <h2 className="responsive-title font-semibold mb-4">{courseTitle}</h2>
              <div className="grid gap-4">
                {courseNotes.map((note) => (
                  <Card key={note.id} className="hover:shadow-md transition-shadow touch-target">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex-1 w-full">
                          <CardTitle className="responsive-text line-clamp-1">{note.videos.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3" />
                            Updated {formatDate(note.updated_at)}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Button variant="outline" size="sm" onClick={() => watchVideo(note)} className="touch-target">
                            <Play className="h-4 w-4" />
                          </Button>
                          {editingNote === note.id ? (
                            <>
                              <Button size="sm" onClick={() => saveNote(note)} className="touch-target">
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={cancelEditing} className="touch-target">
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditing(note)}
                                className="touch-target"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteNote(note)}
                                className="touch-target"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {editingNote === note.id ? (
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[120px] text-base" // Prevents zoom on iOS
                          placeholder="Edit your note..."
                        />
                      ) : (
                        <div className="whitespace-pre-wrap responsive-text leading-relaxed">{note.notes}</div>
                      )}
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
