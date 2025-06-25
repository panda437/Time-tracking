"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import TimeEntryForm from "@/components/TimeEntryForm"
import TimeEntryList from "@/components/TimeEntryList"
import WeeklyOverview from "@/components/WeeklyOverview"
import Header from "@/components/Header"
import OnboardingModal from "@/components/OnboardingModal"

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

  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/auth/signin")
      return
    }

    fetchEntries()
    checkUserGoals()
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
  }

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
          {/* Quick Add Section - Hero CTA */}
          <div className="-mt-8 relative z-10">
            <TimeEntryForm 
              onEntryAdded={handleEntryAdded} 
              showExpandedByDefault={entries.length === 0 && userGoals.length === 0}
            />
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
    </div>
  )
}
