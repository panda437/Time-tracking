import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/prisma"
import { TimeEntry } from "@/lib/models"
import { format, subDays, startOfDay, endOfDay, startOfWeek } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || '30d'
    
    // Calculate date range
    const daysBack = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30
    const startDate = startOfDay(subDays(new Date(), daysBack))
    const endDate = endOfDay(new Date())

    // Fetch all entries for the user in the date range
    const entries = await TimeEntry.find({
      userId: session.user.id,
      startTime: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ startTime: -1 })

    // Process data for analytics
    const analytics = {
      // Key metrics
      totalTimeTracked: entries.reduce((sum, entry) => sum + entry.duration, 0),
      totalEntries: entries.length,
      streakDays: calculateStreak(entries),
      productivityScore: calculateProductivityScore(entries),

      // Category breakdown by date for stacked bar chart
      categoryByDate: processCategoryByDate(entries),

      // Mood trends
      moodTrends: processMoodTrends(entries),

      // Peak hours
      peakHours: processPeakHours(entries),

      // Weekly comparison
      weeklyComparison: processWeeklyComparison(entries),

      // Category breakdown totals
      categoryBreakdown: processCategoryBreakdown(entries)
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

function processCategoryByDate(entries: any[]) {
  const dateMap: Record<string, Record<string, { duration: number, activities: string[] }>> = {}
  
  entries.forEach(entry => {
    const date = format(new Date(entry.startTime), 'yyyy-MM-dd')
    
    if (!dateMap[date]) {
      dateMap[date] = {}
    }
    
    if (!dateMap[date][entry.category]) {
      dateMap[date][entry.category] = { duration: 0, activities: [] }
    }
    
    dateMap[date][entry.category].duration += entry.duration
    dateMap[date][entry.category].activities.push(entry.activity)
  })

  return Object.entries(dateMap).map(([date, categories]) => ({
    date,
    categories: Object.entries(categories).map(([category, data]) => ({
      category,
      duration: data.duration,
      activities: data.activities
    }))
  })).sort((a, b) => a.date.localeCompare(b.date))
}

function processMoodTrends(entries: any[]) {
  const moodCount: Record<string, number> = {}
  
  entries.forEach(entry => {
    if (entry.mood) {
      moodCount[entry.mood] = (moodCount[entry.mood] || 0) + 1
    }
  })

  return Object.entries(moodCount).map(([mood, count]) => ({
    mood,
    count
  }))
}

function processPeakHours(entries: any[]) {
  const hourCount: Record<number, number> = {}
  
  entries.forEach(entry => {
    const hour = new Date(entry.startTime).getHours()
    hourCount[hour] = (hourCount[hour] || 0) + entry.duration
  })

  return Object.entries(hourCount).map(([hour, duration]) => ({
    hour: parseInt(hour),
    duration
  }))
}

function processWeeklyComparison(entries: any[]) {
  const weeklyData: Record<string, number> = {}
  
  entries.forEach(entry => {
    const weekStart = format(startOfWeek(new Date(entry.startTime)), 'MMM d')
    weeklyData[weekStart] = (weeklyData[weekStart] || 0) + entry.duration
  })

  return Object.entries(weeklyData).map(([week, duration]) => ({
    week,
    duration
  })).slice(-4) // Last 4 weeks
}

function processCategoryBreakdown(entries: any[]) {
  const categoryTotals: Record<string, number> = {}
  const totalDuration = entries.reduce((sum, entry) => sum + entry.duration, 0)
  
  entries.forEach(entry => {
    categoryTotals[entry.category] = (categoryTotals[entry.category] || 0) + entry.duration
  })

  return Object.entries(categoryTotals).map(([category, duration]) => ({
    category,
    duration,
    percentage: totalDuration > 0 ? Math.round((duration / totalDuration) * 100) : 0
  })).sort((a, b) => b.duration - a.duration)
}

function calculateStreak(entries: any[]) {
  if (entries.length === 0) return 0
  
  const dateSet = new Set(entries.map(entry => 
    format(new Date(entry.startTime), 'yyyy-MM-dd')
  ))
  const dates = Array.from(dateSet).sort()
  
  let streak = 0
  let currentDate = new Date()
  
  for (let i = dates.length - 1; i >= 0; i--) {
    const entryDate = new Date(dates[i])
    const daysDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === streak) {
      streak++
      currentDate = entryDate
    } else {
      break
    }
  }
  
  return streak
}

function calculateProductivityScore(entries: any[]) {
  if (entries.length === 0) return 0
  
  const workEntries = entries.filter(entry => 
    ['work', 'education'].includes(entry.category)
  )
  
  const workTime = workEntries.reduce((sum, entry) => sum + entry.duration, 0)
  const totalTime = entries.reduce((sum, entry) => sum + entry.duration, 0)
  
  return totalTime > 0 ? Math.round((workTime / totalTime) * 100) : 0
}

