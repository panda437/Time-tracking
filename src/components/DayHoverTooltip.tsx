"use client"

import { format } from "date-fns"
import Link from "next/link"

interface TimeEntry {
  id: string
  activity: string
  description?: string
  duration: number
  startTime: string
  category: string
  mood?: string
}

interface DayHoverTooltipProps {
  date: Date
  entries: TimeEntry[]
  isVisible: boolean
  position: { x: number; y: number }
}

interface DayHoverTooltipPropsExtended extends DayHoverTooltipProps {
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export default function DayHoverTooltip({ date, entries, isVisible, position, onMouseEnter, onMouseLeave }: DayHoverTooltipPropsExtended) {
  if (!isVisible || entries.length === 0) return null

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
      other: "bg-gray-500"
    }
    return colors[category] || colors.other
  }

  const visibleEntries = entries.slice(0, 5)
  const hasMore = entries.length > 5

  return (
    <div 
      className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 min-w-[300px] max-w-[350px] animate-scale-in"
      style={{
        left: Math.min(position.x, window.innerWidth - 350),
        top: Math.min(position.y, window.innerHeight - 400),
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">
          {format(date, 'MMMM d, yyyy')}
        </h3>
        <div className="text-xs text-gray-500">
          {entries.length} {entries.length === 1 ? 'activity' : 'activities'}
        </div>
      </div>

      {/* Entries List */}
      <div className="space-y-2 mb-3">
        {visibleEntries.map((entry) => (
          <div key={entry.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
            {/* Category Indicator */}
            <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${getCategoryColor(entry.category)}`}></div>
            
            {/* Entry Details */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {entry.activity}
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{formatDuration(entry.duration)}</span>
                <span>•</span>
                <span className="capitalize">{entry.category}</span>
                {entry.mood && (
                  <>
                    <span>•</span>
                    <span>{entry.mood}</span>
                  </>
                )}
              </div>
              {entry.description && (
                <div className="text-xs text-gray-400 mt-1 truncate">
                  {entry.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* See More Link */}
      {hasMore && (
        <div className="pt-2 border-t border-gray-100">
          <Link 
            href={`/calendar/day/${format(date, 'yyyy-MM-dd')}`}
            className="block w-full text-center py-2 px-3 text-sm font-medium text-[#FF385C] hover:bg-[#FF385C]/5 rounded-lg transition-colors"
          >
            See all {entries.length} activities →
          </Link>
        </div>
      )}

      {/* Triangle pointer */}
      <div className="absolute -bottom-2 left-4 w-4 h-4 bg-white border-r border-b border-gray-200 transform rotate-45"></div>
    </div>
  )
}
