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
import FeedbackModal from "@/components/FeedbackModal"
import MobileNavigation from "@/components/MobileNavigation"
import { useFeedbackPrompt } from "@/hooks/useFeedbackPrompt"
import { trackTaskMilestone } from "@/components/GoogleAnalytics"
import { refreshUserStats } from "@/hooks/useUserStats"

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

interface UserGoal {
  _id: string
  goal: string
  specificGoal?: string
  measurableOutcome?: string
  targetValue?: number
  currentValue?: number
  unit?: string
  deadline?: string
  goalType?: string
  isActive: boolean
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
  const [goals, setGoals] = useState<UserGoal[]>([])
  const [useTimeSlots, setUseTimeSlots] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  
  // Feedback prompt hook
  const { showFeedbackPrompt, triggerAfterFirstTask, dismissFeedbackPrompt } = useFeedbackPrompt()

  useEffect(() => {
    if (status === "loading") return
    
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && session) {
      // Ensure session is fully established before making API calls
      const timer = setTimeout(() => {
        setSessionReady(true)
        initializeDashboard()
      }, 1000) // Increased delay to ensure session is fully established

      return () => clearTimeout(timer)
    }
  }, [session, status, router])

  const initializeDashboard = async () => {
    try {
      setLoading(true)
      
      // Make API calls sequentially to avoid race conditions
      await Promise.all([
        fetchEntries(),
        checkUserGoals(),
        fetchGoals()
      ])
    } catch (error) {
      console.error("Failed to initialize dashboard:", error)
      // Retry initialization after a delay
      setTimeout(() => {
        if (status === "authenticated" && sessionReady) {
          initializeDashboard()
        }
      }, 3000)
    } finally {
      setLoading(false)
    }
  }

  const checkUserGoals = async () => {
    try {
      const response = await fetch("/api/goals", {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (response.status === 401) {
        console.log("Session expired, redirecting to signin")
        router.push("/auth/signin")
        return
      }
      
      if (response.ok) {
        const goals = await response.json()
        setUserGoals(goals.map((g: any) => g.goal))
        
        // Check if user has the default time entry goal
        const hasDefaultGoal = goals.some((g: any) => g.goal === "Make Time Entries")
        
        if (!hasDefaultGoal) {
          // Create default time entry goal
          try {
            const defaultGoalResponse = await fetch("/api/goals/default-time-entry", {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            })
            
            if (!defaultGoalResponse.ok) {
              console.error("Failed to create default time entry goal:", defaultGoalResponse.status)
            }
          } catch (error) {
            console.error("Failed to create default time entry goal:", error)
          }
        }
        
        // Show onboarding if user has no goals and no entries
        if (goals.length === 0) {
          // Check if user has any entries to determine if they're truly new
          try {
            const entriesResponse = await fetch("/api/entries", {
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            })
            if (entriesResponse.ok) {
              const allEntries = await entriesResponse.json()
              if (allEntries.length === 0) {
                setShowOnboarding(true)
              }
            }
          } catch (error) {
            console.error("Failed to fetch entries for onboarding check:", error)
          }
        }
      } else {
        console.error("Failed to fetch user goals:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Failed to fetch user goals:", error)
      // Don't retry immediately to avoid infinite loops
    }
  }

  const fetchGoals = async () => {
    try {
      const response = await fetch("/api/goals", {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (response.status === 401) {
        console.log("Session expired, redirecting to signin")
        router.push("/auth/signin")
        return
      }
      
      if (response.ok) {
        const goalsData = await response.json()
        setGoals(goalsData)
      } else {
        console.error("Failed to fetch goals:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Failed to fetch goals:", error)
    }
  }

  const handleSaveGoals = async (goals: any[]) => {
    // Extract goal names for display
    const goalNames = goals.map(g => g.goal)
    setUserGoals(goalNames)
    setShowOnboarding(false)

    // Refresh goals list
    await fetchGoals()

    // Don't redirect - let them stay on dashboard for their first entry
    // The dashboard will handle the first entry flow properly
  }

  const fetchEntries = async () => {
    try {
      const response = await fetch("/api/entries?period=week", {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (response.status === 401) {
        console.log("Session expired, redirecting to signin")
        router.push("/auth/signin")
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      } else {
        console.error("Failed to fetch entries:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Failed to fetch entries:", error)
    }
  }

  const handleEntryAdded = (newEntry: TimeEntry) => {
    setEntries([newEntry, ...entries])
    
    // Trigger install prompt after first task creation
    triggerAfterFirstTask()
    
    // Track task milestone for analytics
    const newTaskCount = entries.length + 1
    trackTaskMilestone(newTaskCount)
    
    // Refresh user stats for profile icon
    refreshUserStats()
  }

  const isFirstEntry = entries.length === 0 && userGoals.length > 0

  const handleEntryUpdated = (updatedEntry: TimeEntry) => {
    setEntries(entries.map(entry => 
      entry.id === updatedEntry.id ? updatedEntry : entry
    ))
    
    // Refresh user stats for profile icon
    refreshUserStats()
  }

  const handleEntryDeleted = (deletedId: string) => {
    setEntries(entries.filter(entry => entry.id !== deletedId))
    
    // Refresh user stats for profile icon
    refreshUserStats()
  }

  // Show loading state while session is not ready or data is loading
  if (status === "loading" || loading || !sessionReady) {
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
            {status === "loading" ? "Authenticating..." : "Preparing your story..."}
          </h2>
          <p className="text-[#767676]">
            {status === "loading" ? "Setting up your secure session ✨" : "We're gathering all your beautiful moments ✨"}
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
    <div className="min-h-screen relative">
      {/* Noise Texture Background */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          backgroundRepeat: 'repeat'
        }}
      />
      <div className="relative z-10">
      <Header user={session.user} />
      
      {/* Hero Section with Personal Touch */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF385C]/5 via-[#00A699]/5 to-[#FC642D]/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center animate-slide-up">
            <h1 className="text-2xl md:text-3xl font-bold text-[#222222] mb-2">
              {getTimeBasedGreeting()}
            </h1>
            <p className="text-lg text-[#767676] mb-1">
              You've tracked <span className="font-semibold text-[#FF385C]">{formatDuration(getTotalTimeToday())}</span> today
            </p>
            <p className="hidden md:block text-sm text-[#767676]">
              Every moment matters. Let's make today count! ✨
            </p>
          </div>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="space-y-8">
          {/* Time Entry - Hero CTA */}
          <div className="-mt-4 relative z-10">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-2 md:p-6">
              {/* Toggle Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#FF385C] to-[#E31C5F] rounded-xl flex items-center justify-center">
                    {useTimeSlots ? (
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#222222]">
                      {useTimeSlots ? "Time Slot Entry" : "Quick Entry"}
                    </h2>
                    <p className="hidden md:block text-sm text-[#767676]">
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
              <div className="border-t border-gray-100 pt-4">
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

          {/* User Goals Section */}
          {goals.length > 0 && (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-slide-up">
              <div className="bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] px-6 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-1">
                      Your Goals
                    </h2>
                    <p className="text-sm text-white/80">
                      Track your progress and stay motivated
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                      <span className="text-xl">🎯</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {goals.slice(0, 6).map((goal) => (
                                          <div key={goal._id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200 hover:shadow-lg transition-all duration-300">
                                              <div className="flex items-start justify-between mb-3">
                                                  <div className="w-8 h-8 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl flex items-center justify-center">
                            <span className="text-white text-sm">
                            {goal.goalType === 'financial' ? '💰' : 
                             goal.goalType === 'health' ? '💪' : 
                             goal.goalType === 'learning' ? '📚' : 
                             goal.goalType === 'productivity' ? '⚡' : 
                             goal.goalType === 'relationship' ? '❤️' : 
                             goal.goalType === 'habit' ? '🔄' : 
                             goal.goalType === 'project' ? '📋' : '🎯'}
                          </span>
                        </div>
                        {goal.deadline && (
                          <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                            {new Date(goal.deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">
                        {goal.specificGoal || goal.goal}
                      </h3>
                      {goal.measurableOutcome && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {goal.measurableOutcome}
                        </p>
                      )}
                      {goal.targetValue && goal.currentValue !== undefined && (
                        <div className="mb-2">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min((goal.currentValue / goal.targetValue) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <Link 
                    href="/goals"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white text-lg rounded-xl hover:from-[#7C3AED] hover:to-[#6D28D9] transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <span>View All Goals</span>
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          )}

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
            <FeedbackModal
        show={showFeedbackPrompt}
        onClose={dismissFeedbackPrompt}
      />

      {/* Mobile Navigation */}
      <MobileNavigation />
      </div>
    </div>
  )
}
