"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { validatePlaylistUrl } from "@/lib/youtube-server"

interface PlaylistUrlInputProps {
  value: string
  onChange: (value: string) => void
  onImport: () => void
  isImporting: boolean
  limitReached?: boolean
  currentCount?: number
  maxCount?: number
}

export function PlaylistUrlInput({
  value,
  onChange,
  onImport,
  isImporting,
  limitReached = false,
  currentCount = 0,
  maxCount = 4,
}: PlaylistUrlInputProps) {
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; error?: string }>({
    isValid: false,
  })
  const [isTyping, setIsTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)

  // Validate URL when value changes
  useEffect(() => {
    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }

    if (!value.trim()) {
      setValidationResult({ isValid: false })
      return
    }

    setIsTyping(true)

    // Set new timeout
    const timeout = setTimeout(() => {
      const result = validatePlaylistUrl(value)
      setValidationResult(result)
      setIsTyping(false)
    }, 500)

    setTypingTimeout(timeout as NodeJS.Timeout)

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && validationResult.isValid && !isImporting && !limitReached) {
      e.preventDefault()
      onImport()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <Input
            type="url"
            placeholder="https://www.youtube.com/playlist?list=..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full"
            disabled={isImporting || limitReached}
            aria-label="YouTube Playlist URL"
          />
        </div>
        <Button
          onClick={onImport}
          disabled={!validationResult.isValid || isImporting || limitReached}
          className="whitespace-nowrap"
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            "Import Playlist"
          )}
        </Button>
      </div>

      {/* Validation feedback */}
      {value && isTyping && (
        <div className="text-sm text-muted-foreground flex items-center">
          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          Validating URL...
        </div>
      )}

      {value && !isTyping && !validationResult.isValid && validationResult.error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{validationResult.error}</AlertDescription>
        </Alert>
      )}

      {/* Limit reached warning */}
      {limitReached && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            You've reached the maximum of {maxCount} playlists. Please delete a playlist before importing a new one.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
