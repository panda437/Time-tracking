"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { BarChart3, TrendingUp, Clock, Calendar, Target, Brain } from "lucide-react"

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#222222] mb-4">
              Power Analytics
            </h1>
            <p className="text-xl text-[#767676]">
              Deep insights into your time patterns and productivity trends
            </p>
          </div>
          
          {/* Period Selector */}
          <div className="mt-6 lg:mt-0">
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>

        <div className="grid gap-8">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#FF385C] to-[#E31C5F] rounded-xl flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-[#222222]">Total Time</h3>
              </div>
              <div className="text-2xl font-bold text-[#222222]">
                {formatDuration(analytics.totalTimeTracked)}
              </div>
              <div className="text-sm text-[#767676] mt-1">This period</div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#00A699] to-[#009B8E] rounded-xl flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-[#222222]">Productivity</h3>
              </div>
              <div className="text-2xl font-bold text-[#222222]">
                {analytics.productivityScore}%
              </div>
              <div className="text-sm text-[#767676] mt-1">Score</div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#FC642D] to-[#E8590C] rounded-xl flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-[#222222]">Streak</h3>
              </div>
              <div className="text-2xl font-bold text-[#222222]">
                {analytics.streakDays}
              </div>
              <div className="text-sm text-[#767676] mt-1">Days</div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-[#222222]">Peak Hour</h3>
              </div>
              <div className="text-2xl font-bold text-[#222222]">
                {Math.max(...analytics.peakHours.map(h => h.hour))}:00
              </div>
              <div className="text-sm text-[#767676] mt-1">Most productive</div>
            </div>
          </div>

          {/* Category by Date - Stacked Bar Chart */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF385C] to-[#E31C5F] rounded-xl flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[#222222]">Categories by Date</h2>
            </div>
            
            <div className="space-y-4 overflow-x-auto">
              <div className="min-w-[800px] space-y-4">
                {analytics.categoryByDate?.slice(-14).map((dayData) => {
                  const totalDuration = dayData.categories.reduce((sum, cat) => sum + cat.duration, 0)
                  
                  return (
                    <div key={dayData.date} className="flex items-center space-x-4">
                      <div className="w-20 text-sm font-medium text-[#222222]">
                        {new Date(dayData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      
                      <div className="flex-1 relative group">
                        <div className="bg-gray-200 rounded-full h-6 relative overflow-hidden flex">
                          {dayData.categories.map((category, index) => {
                            const percentage = totalDuration > 0 ? (category.duration / totalDuration) * 100 : 0
                            return (
                              <div
                                key={`${category.category}-${index}`}
                                className={`h-full ${getCategoryColor(category.category)} relative cursor-pointer transition-all hover:opacity-80`}
                                style={{ width: `${percentage}%` }}
                                title={`${category.category}: ${formatDuration(category.duration)} - ${category.activities.join(', ')}`}
                              >
                                {/* Tooltip on hover */}
                                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                  <div className="font-semibold capitalize">{category.category}</div>
                                  <div>{formatDuration(category.duration)}</div>
                                  <div className="text-xs opacity-75 max-w-48 truncate">
                                    {category.activities.join(', ')}
                                  </div>
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      
                      <div className="text-sm text-[#767676] w-16 text-right">
                        {formatDuration(totalDuration)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              {[...new Set(analytics.categoryByDate?.flatMap(d => d.categories.map(c => c.category)) || [])].map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getCategoryColor(category)}`}></div>
                  <span className="text-sm text-[#767676] capitalize">{category}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mood Trends */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00A699] to-[#009B8E] rounded-xl flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[#222222]">Mood Patterns</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {analytics.moodTrends.map((mood, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-3xl mb-2">{mood.mood}</div>
                  <div className="text-lg font-semibold text-[#222222]">{mood.count}</div>
                  <div className="text-sm text-[#767676]">times</div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Trends */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[#222222]">Weekly Progress</h2>
            </div>
            
            <div className="space-y-4">
              {analytics.weeklyComparison.map((week, index) => {
                const maxDuration = Math.max(...analytics.weeklyComparison.map(w => w.duration))
                const percentage = (week.duration / maxDuration) * 100
                
                return (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-16 text-sm font-medium text-[#222222]">
                      {week.week}
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-200 rounded-full h-4 relative overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#FF385C] to-[#E31C5F]"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm font-medium text-[#222222] w-20 text-right">
                      {formatDuration(week.duration)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Peak Hours Heatmap */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FC642D] to-[#E8590C] rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[#222222]">Peak Performance Hours</h2>
            </div>
            
            <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-2">
              {Array.from({ length: 24 }, (_, hour) => {
                const peakData = analytics.peakHours.find(p => p.hour === hour)
                const intensity = peakData ? (peakData.duration / 240) * 100 : 0
                
                return (
                  <div key={hour} className="text-center">
                    <div 
                      className={`h-12 rounded-lg flex items-end justify-center text-xs font-medium transition-all hover:scale-105 ${
                        intensity > 50 ? 'bg-[#FF385C] text-white' :
                        intensity > 25 ? 'bg-[#FF385C]/60 text-white' :
                        intensity > 0 ? 'bg-[#FF385C]/30 text-[#FF385C]' :
                        'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {hour}
                    </div>
                    {peakData && (
                      <div className="text-xs text-[#767676] mt-1">
                        {formatDuration(peakData.duration)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
