"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Save, CheckCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface NotesModalProps {
  notes: string
  onSave: (notes: string) => Promise<void>
  isSaving: boolean
  hasUnsavedChanges: boolean
  videoTitle?: string
  trigger?: React.ReactNode
}

export function NotesModal({ notes, onSave, isSaving, hasUnsavedChanges, videoTitle, trigger }: NotesModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localNotes, setLocalNotes] = useState(notes)
  const [localHasChanges, setLocalHasChanges] = useState(false)
  const [mounted, setMounted] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Ensure component is mounted before rendering portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Update local notes when external notes change
  useEffect(() => {
    setLocalNotes(notes)
    setLocalHasChanges(false)
  }, [notes])

  // Track local changes
  useEffect(() => {
    setLocalHasChanges(localNotes.trim() !== notes.trim())
  }, [localNotes, notes])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open")
      // Focus textarea after modal opens
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    } else {
      document.body.classList.remove("modal-open")
    }

    return () => {
      document.body.classList.remove("modal-open")
    }
  }, [isOpen])

  const handleSave = async () => {
    if (!localHasChanges) return

    try {
      await onSave(localNotes.trim())
      setLocalHasChanges(false)

      // Dispatch notes update event
      window.dispatchEvent(new CustomEvent("notesUpdated"))
    } catch (error) {
      console.error("Error saving notes:", error)
    }
  }

  const handleClose = () => {
    if (localHasChanges) {
      const shouldDiscard = confirm("You have unsaved changes. Are you sure you want to close without saving?")
      if (!shouldDiscard) return
    }

    // Reset to original notes if closing without saving
    setLocalNotes(notes)
    setLocalHasChanges(false)
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save with Ctrl/Cmd + S
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault()
      if (localHasChanges && !isSaving) {
        handleSave()
      }
    }

    // Close with Escape (with confirmation if unsaved changes)
    if (e.key === "Escape") {
      e.preventDefault()
      handleClose()
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const modalContent = isOpen ? (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content modal-content-notes" onKeyDown={handleKeyDown}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex-shrink-0 p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold enhanced-heading">
                  <FileText className="h-5 w-5 inline mr-2" />
                  Notes
                </h2>
                {videoTitle && <p className="text-sm text-muted-foreground mt-1 enhanced-text">{videoTitle}</p>}
              </div>
              <div className="flex items-center gap-2">
                {localHasChanges && (
                  <span className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    Unsaved changes
                  </span>
                )}
                <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col p-6 min-h-0">
            <Textarea
              ref={textareaRef}
              placeholder="Write your notes for this video...

Tips:
• Use bullet points for key concepts
• Add timestamps for important moments
• Include your thoughts and questions
• Summarize main takeaways"
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              className="flex-1 min-h-[300px] text-base leading-relaxed enhanced-input resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-6 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{localNotes.length} characters</span>
                <span className="hidden sm:inline">Press Ctrl+S to save</span>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={handleClose} className="enhanced-button">
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !localHasChanges}
                  className={cn("enhanced-button", localHasChanges ? "bg-primary hover:bg-primary/90" : "")}
                >
                  {isSaving ? (
                    <>
                      <div className="loading-spinner mr-2" />
                      Saving...
                    </>
                  ) : localHasChanges ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Notes
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Saved
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {trigger || (
          <Button variant="outline" className="enhanced-button">
            <FileText className="h-4 w-4 mr-2" />
            {notes.trim() ? "Edit Notes" : "Add Note"}
          </Button>
        )}
      </div>
      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  )
}

// Default export for compatibility
export default NotesModal
