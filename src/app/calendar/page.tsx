"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from "date-fns"
import Header from "@/components/Header"
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
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-6 w-6 text-indigo-600" />
                  <h1 className="text-2xl font-bold text-gray-900">Calendar View</h1>
                </div>
                
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  <h2 className="text-lg font-medium text-gray-900">
                    {format(currentDate, 'MMMM yyyy')}
                  </h2>
                  
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                    className="p-2 text-gray-400 hover:text-gray-600"
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
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map(date => {
                  const dayData = getDayData(date)
                  const isCurrentMonth = isSameMonth(date, currentDate)
                  const isTodayDate = isToday(date)
                  
                  return (
                    <div
                      key={date.toISOString()}
                      className={`
                        min-h-[100px] p-2 border border-gray-200 rounded-lg
                        ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                        ${isTodayDate ? 'ring-2 ring-indigo-500' : ''}
                        ${dayData ? 'hover:bg-blue-50' : ''}
                      `}
                    >
                      <div className={`
                        text-sm font-medium mb-1
                        ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                        ${isTodayDate ? 'text-indigo-600' : ''}
                      `}>
                        {format(date, 'd')}
                      </div>
                      
                      {dayData && (
                        <div className="space-y-1">
                          <div className="text-xs text-gray-600">
                            {formatDuration(dayData.totalDuration)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {dayData.entries.length} activities
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {dayData.categories.slice(0, 3).map(category => (
                              <div
                                key={category}
                                className="w-2 h-2 rounded-full bg-indigo-400"
                                title={category}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
