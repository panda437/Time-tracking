"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { format, addDays } from "date-fns"
import Header from "@/components/Header"
import MobileNavigation from "@/components/MobileNavigation"
import EnhancedCalendar from "@/components/EnhancedCalendar"
import TaskEditModal from "@/components/TaskEditModal"
import { Sparkles, Calendar, Zap, Settings } from "lucide-react"

interface TimeEntry {
  id: string
  activity: string
  description?: string
  duration: number
  startTime: string
  endTime: string
  category: string
  mood?: string
  tags: string[]
}

export default function EnhancedCalendarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [centerDate, setCenterDate] = useState<Date>(new Date())
  const [loadingEntries, setLoadingEntries] = useState<boolean>(false)
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiSuccess, setShowAiSuccess] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/auth/signin")
      return
    }

    fetchEntries(centerDate)
  }, [session, status, router, centerDate])

  const fetchEntries = async (dateCenter: Date) => {
    try {
      setLoadingEntries(true)

      // Fetch entries for a 5-day window around the provided center date
      const startDate = addDays(dateCenter, -2)
      const endDate = addDays(dateCenter, 2)
      const startStr = format(startDate, 'yyyy-MM-dd')
      const endStr = format(endDate, 'yyyy-MM-dd')

      const response = await fetch(`/api/entries?start=${startStr}&end=${endStr}`)
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      }
    } catch (error) {
      console.error("Failed to fetch entries:", error)
    } finally {
      setLoading(false)
      setLoadingEntries(false)
    }
  }

  const handleEntryUpdate = async (updatedEntry: TimeEntry) => {
    try {
      const isNewEntry = updatedEntry.id.startsWith('new-')
      
      if (isNewEntry) {
        // Create new entry
        const response = await fetch("/api/entries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            activity: updatedEntry.activity,
            description: updatedEntry.description,
            duration: updatedEntry.duration,
            startTime: updatedEntry.startTime,
            category: updatedEntry.category,
            mood: updatedEntry.mood,
            tags: updatedEntry.tags
          }),
        })
        
        if (response.ok) {
          const newEntry = await response.json()
          setEntries(prev => [...prev, newEntry])
        }
      } else {
        // Update existing entry
        const response = await fetch(`/api/entries/${updatedEntry.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedEntry),
        })
        
        if (response.ok) {
          const updated = await response.json()
          setEntries(prev => prev.map(entry => 
            entry.id === updated.id ? updated : entry
          ))
        }
      }
    } catch (error) {
      console.error("Failed to update entry:", error)
    }
  }

  const handleEntrySelect = (entry: TimeEntry) => {
    setSelectedEntry(entry)
    setIsEditModalOpen(true)
  }

  const handleEntryDelete = async (entryId: string) => {
    try {
      if (!entryId) {
        console.error("Invalid entry ID provided")
        return
      }

      const response = await fetch(`/api/entries/${entryId}`, {
        method: "DELETE",
      })
      
      if (response.ok) {
        setEntries(prev => prev.filter(entry => entry.id !== entryId))
      } else {
        const errorData = await response.json()
        console.error("Delete failed:", errorData)
      }
    } catch (error) {
      console.error("Failed to delete entry:", error)
    }
  }

  const handleAiScheduling = async () => {
    setAiLoading(true)
    try {
      const response = await fetch("/api/ai/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({})
      })
      
      if (response.ok) {
        const result = await response.json()
        
        if (result.success) {
          // Add the new AI-generated entries to the state
          setEntries(prev => [...prev, ...result.entries])
          setShowAiSuccess(true)
          setTimeout(() => setShowAiSuccess(false), 5000)
        } else {
          console.log("AI scheduling result:", result.message)
        }
      }
    } catch (error) {
      console.error("Failed to generate AI schedule:", error)
    } finally {
      setAiLoading(false)
    }
  }

  const handleReschedule = async (entry: TimeEntry) => {
    // For now, this could trigger a specific AI reschedule or open scheduling options
    // You could implement smart rescheduling logic here
    console.log("Reschedule request for:", entry.activity)
    // TODO: Implement smart rescheduling
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-[#F7F7F7] to-[#EBEBEB] flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#FF385C] to-[#E31C5F] rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-[#222222] mb-2">
            Loading your schedule...
          </h2>
          <p className="text-[#767676]">
            Preparing your intelligent calendar view ✨
          </p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-[#F7F7F7] to-[#EBEBEB]">
      <Header user={session.user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 md:pb-8">
        {/* Hero Section */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center space-x-3 bg-white rounded-2xl px-6 py-3 shadow-lg border border-gray-100 mb-6">
            <Calendar className="h-6 w-6 text-[#FF385C]" />
            <span className="text-lg font-medium text-[#222222]">Enhanced Schedule</span>
            <div className="w-2 h-2 bg-[#00A699] rounded-full animate-pulse"></div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-[#222222] mb-4">
            Your Intelligent Calendar 🗓️
          </h1>
          <p className="text-lg text-[#767676] max-w-2xl mx-auto mb-6">
            Drag tasks to reschedule, tap to edit, and let AI optimize your day. Everything syncs in real-time.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={handleAiScheduling}
              disabled={aiLoading}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {aiLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>AI Schedule Tomorrow</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => router.push('/calendar')}
              className="flex items-center space-x-2 px-6 py-3 bg-white text-[#222222] border-2 border-gray-200 rounded-2xl font-semibold hover:border-[#FF385C] hover:text-[#FF385C] transition-all"
            >
              <Settings className="h-5 w-5" />
              <span>Month View</span>
            </button>
          </div>
        </div>

        {/* AI Success Message */}
        {showAiSuccess && (
          <div className="mb-6 animate-slide-up">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900">AI Schedule Generated! ✨</h3>
                  <p className="text-purple-700 text-sm">
                    Tomorrow's tasks have been intelligently planned based on your goals and patterns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Calendar */}
        <div className="animate-slide-up">
          <EnhancedCalendar
            entries={entries}
            onEntryUpdate={handleEntryUpdate}
            onEntrySelect={handleEntrySelect}
            onEntryDelete={handleEntryDelete}
            centerDate={centerDate}
            setCenterDate={setCenterDate}
            loading={loadingEntries}
          />
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-[#222222] mb-2">Drag & Drop</h3>
            <p className="text-sm text-[#767676]">
              Effortlessly reschedule tasks by dragging them to new time slots. Snaps to hourly intervals.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-[#222222] mb-2">AI Powered</h3>
            <p className="text-sm text-[#767676]">
              Get intelligent task suggestions based on your goals, past activities, and optimal timing.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-[#222222] mb-2">Responsive Views</h3>
            <p className="text-sm text-[#767676]">
              Perfect for any device - 2-day view on mobile, 5-day view on desktop.
            </p>
          </div>
        </div>
      </main>

      {/* Task Edit Modal */}
      <TaskEditModal
        entry={selectedEntry}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedEntry(null)
        }}
        onSave={handleEntryUpdate}
        onDelete={handleEntryDelete}
        onReschedule={handleReschedule}
      />

      <MobileNavigation />
    </div>
  )
} 