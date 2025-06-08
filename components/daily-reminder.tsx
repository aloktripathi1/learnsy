"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, Play, X, Zap, Target } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { DatabaseService } from "@/lib/database"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface DailyReminderProps {
  courses: any[]
  stats: {
    activeStreak: number
    watchedVideos: number
  }
}

export function DailyReminder({ courses, stats }: DailyReminderProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [lastActivity, setLastActivity] = useState<Date | null>(null)
  const [reminderMessage, setReminderMessage] = useState<{
    type: "continue" | "streak" | "inactive" | "welcome" | null
    title: string
    description: string
    action?: string
    actionFn?: () => void
  } | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if (user) {
      loadLastActivity()
    }
  }, [user])

  useEffect(() => {
    if (lastActivity !== null) {
      generateReminderMessage()
    }
  }, [lastActivity, courses, stats])

  const loadLastActivity = async () => {
    if (!user) return

    try {
      // Get the most recent activity from streak data
      const streakData = await DatabaseService.getStreakActivity(user.id)

      if (streakData.length > 0) {
        // Sort by date descending to get the most recent
        const sortedData = streakData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        const mostRecent = sortedData[0]
        setLastActivity(new Date(mostRecent.date))
      } else {
        // No activity yet, set to null to show welcome message
        setLastActivity(null)
      }
    } catch (error) {
      console.error("Error loading last activity:", error)
      setLastActivity(null)
    }
  }

  const generateReminderMessage = () => {
    const now = new Date()
    const today = now.toISOString().split("T")[0]

    // Check if reminder was already dismissed today
    const dismissedToday = localStorage.getItem(`reminder-dismissed-${today}`)
    if (dismissedToday) {
      setIsDismissed(true)
      return
    }

    // No activity yet - welcome message
    if (!lastActivity) {
      setReminderMessage({
        type: "welcome",
        title: "🎯 Ready to start learning?",
        description:
          courses.length > 0
            ? "You have courses ready to explore. Start your learning journey today!"
            : "Import your first YouTube playlist to begin your learning adventure.",
        action: courses.length > 0 ? "Start Learning" : "Import Playlist",
        actionFn: () => {
          if (courses.length > 0) {
            resumeFirstCourse()
          } else {
            // Could trigger import modal or navigate to courses
            router.push("/courses")
          }
        },
      })
      setShowBanner(true)
      return
    }

    const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
    const lastActivityDate = lastActivity.toISOString().split("T")[0]

    // Active today - no reminder needed
    if (lastActivityDate === today) {
      return
    }

    // Yesterday - gentle nudge
    if (daysSinceActivity === 1) {
      if (stats.activeStreak > 0) {
        setReminderMessage({
          type: "streak",
          title: `🔥 Keep your ${stats.activeStreak}-day streak alive!`,
          description: "You watched videos yesterday. Continue your momentum today to maintain your learning streak.",
          action: "Continue Learning",
          actionFn: resumeFirstCourse,
        })
      } else {
        setReminderMessage({
          type: "continue",
          title: "📚 Continue where you left off",
          description: "You made progress yesterday. Pick up where you left off and keep the momentum going.",
          action: "Resume",
          actionFn: resumeFirstCourse,
        })
      }
      setShowBanner(true)
    }
    // 2-3 days - stronger nudge
    else if (daysSinceActivity >= 2 && daysSinceActivity <= 3) {
      setReminderMessage({
        type: "inactive",
        title: `⏰ You've been away for ${daysSinceActivity} days`,
        description:
          stats.activeStreak > 0
            ? `Your ${stats.activeStreak}-day streak is at risk. A quick 5-minute session can get you back on track.`
            : "Your learning journey is waiting. Even a short session can make a difference.",
        action: "Get Back on Track",
        actionFn: resumeFirstCourse,
      })
      setShowBanner(true)
    }
    // 4+ days - motivational message
    else if (daysSinceActivity >= 4) {
      setReminderMessage({
        type: "inactive",
        title: "🌟 Ready to restart your learning?",
        description: `It's been ${daysSinceActivity} days since your last session. Your courses are waiting for you to continue the journey.`,
        action: "Restart Learning",
        actionFn: resumeFirstCourse,
      })
      setShowBanner(true)
    }
  }

  const resumeFirstCourse = async () => {
    if (courses.length === 0) {
      router.push("/courses")
      return
    }

    try {
      const firstCourse = courses[0]
      const videos = await DatabaseService.getVideos(firstCourse.id)
      const progress = await DatabaseService.getUserProgress(user!.id)

      const nextVideo = videos.find((v) => {
        const videoProgress = progress.find((p) => p.video_id === v.video_id)
        return !videoProgress?.completed
      })

      if (nextVideo) {
        router.push(`/study/${firstCourse.id}/${nextVideo.video_id}`)
      } else if (videos.length > 0) {
        router.push(`/study/${firstCourse.id}/${videos[0].video_id}`)
      }
    } catch (error) {
      console.error("Error resuming course:", error)
      router.push("/courses")
    }
  }

  const dismissReminder = () => {
    const today = new Date().toISOString().split("T")[0]
    localStorage.setItem(`reminder-dismissed-${today}`, "true")
    setIsDismissed(true)
    setShowBanner(false)

    // Show a subtle toast confirmation
    toast({
      title: "Reminder dismissed",
      description: "We'll check in with you tomorrow. Happy learning! 📚",
    })
  }

  const handleAction = () => {
    if (reminderMessage?.actionFn) {
      reminderMessage.actionFn()
      dismissReminder()
    }
  }

  // Don't show if dismissed or no message
  if (isDismissed || !reminderMessage || !showBanner) {
    return null
  }

  const getIcon = () => {
    switch (reminderMessage.type) {
      case "welcome":
        return <Target className="h-5 w-5 text-blue-500" />
      case "continue":
        return <Play className="h-5 w-5 text-green-500" />
      case "streak":
        return <Zap className="h-5 w-5 text-orange-500" />
      case "inactive":
        return <Clock className="h-5 w-5 text-amber-500" />
      default:
        return <Calendar className="h-5 w-5 text-primary" />
    }
  }

  const getBorderColor = () => {
    switch (reminderMessage.type) {
      case "welcome":
        return "border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800"
      case "continue":
        return "border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800"
      case "streak":
        return "border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800"
      case "inactive":
        return "border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800"
      default:
        return "border-primary/20 bg-primary/5"
    }
  }

  return (
    <Card
      className={cn(
        "enhanced-card border-2 transition-all duration-300 animate-in slide-in-from-top-2",
        getBorderColor(),
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm md:text-base mb-1 enhanced-heading">{reminderMessage.title}</h3>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed enhanced-text">
              {reminderMessage.description}
            </p>

            {reminderMessage.action && (
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleAction} className="h-8 px-3 text-xs enhanced-button">
                  {reminderMessage.action}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={dismissReminder}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Maybe later
                </Button>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={dismissReminder}
            className="h-6 w-6 text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
