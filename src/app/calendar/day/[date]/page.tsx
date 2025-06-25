"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { format, parseISO, isValid } from "date-fns"
import Link from "next/link"
import Header from "@/components/Header"
import AddTaskGapModal from "@/components/AddTaskGapModal"
import { Calendar, ArrowLeft, Clock, Tag, Smile, Edit2, Trash2, Plus } from "lucide-react"

interface TimeEntry {
  id: string
  activity: string
  description?: string
  duration: number
  startTime: string
  endTime: string
  category: string
  mood?: string
  tags: string
}

interface DayViewPageProps {
  params: Promise<{ date: string }>
}

export default function DayViewPage({ params }: DayViewPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [date, setDate] = useState<string>("")
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showGapModal, setShowGapModal] = useState(false)
  const [gapStartTime, setGapStartTime] = useState<Date>(new Date())
  const [gapEndTime, setGapEndTime] = useState<Date>(new Date())

  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params
      setDate(resolvedParams.date)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (status === "loading" || !date) return
    
    if (!session) {
      router.push("/auth/signin")
      return
    }

    fetchDayEntries()
  }, [session, status, router, date])

  const fetchDayEntries = async () => {
    try {
      const response = await fetch(`/api/entries?date=${date}`)
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      }
    } catch (error) {
      console.error("Failed to fetch day entries:", error)
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

  const formatTime = (timeString: string) => {
    try {
      return format(parseISO(timeString), 'h:mm a')
    } catch {
      return timeString
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      work: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
      personal: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
      health: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
      education: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
      social: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
      entertainment: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
      other: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" }
    }
    return colors[category] || colors.other
  }

  const getTotalDuration = () => {
    return entries.reduce((total, entry) => total + entry.duration, 0)
  }

  const getCategoryBreakdown = () => {
    const breakdown: Record<string, number> = {}
    entries.forEach(entry => {
      breakdown[entry.category] = (breakdown[entry.category] || 0) + entry.duration
    })
    return breakdown
  }

  const handleAddTaskInGap = (startTime: Date, endTime: Date) => {
    setGapStartTime(startTime)
    setGapEndTime(endTime)
    setShowGapModal(true)
  }

  const handleTaskAdded = (newTask: any) => {
    // Refresh the entries to include the new task
    fetchDayEntries()
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading day view...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const parsedDate = parseISO(date)
  const isValidDate = isValid(parsedDate)

  if (!isValidDate) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={session.user} />
        <main className="max-w-4xl mx-auto py-6 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Date</h1>
            <Link href="/calendar" className="text-[#FF385C] hover:underline">
              ← Back to Calendar
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const categoryBreakdown = getCategoryBreakdown()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-[#F7F7F7] to-[#EBEBEB]">
      <Header user={session.user} />
      
      <main className="max-w-4xl mx-auto py-6 px-4 pb-32 md:pb-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Link 
              href="/calendar"
              className="flex items-center space-x-2 text-[#767676] hover:text-[#FF385C] transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Calendar</span>
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#FF385C] to-[#E31C5F] px-8 py-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {format(parsedDate, 'EEEE, MMMM d, yyyy')}
                  </h1>
                  <p className="text-white/80">
                    {entries.length} {entries.length === 1 ? 'activity' : 'activities'} • {formatDuration(getTotalDuration())} total
                  </p>
                </div>
              </div>
            </div>

            {/* Day Summary */}
            {entries.length > 0 && (
              <div className="p-8 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Day Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(categoryBreakdown).map(([category, duration]) => {
                    const colors = getCategoryColor(category)
                    return (
                      <div key={category} className={`p-4 rounded-xl border ${colors.bg} ${colors.border}`}>
                        <div className={`text-lg font-semibold ${colors.text}`}>
                          {formatDuration(duration)}
                        </div>
                        <div className="text-sm text-gray-600 capitalize">{category}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

          {/* Timeline View */}
        {entries.length > 0 ? (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Timeline</h2>
              <p className="text-sm text-gray-600 mt-1">Your day's journey, moment by moment</p>
            </div>
            
            <div className="p-6">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#FF385C] via-[#00A699] to-[#FC642D]"></div>
                
                {/* Timeline entries */}
                <div className="space-y-0">
                  {entries
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .map((entry, index, sortedEntries) => {
                      const colors = getCategoryColor(entry.category)
                      const entryStartTime = new Date(entry.startTime)
                      const entryEndTime = new Date(entry.endTime)
                      
                      // Calculate gap from previous entry (in pixels: 1 inch = 96px, so 1 hour = 96px)
                      let gapHeight = 0
                      let gapMinutes = 0
                      let prevEndTime: Date | null = null
                      if (index > 0) {
                        prevEndTime = new Date(sortedEntries[index - 1].endTime)
                        gapMinutes = (entryStartTime.getTime() - prevEndTime.getTime()) / (1000 * 60)
                        gapHeight = Math.max(0, (gapMinutes / 60) * 96) // 96px per hour
                      }
                      
                      return (
                        <div key={entry.id}>
                          {/* Gap spacer with add task option */}
                          {gapHeight > 0 && (
                            <div 
                              style={{ height: `${Math.min(gapHeight, 288)}px` }} // Max 3 hours gap
                              className="relative flex items-center justify-center"
                            >
                              {gapMinutes >= 120 && prevEndTime ? ( // 2+ hours gap
                                <div className="flex items-center space-x-4">
                                  <div className="bg-white px-3 py-2 rounded-full text-sm text-gray-500 border border-gray-200 shadow-sm">
                                    {formatDuration(gapMinutes)} gap
                                  </div>
                                  <button
                                    onClick={() => handleAddTaskInGap(prevEndTime!, entryStartTime)}
                                    className="group bg-[#FF385C] hover:bg-[#E31C5F] text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                                    title="Add task for this time gap"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                  <div className="text-xs text-gray-400 hidden md:block">
                                    What happened here?
                                  </div>
                                </div>
                              ) : gapHeight > 48 ? (
                                <div className="absolute left-6 bg-white px-2 py-1 rounded-full text-xs text-gray-400 border border-gray-200">
                                  {formatDuration(gapMinutes)} break
                                </div>
                              ) : null}
                            </div>
                          )}
                          
                          {/* Timeline entry */}
                          <div className="relative flex items-start space-x-6 pb-6">
                            {/* Timeline dot */}
                            <div className="relative z-10 flex-shrink-0">
                              <div className={`w-6 h-6 rounded-full border-4 border-white shadow-lg ${colors.bg.replace('50', '500')}`}>
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                                  {entry.mood && (
                                    <span className="text-xs">{entry.mood}</span>
                                  )}
                                </div>
                              </div>
                              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-500">
                                {formatTime(entry.startTime)}
                              </div>
                            </div>

                            {/* Entry card */}
                            <div className={`flex-1 p-4 rounded-2xl border-2 ${colors.bg} ${colors.border} hover:shadow-lg transition-all group`}>
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    {entry.activity}
                                  </h3>
                                  {entry.description && (
                                    <p className="text-gray-600 text-sm mb-2">
                                      {entry.description}
                                    </p>
                                  )}
                                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <span className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{formatDuration(entry.duration)}</span>
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                                      {entry.category}
                                    </span>
                                    <span className="text-xs">
                                      {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Action buttons */}
                                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                                    <Edit2 className="h-4 w-4 text-gray-600 hover:text-[#FF385C]" />
                                  </button>
                                  <button className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                                    <Trash2 className="h-4 w-4 text-gray-600 hover:text-red-500" />
                                  </button>
                                </div>
                              </div>
                              
                              {(() => {
                                try {
                                  const parsedTags = entry.tags ? JSON.parse(entry.tags) : []
                                  return parsedTags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {parsedTags.map((tag: string, tagIndex: number) => (
                                        <span key={tagIndex} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                          #{tag}
                                        </span>
                                      ))}
                                    </div>
                                  )
                                } catch {
                                  return null
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No activities recorded
            </h2>
            <p className="text-gray-600 mb-6">
              You didn't track any activities on this day.
            </p>
            <Link 
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 bg-[#FF385C] text-white rounded-xl hover:bg-[#E31C5F] transition-colors"
            >
              Start tracking today →
            </Link>
          </div>
        )}
      </main>
      
      {/* Add Task Gap Modal */}
      <AddTaskGapModal
        isOpen={showGapModal}
        onClose={() => setShowGapModal(false)}
        startTime={gapStartTime}
        endTime={gapEndTime}
        onTaskAdded={handleTaskAdded}
      />
    </div>
  )
}
