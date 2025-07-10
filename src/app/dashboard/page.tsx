"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import TimeEntryForm from "@/components/TimeEntryForm"
import EnhancedTimeEntry from "@/components/EnhancedTimeEntry"
import TimeEntryList from "@/components/TimeEntryList"
import WeeklyOverview from "@/components/WeeklyOverview"
import Header from "@/components/Header"
import OnboardingModal from "@/components/OnboardingModal"
import InstallPrompt from "@/components/InstallPrompt"
import MobileNavigation from "@/components/MobileNavigation"
import { useInstallPrompt } from "@/hooks/useInstallPrompt"
import { trackTaskMilestone } from "@/components/GoogleAnalytics"

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

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [userGoals, setUserGoals] = useState<string[]>([])
  const [useTimeSlots, setUseTimeSlots] = useState(false)
  
  // Install prompt hook
  const { showInstallPrompt, triggerAfterFirstTask, dismissInstallPrompt } = useInstallPrompt()

  useEffect(() => {
    if (status === "loading") return
    
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && session) {
      fetchEntries()
      checkUserGoals()
    }
  }, [session, status, router])

  const checkUserGoals = async () => {
    try {
      const response = await fetch("/api/goals")
      if (response.ok) {
        const goals = await response.json()
        setUserGoals(goals.map((g: any) => g.goal))
        // Show onboarding if user has no goals and no entries
        if (goals.length === 0) {
          // Check if user has any entries to determine if they're truly new
          const entriesResponse = await fetch("/api/entries")
          if (entriesResponse.ok) {
            const allEntries = await entriesResponse.json()
            if (allEntries.length === 0) {
              setShowOnboarding(true)
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch user goals:", error)
    }
  }

  const handleSaveGoals = async (goals: string[]) => {
    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ goals }),
      })
      
      if (response.ok) {
        setUserGoals(goals)
        setShowOnboarding(false)

        // If user had zero entries, redirect them to first entry modal in calendar view
        if (entries.length === 0 && goals.length > 0) {
          const today = new Date().toISOString().split('T')[0]
          router.replace(`/calendar/day/${today}?firstEntry=true`)
        }
      }
    } catch (error) {
      console.error("Failed to save goals:", error)
    }
  }

  const fetchEntries = async () => {
    try {
      const response = await fetch("/api/entries?period=week")
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      }
    } catch (error) {
      console.error("Failed to fetch entries:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEntryAdded = (newEntry: TimeEntry) => {
    setEntries([newEntry, ...entries])
    
    // Trigger install prompt after first task creation
    triggerAfterFirstTask()
    
    // Track task milestone for analytics
    const newTaskCount = entries.length + 1
    trackTaskMilestone(newTaskCount)
  }

  const isFirstEntry = entries.length === 0 && userGoals.length > 0

  const handleEntryUpdated = (updatedEntry: TimeEntry) => {
    setEntries(entries.map(entry => 
      entry.id === updatedEntry.id ? updatedEntry : entry
    ))
  }

  const handleEntryDeleted = (deletedId: string) => {
    setEntries(entries.filter(entry => entry.id !== deletedId))
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-[#F7F7F7] to-[#EBEBEB] flex items-center justify-center">
        <div className="text-center animate-pulse">
          {/* Animated Logo */}
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#FF385C] to-[#E31C5F] flex items-center justify-center shadow-2xl animate-pulse-warm">
              <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#00A699] rounded-full animate-bounce"></div>
          </div>
          
          {/* Loading Text */}
          <h2 className="text-2xl font-semibold text-[#222222] mb-2">
            Preparing your story...
          </h2>
          <p className="text-[#767676]">
            We're gathering all your beautiful moments ✨
          </p>
          
          {/* Progress Dots */}
          <div className="flex justify-center space-x-2 mt-6">
            <div className="w-2 h-2 bg-[#FF385C] rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-[#00A699] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-[#FC642D] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours()
    const firstName = session.user?.name?.split(' ')[0] || session.user?.email?.split('@')[0] || 'friend'
    
    if (hour < 6) return `Still up, ${firstName}? 🌙`
    if (hour < 12) return `Good morning, ${firstName}! ☀️`
    if (hour < 17) return `Good afternoon, ${firstName}! 🌤️`
    if (hour < 21) return `Good evening, ${firstName}! 🌅`
    return `Winding down, ${firstName}? 🌜`
  }

  const getTotalTimeToday = () => {
    const today = new Date().toDateString()
    return entries
      .filter(entry => new Date(entry.startTime).toDateString() === today)
      .reduce((total, entry) => total + entry.duration, 0)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  return (
    <div className="min-h-screen">
      <Header user={session.user} />
      
      {/* Hero Section with Personal Touch */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF385C]/5 via-[#00A699]/5 to-[#FC642D]/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center animate-slide-up">
            <h1 className="text-4xl md:text-5xl font-bold text-[#222222] mb-4">
              {getTimeBasedGreeting()}
            </h1>
            <p className="text-xl text-[#767676] mb-2">
              You've tracked <span className="font-semibold text-[#FF385C]">{formatDuration(getTotalTimeToday())}</span> today
            </p>
            <p className="text-base text-[#767676]">
              Every moment matters. Let's make today count! ✨
            </p>
          </div>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 md:pb-16">
        <div className="space-y-12">
          {/* Time Entry - Hero CTA */}
          <div className="-mt-8 relative z-10">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
              {/* Toggle Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#FF385C] to-[#E31C5F] rounded-xl flex items-center justify-center">
                    {useTimeSlots ? (
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#222222]">
                      {useTimeSlots ? "Time Slot Entry" : "Quick Entry"}
                    </h2>
                    <p className="text-[#767676]">
                      {useTimeSlots ? "Fill in your activities for specific time slots" : "Add your activity"}
                    </p>
                  </div>
                </div>
                
                {/* Toggle Switch */}
                <div className="flex items-center space-x-3">
                  <span className={`text-sm font-medium ${!useTimeSlots ? 'text-[#FF385C]' : 'text-[#767676]'}`}>
                    Quick
                  </span>
                  <button
                    onClick={() => setUseTimeSlots(!useTimeSlots)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:ring-offset-2 ${
                      useTimeSlots ? 'bg-[#FF385C]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`${
                        useTimeSlots ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </button>
                  <span className={`text-sm font-medium ${useTimeSlots ? 'text-[#FF385C]' : 'text-[#767676]'}`}>
                    Time Slots
                  </span>
                </div>
              </div>
              
              {/* Entry Component */}
              <div className="border-t border-gray-100 pt-6">
                {useTimeSlots ? (
                  <EnhancedTimeEntry onEntryAdded={fetchEntries} />
                ) : (
                  <TimeEntryForm 
                    onEntryAdded={handleEntryAdded} 
                    showExpandedByDefault={entries.length === 0 && userGoals.length === 0}
                    isFirstEntry={isFirstEntry}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Weekly Story Section */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-slide-up">
            <div className="bg-gradient-to-r from-[#00A699] to-[#009B8E] px-8 py-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-2">
                    Your week's story
                  </h2>
                  <p className="text-white/80">
                    Discover patterns in how you spend your precious time
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8">
              <WeeklyOverview entries={entries} />
            </div>
          </div>

          {/* Recent Activities - Memory Lane */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-slide-up">
            <div className="bg-gradient-to-r from-[#FC642D] to-[#E8590C] px-8 py-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-2">
                    Memory lane
                  </h2>
                  <p className="text-white/80">
                    Your recent adventures and accomplishments
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">🏛️</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8">
              <TimeEntryList 
                entries={entries}
                onEntryUpdated={handleEntryUpdated}
                onEntryDeleted={handleEntryDeleted}
              />
            </div>
          </div>

{/* Pomodoro Timer Section */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-slide-up">
            <div className="bg-gradient-to-r from-[#FF385C] to-[#E31C5F] px-8 py-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-2">
                    Pomodoro Timer
                  </h2>
                  <p className="text-white/80">
                    Enhance focus with structured intervals
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">⏳</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8 text-center">
              <Link 
                href="/pomodoro"
                className="inline-flex items-center px-6 py-3 bg-[#FF385C] text-white text-lg rounded-xl hover:bg-[#E31C5F] transition-colors"
              >
                Start your session →
              </Link>
            </div>
          </div>

          {/* Inspirational Footer */}
          <div className="text-center py-12">
            <div className="inline-flex items-center space-x-2 bg-white rounded-full px-6 py-3 shadow-lg border border-gray-100">
              <span className="text-2xl">💫</span>
              <span className="text-[#767676] font-medium">
                Time is the most valuable thing we can spend
              </span>
            </div>
          </div>
        </div>
      </main>
      
      {/* Onboarding Modal */}
      <OnboardingModal 
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onSaveGoals={handleSaveGoals}
      />

      {/* Install App Prompt */}
      <InstallPrompt 
        show={showInstallPrompt} 
        onClose={dismissInstallPrompt} 
      />

      {/* Mobile Navigation */}
      <MobileNavigation />
    </div>
  )
}
