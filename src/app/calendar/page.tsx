"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from "date-fns"
import Header from "@/components/Header"
import MobileNavigation from "@/components/MobileNavigation"
import DayHoverTooltip from "@/components/DayHoverTooltip"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

interface CalendarDay {
  date: string
  entries: any[]
  totalDuration: number
  categories: string[]
}

interface CalendarData {
  view: string
  period: {
    start: string
    end: string
  }
  days: CalendarDay[]
  summary: {
    totalDuration: number
    totalEntries: number
    categories: Record<string, number>
    averageDailyDuration: number
  }
}

export default function CalendarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoveredDay, setHoveredDay] = useState<{ date: Date; entries: any[]; position: { x: number; y: number } } | null>(null)

  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/auth/signin")
      return
    }

    fetchCalendarData()
  }, [session, status, router, currentDate])

  const fetchCalendarData = async () => {
    try {
      const response = await fetch(`/api/calendar?view=month&date=${format(currentDate, 'yyyy-MM-dd')}`)
      if (response.ok) {
        const data = await response.json()
        setCalendarData(data)
      }
    } catch (error) {
      console.error("Failed to fetch calendar data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getDayData = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return calendarData?.days.find(day => day.date === dateKey)
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 md:pb-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="bg-white overflow-hidden shadow-lg rounded-2xl">
            <div className="px-4 py-5 sm:p-6">
              {/* Mobile-friendly header layout */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#FF385C] to-[#E31C5F] rounded-xl flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Calendar</h1>
                </div>
                
                {/* Month navigation - centered on mobile */}
                <div className="flex items-center justify-center sm:justify-end space-x-4">
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                    className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 min-w-[140px] text-center">
                    {format(currentDate, 'MMMM yyyy')}
                  </h2>
                  
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                    className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Month Summary */}
              {calendarData && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-lg font-semibold text-blue-600">
                      {formatDuration(calendarData.summary.totalDuration)}
                    </div>
                    <div className="text-sm text-gray-600">Total Time</div>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-lg font-semibold text-green-600">
                      {calendarData.summary.totalEntries}
                    </div>
                    <div className="text-sm text-gray-600">Activities</div>
                  </div>
                  
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-lg font-semibold text-purple-600">
                      {formatDuration(calendarData.summary.averageDailyDuration)}
                    </div>
                    <div className="text-sm text-gray-600">Daily Average</div>
                  </div>
                  
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-lg font-semibold text-yellow-600">
                      {Object.keys(calendarData.summary.categories).length}
                    </div>
                    <div className="text-sm text-gray-600">Categories</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white overflow-hidden shadow-lg rounded-2xl">
            <div className="p-3 sm:p-6">
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-3 sm:mb-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="p-2 text-center text-xs sm:text-sm font-semibold text-gray-600 bg-gray-50 rounded-lg">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {monthDays.map(date => {
                  const dayData = getDayData(date)
                  const isCurrentMonth = isSameMonth(date, currentDate)
                  const isTodayDate = isToday(date)
                  
                  return (
                    <div
                      key={date.toISOString()}
                      className={`
                        aspect-square min-h-[60px] sm:min-h-[80px] lg:min-h-[90px] p-1 sm:p-2 lg:p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 relative overflow-hidden
                        ${isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}
                        ${isTodayDate ? 'ring-2 ring-[#FF385C] border-[#FF385C]' : ''}
                        ${dayData ? 'hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 hover:shadow-lg active:scale-95' : 'hover:bg-gray-100'}
                      `}
                      onMouseEnter={(e) => {
                        if (dayData && dayData.entries.length > 0) {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setHoveredDay({
                            date,
                            entries: dayData.entries,
                            position: {
                              x: rect.right - 5,
                              y: rect.top
                            }
                          })
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredDay(null)
                      }}
                      onClick={() => {
                        router.push(`/calendar/day/${format(date, 'yyyy-MM-dd')}`)
                      }}
                    >
                      <div className={`
                        text-sm font-medium mb-1
                        ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                        ${isTodayDate ? 'text-indigo-600' : ''}
                      `}>
                        {format(date, 'd')}
                      </div>
                      
                      {dayData && (
                        <>
                          {/* Desktop: Categories only */}
                          <div className="hidden lg:flex flex-col items-start space-y-1 mt-1 w-full">
                            <div className="flex flex-wrap gap-1 w-full">
                              {[...new Set(dayData.categories)].slice(0, 2).map((category, i) => (
                                <span
                                  key={i}
                                  className={`px-1 py-0.5 rounded text-[9px] font-medium truncate max-w-full ${
                                    category === 'work' ? 'bg-blue-100 text-blue-800' :
                                    category === 'personal' ? 'bg-green-100 text-green-800' :
                                    category === 'health' ? 'bg-red-100 text-red-800' :
                                    category === 'education' ? 'bg-purple-100 text-purple-800' :
                                    category === 'social' ? 'bg-yellow-100 text-yellow-800' :
                                    category === 'entertainment' ? 'bg-pink-100 text-pink-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {category}
                                </span>
                              ))}
                              {[...new Set(dayData.categories)].length > 2 && (
                                <span className="text-[9px] text-gray-500 font-medium">
                                  +{[...new Set(dayData.categories)].length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Mobile: Activity dots only */}
                          <div className="lg:hidden flex items-center justify-center mt-1">
                            <div className="flex space-x-1">
                              {dayData.entries.length <= 2 ? (
                                // Show individual dots for 1-2 activities
                                Array.from({ length: dayData.entries.length }, (_, i) => (
                                  <div
                                    key={i}
                                    className="w-1.5 h-1.5 rounded-full bg-[#FF385C]"
                                  />
                                ))
                              ) : (
                                // Show 2 dots + number for 3+ activities
                                <>
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF385C]" />
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF385C]" />
                                  <span className="text-[10px] font-medium text-[#FF385C] ml-1">+{dayData.entries.length - 2}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Hover Tooltip */}
      {hoveredDay && (
        <DayHoverTooltip
          date={hoveredDay.date}
          entries={hoveredDay.entries}
          isVisible={true}
          position={hoveredDay.position}
          onMouseEnter={() => {
            // Keep tooltip visible when hovering over it
          }}
          onMouseLeave={() => {
            setHoveredDay(null)
          }}
        />
      )}
      
      {/* Mobile Navigation */}
      <MobileNavigation />
    </div>
  )
}
