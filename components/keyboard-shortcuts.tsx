"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

export function KeyboardShortcuts() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return
      }

      // Check if we're on a study page
      const isStudyPage = pathname.includes("/study/")

      switch (event.key.toLowerCase()) {
        case "n":
          if (isStudyPage) {
            event.preventDefault()
            // Trigger next video (would need to be implemented in study page)
            window.dispatchEvent(new CustomEvent("keyboard-next"))
          }
          break

        case "p":
          if (isStudyPage) {
            event.preventDefault()
            // Trigger previous video
            window.dispatchEvent(new CustomEvent("keyboard-prev"))
          }
          break

        case "b":
          if (isStudyPage) {
            event.preventDefault()
            // Trigger bookmark
            window.dispatchEvent(new CustomEvent("keyboard-bookmark"))
          }
          break

        case "c":
          if (isStudyPage) {
            event.preventDefault()
            // Trigger mark complete
            window.dispatchEvent(new CustomEvent("keyboard-complete"))
          }
          break

        case "/":
          event.preventDefault()
          // Focus search input if available
          const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
          if (searchInput) {
            searchInput.focus()
          }
          break

        case "1":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            router.push("/dashboard")
          }
          break

        case "2":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            router.push("/courses")
          }
          break

        case "3":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            router.push("/bookmarks")
          }
          break

        case "4":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            router.push("/notes")
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [router, pathname])

  return null
}
