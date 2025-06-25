"use client"

import { useMemo } from "react"

interface TimeEntry {
  id: string
  activity: string
  description?: string
  duration: number
  startTime: string
  endTime: string
  date: string
  category: string
  mood?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface WeeklyOverviewProps {
  entries: TimeEntry[]
}

export default function WeeklyOverview({ entries }: WeeklyOverviewProps) {
  const stats = useMemo(() => {
    const categoryTotals: Record<string, number> = {}
    let totalMinutes = 0
    const moodCounts: Record<string, number> = {}

    entries.forEach((entry) => {
      totalMinutes += entry.duration
      categoryTotals[entry.category] = (categoryTotals[entry.category] || 0) + entry.duration
      
      if (entry.mood) {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1
      }
    })

    const sortedCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    const totalHours = Math.floor(totalMinutes / 60)
    const remainingMinutes = totalMinutes % 60

    return {
      totalTime: `${totalHours}h ${remainingMinutes}m`,
      totalEntries: entries.length,
      categories: sortedCategories,
      topMood: Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || null,
    }
  }, [entries])

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      work: "bg-blue-500",
      personal: "bg-green-500",
      health: "bg-red-500",
      education: "bg-purple-500",
      social: "bg-yellow-500",
      entertainment: "bg-pink-500",
      other: "bg-gray-500",
    }
    return colors[category] || colors.other
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No activities this week yet. Start tracking to see your overview!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-indigo-600">{stats.totalTime}</div>
          <div className="text-sm text-gray-600">Total time tracked</div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.totalEntries}</div>
          <div className="text-sm text-gray-600">Activities logged</div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {stats.topMood || "😊"}
          </div>
          <div className="text-sm text-gray-600">Most common mood</div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Time by Category</h3>
        <div className="space-y-3">
          {stats.categories.map(([category, minutes]) => {
            const percentage = (minutes / (stats.categories.reduce((acc, [, mins]) => acc + mins, 0))) * 100
            
            return (
              <div key={category} className="flex items-center space-x-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium capitalize">{category}</span>
                    <span className="text-gray-600">{formatDuration(minutes)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getCategoryColor(category)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Daily Average */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Daily Average</h3>
        <div className="text-lg font-semibold text-gray-900">
          {formatDuration(Math.round(entries.reduce((acc, entry) => acc + entry.duration, 0) / 7))} per day
        </div>
        <div className="text-sm text-gray-600">
          Based on {entries.length} activities this week
        </div>
      </div>
    </div>
  )
}
