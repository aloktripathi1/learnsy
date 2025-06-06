"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { DatabaseService } from "@/lib/database"

export function StreakCalendar() {
  const { user } = useAuth()
  const [streakData, setStreakData] = useState<Record<string, number>>({})

  useEffect(() => {
    if (user) {
      loadStreakData()
    }
  }, [user])

  const loadStreakData = async () => {
    if (!user) return

    try {
      const activities = await DatabaseService.getStreakActivity(user.id)
      const data: Record<string, number> = {}

      activities.forEach((activity) => {
        data[activity.date] = activity.videos_watched
      })

      setStreakData(data)
    } catch (error) {
      console.error("Error loading streak data:", error)
    }
  }

  const generateCalendarData = () => {
    const today = new Date()
    const startDate = new Date(today.getFullYear(), 0, 1) // Start of year
    const days = []

    // Calculate days from start of year to today
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const dateString = date.toISOString().split("T")[0]
      const count = streakData[dateString] || 0

      days.push({
        date: dateString,
        count,
        level: count === 0 ? 0 : Math.min(Math.ceil(count / 2), 4),
      })
    }

    return days
  }

  const calendarDays = generateCalendarData()
  const totalDays = calendarDays.length
  const activeDays = calendarDays.filter((day) => day.count > 0).length
  const currentStreak = calculateCurrentStreak()

  function calculateCurrentStreak() {
    const today = new Date()
    let streak = 0

    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateString = date.toISOString().split("T")[0]

      if (streakData[dateString]) {
        streak++
      } else if (i > 0) {
        break
      }
    }

    return streak
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center gap-6 text-sm">
        <div>
          <span className="font-medium">{activeDays}</span>
          <span className="text-muted-foreground ml-1">active days</span>
        </div>
        <div>
          <span className="font-medium">{currentStreak}</span>
          <span className="text-muted-foreground ml-1">day streak</span>
        </div>
        <div>
          <span className="font-medium">{totalDays}</span>
          <span className="text-muted-foreground ml-1">days this year</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="streak-calendar min-w-[800px]">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`streak-day level-${day.level}`}
              title={`${day.date}: ${day.count} videos watched`}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="streak-day" />
          <div className="streak-day level-1" />
          <div className="streak-day level-2" />
          <div className="streak-day level-3" />
          <div className="streak-day level-4" />
        </div>
        <span>More</span>
      </div>
    </div>
  )
}
