"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import Header from "@/components/Header"
import MobileNavigation from "@/components/MobileNavigation"
import { BarChart3, TrendingUp, Clock, Calendar, Target, Brain, ArrowRight, CheckCircle } from "lucide-react"
import React from "react" // Added for React.useState

interface AnalyticsData {
  moodTrends: { mood: string; count: number }[]
  categoryBreakdown: { category: string; duration: number; percentage: number }[]
  productivityScore: number
  totalTimeTracked: number
  totalEntries: number
  streakDays: number
  peakHours: { hour: number; duration: number }[]
  weeklyComparison: { week: string; duration: number }[]
  categoryByDate: { date: string; categories: { category: string; duration: number; activities: string[] }[] }[]
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("30d")

  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/auth/signin")
      return
    }

    fetchAnalytics()
  }, [session, status, router, selectedPeriod])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics?period=${selectedPeriod}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-[#F7F7F7] to-[#EBEBEB] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FF385C]/20 border-t-[#FF385C] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!session || !analytics) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-[#F7F7F7] to-[#EBEBEB]">
      <Header user={{ name: session.user?.name, email: session.user?.email }} />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 sm:mb-8 lg:mb-12">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#222222] mb-2 sm:mb-3 lg:mb-4">
              Power Analytics
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-[#767676]">
              Deep insights into your time patterns and productivity trends
            </p>
          </div>
          
          {/* Period Selector */}
          <div className="mt-4 lg:mt-0">
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full lg:w-auto px-3 sm:px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF385C] text-sm sm:text-base"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:gap-8">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-3 sm:p-4 lg:p-6">
              <div className="flex items-center space-x-2 lg:space-x-3 mb-2 lg:mb-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-[#FF385C] to-[#E31C5F] rounded-xl flex items-center justify-center">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
                </div>
                <h3 className="font-semibold text-[#222222] text-xs sm:text-sm lg:text-base">Total Time</h3>
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-[#222222]">
                {formatDuration(analytics.totalTimeTracked)}
              </div>
              <div className="text-xs lg:text-sm text-[#767676] mt-1">This period</div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-3 sm:p-4 lg:p-6">
              <div className="flex items-center space-x-2 lg:space-x-3 mb-2 lg:mb-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-[#00A699] to-[#009B8E] rounded-xl flex items-center justify-center">
                  <Target className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
                </div>
                <h3 className="font-semibold text-[#222222] text-xs sm:text-sm lg:text-base">Productivity</h3>
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-[#222222]">
                {analytics.productivityScore}%
              </div>
              <div className="text-xs lg:text-sm text-[#767676] mt-1">Score</div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-3 sm:p-4 lg:p-6">
              <div className="flex items-center space-x-2 lg:space-x-3 mb-2 lg:mb-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-[#FC642D] to-[#E8590C] rounded-xl flex items-center justify-center">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
                </div>
                <h3 className="font-semibold text-[#222222] text-xs sm:text-sm lg:text-base">Streak</h3>
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-[#222222]">
                {analytics.streakDays}
              </div>
              <div className="text-xs lg:text-sm text-[#767676] mt-1">Days</div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-3 sm:p-4 lg:p-6">
              <div className="flex items-center space-x-2 lg:space-x-3 mb-2 lg:mb-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
                </div>
                <h3 className="font-semibold text-[#222222] text-xs sm:text-sm lg:text-base">Peak Hour</h3>
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-[#222222]">
                {Math.max(...analytics.peakHours.map(h => h.hour))}:00
              </div>
              <div className="text-xs lg:text-sm text-[#767676] mt-1">Most productive</div>
            </div>
          </div>

          {/* Category by Date - Bar Chart */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center space-x-3 mb-4 lg:mb-6">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-[#FF385C] to-[#E31C5F] rounded-xl flex items-center justify-center">
                <BarChart3 className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#222222]">Categories by Date</h2>
            </div>
            <CategoryByDateChart data={analytics.categoryByDate || []} />
          </div>

          {/* Mood Trends */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center space-x-3 mb-4 lg:mb-6">
              <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-[#00A699] to-[#009B8E] rounded-xl flex items-center justify-center">
                <Brain className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#222222]">Mood Patterns</h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
              {analytics.moodTrends.map((mood, index) => (
                <div key={index} className="text-center p-2 sm:p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{mood.mood}</div>
                  <div className="text-base sm:text-lg font-semibold text-[#222222]">{mood.count}</div>
                  <div className="text-xs sm:text-sm text-[#767676]">times</div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Trends */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center space-x-3 mb-4 lg:mb-6">
              <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#222222]">Weekly Progress</h2>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {analytics.weeklyComparison.map((week, index) => {
                const maxDuration = Math.max(...analytics.weeklyComparison.map(w => w.duration))
                const percentage = (week.duration / maxDuration) * 100
                
                return (
                  <div key={index} className="flex items-center space-x-2 sm:space-x-4">
                    <div className="w-12 sm:w-16 text-xs sm:text-sm font-medium text-[#222222]">
                      {week.week}
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-200 rounded-full h-3 sm:h-4 relative overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#FF385C] to-[#E31C5F]"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-[#222222] w-16 sm:w-20 text-right">
                      {formatDuration(week.duration)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Peak Hours Heatmap */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center space-x-3 mb-4 lg:mb-6">
              <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-[#FC642D] to-[#E8590C] rounded-xl flex items-center justify-center">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#222222]">Peak Performance Hours</h2>
            </div>
            
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 lg:grid-cols-12 gap-1 lg:gap-2">
              {Array.from({ length: 24 }, (_, hour) => {
                const peakData = analytics.peakHours.find(p => p.hour === hour)
                const intensity = peakData ? (peakData.duration / 240) * 100 : 0
                
                return (
                  <div key={hour} className="text-center">
                    <div 
                      className={`h-8 sm:h-10 lg:h-12 rounded-lg flex items-end justify-center text-xs font-medium transition-all hover:scale-105 ${
                        intensity > 50 ? 'bg-[#FF385C] text-white' :
                        intensity > 25 ? 'bg-[#FF385C]/60 text-white' :
                        intensity > 0 ? 'bg-[#FF385C]/30 text-[#FF385C]' :
                        'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {hour}
                    </div>
                    {peakData && (
                      <div className="text-xs text-[#767676] mt-1 hidden sm:block">
                        {formatDuration(peakData.duration)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Daily Habit Reinforcement Section */}
          <div className="bg-gradient-to-r from-[#FF385C] to-[#E31C5F] rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8 text-white text-center">
            <div className="max-w-2xl mx-auto">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                Keep Your Momentum Going! 🚀
              </h2>
              <p className="text-lg sm:text-xl text-white/90 mb-2">
                You've tracked <span className="font-semibold">{analytics.totalEntries}</span> activities so far
              </p>
              <p className="text-base sm:text-lg text-white/80 mb-6 sm:mb-8">
                Every day you track builds better insights. Tomorrow's patterns depend on today's data.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center">
                <Link
                  href="/calendar"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#FF385C] rounded-2xl font-semibold hover:bg-gray-50 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Plan Tomorrow
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
                
                <Link
                  href="/reflection"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/20 text-white border-2 border-white/30 rounded-2xl font-semibold hover:bg-white/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Brain className="h-5 w-5 mr-2" />
                  Reflect on Today
                </Link>
              </div>
              
              <div className="mt-8 text-sm text-white/70">
                <p>💡 <strong>Pro tip:</strong> Users who track daily see 3x better insights within a week</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MobileNavigation />
    </div>
  )
}

// New CategoryByDateChart component
function CategoryByDateChart({ data }: { data: any[] }) {
  // Get all unique categories
  const allCategories = Array.from(
    new Set(data.flatMap(day => day.categories.map((c: any) => c.category)))
  )

  // Color map (extend as needed)
  const categoryColors: Record<string, string> = {
    work: 'bg-blue-500',
    health: 'bg-red-500',
    other: 'bg-gray-500',
    social: 'bg-yellow-400',
    personal: 'bg-green-500',
    education: 'bg-purple-500',
    entertainment: 'bg-pink-500',
    learning: 'bg-gray-700',
  }

  // Calculate max total hours for scaling
  const maxHours = Math.max(
    ...data.map(day => day.categories.reduce((sum: number, c: any) => sum + c.duration, 0) / 60)
  , 8) // at least 8h for y-axis

  // Tooltip state
  const [tooltip, setTooltip] = React.useState<null | { x: number, y: number, label: string }>(null)

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400">
        No data to display for this period.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="relative" style={{ height: 260 }}>
        {/* Y-axis grid/labels */}
        <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-xs text-[#767676] z-10">
          {[8,6,4,2,0].map(h => (
            <span key={h}>{h}h</span>
          ))}
        </div>
        {/* Grid lines */}
        <div className="absolute left-10 right-0 top-0 bottom-0 z-0">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="absolute w-full border-t border-gray-200" style={{ top: `${(i/4)*100}%` }} />
          ))}
        </div>
        {/* Bars */}
        <div className="absolute left-10 right-0 top-0 bottom-0 flex items-end justify-between px-2" style={{ minWidth: 56 * data.length }}>
          {data.map((day, i) => {
            let yOffset = 0
            const total = day.categories.reduce((sum: number, c: any) => sum + c.duration, 0)
            return (
              <div key={day.date} className="flex flex-col items-center group" style={{ width: 32 }}>
                {/* Stacked bar */}
                <div className="relative w-6 sm:w-8 h-48 flex flex-col-reverse" style={{ height: 192 }}>
                  {allCategories.map(cat => {
                    const catData = day.categories.find((c: any) => c.category === cat)
                    if (!catData) return null
                    const hours = catData.duration / 60
                    const barHeight = maxHours > 0 ? (hours / maxHours) * 192 : 0
                    const color = categoryColors[cat] || 'bg-gray-400'
                    const top = yOffset
                    yOffset += barHeight
                    return (
                      <div
                        key={cat}
                        className={`${color} w-full cursor-pointer transition-all hover:opacity-80 relative`}
                        style={{ height: barHeight < 2 ? 2 : barHeight, minHeight: 2 }}
                        onMouseEnter={e => {
                          const rect = (e.target as HTMLElement).getBoundingClientRect()
                          setTooltip({
                            x: rect.left + rect.width/2,
                            y: rect.top,
                            label: `${cat.charAt(0).toUpperCase()+cat.slice(1)}: ${hours.toFixed(2)}h`
                          })
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    )
                  })}
                  {/* Tooltip (desktop only) */}
                  {tooltip && (
                    <div
                      className="fixed z-50 px-3 py-2 rounded-lg bg-black text-white text-xs pointer-events-none"
                      style={{ left: tooltip.x, top: tooltip.y - 36 }}
                    >
                      {tooltip.label}
                    </div>
                  )}
                </div>
                {/* Date label */}
                <div className="text-xs text-[#767676] mt-1 whitespace-nowrap">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 justify-center">
        {allCategories.map(cat => (
          <div key={cat} className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-sm ${categoryColors[cat] || 'bg-gray-400'}`}></div>
            <span className="text-sm text-[#767676] capitalize">{cat}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
