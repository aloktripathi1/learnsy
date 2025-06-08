"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PlaylistUrlInput } from "@/components/playlist-url-input"
import { Plus, AlertCircle, CheckCircle, X } from "lucide-react"
import { importPlaylistAction } from "@/app/actions/youtube"
import { useAuth } from "@/components/auth-provider"

interface ImportPlaylistModalProps {
  onSuccess?: () => void
  trigger?: React.ReactNode
  playlistLimit?: {
    canImport: boolean
    currentCount: number
    maxCount: number
    remaining: number
  }
}

export function ImportPlaylistModal({
  onSuccess,
  trigger,
  playlistLimit = { canImport: true, currentCount: 0, maxCount: 4, remaining: 4 },
}: ImportPlaylistModalProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [playlistUrl, setPlaylistUrl] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before rendering portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open")
    } else {
      document.body.classList.remove("modal-open")
    }

    return () => {
      document.body.classList.remove("modal-open")
    }
  }, [isOpen])

  const handleImport = async () => {
    if (!playlistUrl.trim() || !user || !playlistLimit.canImport) {
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
        setPlaylistUrl("")
        setImportError(null)
        setImportSuccess(
          result.message ||
            `Successfully imported "${result.course?.title}" with ${result.course?.videoCount || 0} videos!`,
        )

        // Close modal after a short delay to show success message
        setTimeout(() => {
          handleClose()
          if (onSuccess) onSuccess()
        }, 2000)
      } else {
        console.error("Import failed:", result.error)
        setImportError(result.error || "Failed to import playlist")
        setImportSuccess(null)
      }
    } catch (error) {
      console.error("Import error:", error)
      setImportError("An unexpected error occurred. Please try again.")
      setImportSuccess(null)
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    if (isImporting) return // Prevent closing while importing

    setPlaylistUrl("")
    setImportError(null)
    setImportSuccess(null)
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Close with Escape (unless importing)
    if (e.key === "Escape" && !isImporting) {
      e.preventDefault()
      handleClose()
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isImporting) {
      handleClose()
    }
  }

  const modalContent = isOpen ? (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content modal-content-import" onKeyDown={handleKeyDown}>
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold enhanced-heading">
                <Plus className="h-5 w-5 inline mr-2" />
                Import YouTube Playlist
              </h2>
              <p className="text-sm text-muted-foreground mt-1 enhanced-text">
                Add a YouTube playlist to your courses ({playlistLimit.currentCount}/{playlistLimit.maxCount} used)
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose} disabled={isImporting} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          <PlaylistUrlInput
            value={playlistUrl}
            onChange={setPlaylistUrl}
            onImport={handleImport}
            isImporting={isImporting}
            limitReached={!playlistLimit.canImport}
            currentCount={playlistLimit.currentCount}
            maxCount={playlistLimit.maxCount}
          />

          {/* Show import success */}
          {importSuccess && (
            <Alert className="enhanced-card border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-700 dark:text-green-400 enhanced-text">
                {importSuccess}
              </AlertDescription>
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

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-2 p-4 bg-muted/30 rounded-lg">
            <p className="font-medium">How to import a playlist:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Go to YouTube and find the playlist you want to import</li>
              <li>Copy the playlist URL from your browser's address bar</li>
              <li>Paste the URL in the field above</li>
              <li>Click "Import Playlist" to add it to your courses</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-2">
              Note: The playlist must be public or unlisted. Private playlists cannot be imported.
            </p>
          </div>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {trigger || (
          <Button className="enhanced-button" disabled={!playlistLimit.canImport}>
            <Plus className="h-4 w-4 mr-2" />
            Import Playlist
          </Button>
        )}
      </div>
      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  )
}

// Default export for compatibility
export default ImportPlaylistModal
