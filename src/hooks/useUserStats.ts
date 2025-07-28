import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

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

interface UserStats {
  streak: number
  hasEntries: boolean
  totalEntries: number
  lastEntryDate: string | null
  todayEntries: number
  yesterdayEntries: number
  contextualMessage: string
  showRedDot: boolean
}

// Global event system for refreshing user stats
const refreshUserStatsEvent = new EventTarget()

export function useUserStats() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<UserStats>({
    streak: 0,
    hasEntries: false,
    totalEntries: 0,
    lastEntryDate: null,
    todayEntries: 0,
    yesterdayEntries: 0,
    contextualMessage: '',
    showRedDot: false
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserStats()
    }
  }, [session])

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      fetchUserStats()
    }

    refreshUserStatsEvent.addEventListener('refresh', handleRefresh)
    return () => {
      refreshUserStatsEvent.removeEventListener('refresh', handleRefresh)
    }
  }, [])

  const fetchUserStats = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/entries?period=all", {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (response.ok) {
        const entries: TimeEntry[] = await response.json()
        const calculatedStats = calculateStats(entries)
        setStats(calculatedStats)
      }
    } catch (error) {
      console.error("Failed to fetch user stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (entries: TimeEntry[]): UserStats => {
    if (entries.length === 0) {
      return {
        streak: 0,
        hasEntries: false,
        totalEntries: 0,
        lastEntryDate: null,
        todayEntries: 0,
        yesterdayEntries: 0,
        contextualMessage: "Make your first time entry to start tracking your productivity journey!",
        showRedDot: true
      }
    }

    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const todayStr = today.toDateString()
    const yesterdayStr = yesterday.toDateString()

    // Get unique dates with entries
    const entryDates = [...new Set(entries.map(entry => 
      new Date(entry.startTime).toDateString()
    ))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    const todayEntries = entries.filter(entry => 
      new Date(entry.startTime).toDateString() === todayStr
    ).length

    const yesterdayEntries = entries.filter(entry => 
      new Date(entry.startTime).toDateString() === yesterdayStr
    ).length

    // Calculate streak
    let streak = 0
    const currentDate = new Date(today)
    
    for (let i = 0; i < 365; i++) { // Check up to a year
      const dateStr = currentDate.toDateString()
      if (entryDates.includes(dateStr)) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    const lastEntryDate = entryDates[0] || null
    const hasEntries = entries.length > 0

    // Generate contextual message
    let contextualMessage = ""
    let showRedDot = false

    if (!hasEntries) {
      contextualMessage = "Make your first time entry to start tracking your productivity journey!"
      showRedDot = true
    } else if (entries.length === 1) {
      contextualMessage = "Great start! Make another entry to build momentum and see your patterns emerge."
      showRedDot = todayEntries === 0
    } else if (todayEntries > 0) {
      contextualMessage = "Excellent! You're being consistent today. Keep up the great work!"
      showRedDot = false
    } else if (yesterdayEntries > 0) {
      contextualMessage = "You were active yesterday! Make an entry today to maintain your momentum."
      showRedDot = true
    } else if (streak >= 7) {
      contextualMessage = `🎉 Congratulations on your ${streak}-day streak! You're building amazing habits!`
      showRedDot = todayEntries === 0
    } else if (streak >= 3) {
      contextualMessage = `Great consistency! You're on a ${streak}-day streak. Keep it going!`
      showRedDot = todayEntries === 0
    } else {
      contextualMessage = "Get back on track! Make a time entry today to rebuild your momentum."
      showRedDot = true
    }

    return {
      streak,
      hasEntries,
      totalEntries: entries.length,
      lastEntryDate,
      todayEntries,
      yesterdayEntries,
      contextualMessage,
      showRedDot
    }
  }

  return { stats, loading, refetch: fetchUserStats }
}

// Function to trigger refresh from other components
export function refreshUserStats() {
  refreshUserStatsEvent.dispatchEvent(new Event('refresh'))
} 