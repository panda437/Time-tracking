import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/prisma"
import { TimeEntry, UserGoal, DayReflection } from "@/lib/models"
import { analyzeGoalProgress, UserContext } from "@/lib/openai"
import { format, subDays } from "date-fns"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await connectDB()
    
    // Gather user context for AI analysis
    const userContext = await gatherUserContextForGoals(session.user.id)
    
    if (!userContext) {
      return NextResponse.json({ 
        error: "Insufficient data for goal analysis. Please set goals and track activities for a few days." 
      }, { status: 400 })
    }
    
    // Generate AI analysis
    const analysis = await analyzeGoalProgress(userContext)
    
    return NextResponse.json({
      success: true,
      analysis,
      dataPoints: {
        totalEntries: userContext.recentEntries.length,
        totalGoals: userContext.goals.length,
        reflections: userContext.recentReflections.length,
        hasPatterns: !!userContext.patterns
      }
    })
    
  } catch (error) {
    console.error("Error analyzing goals:", error)
    return NextResponse.json({ 
      error: "Failed to analyze goals", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

async function gatherUserContextForGoals(userId: string): Promise<UserContext | null> {
  try {
    // Get user goals
    const goals = await UserGoal.find({
      userId
    }).sort({ createdAt: 1 })
    
    if (goals.length === 0) {
      return null // Need goals for meaningful analysis
    }
    
    // Get past 30 days of entries for comprehensive analysis
    const thirtyDaysAgo = subDays(new Date(), 30)
    const recentEntries = await TimeEntry.find({
      userId,
      startTime: { $gte: thirtyDaysAgo }
    }).sort({ startTime: -1 }).limit(50)
    
    if (recentEntries.length < 5) {
      return null // Need some activity data
    }
    
    // Get recent reflections (last 2 weeks)
    const twoWeeksAgo = subDays(new Date(), 14)
    const recentReflections = await DayReflection.find({
      userId,
      date: { $gte: twoWeeksAgo }
    }).sort({ date: -1 }).limit(10)
    
    // Analyze patterns from entries
    const patterns = analyzeUserPatterns(recentEntries)
    
    const userContext: UserContext = {
      goals: goals, // Pass full goal objects instead of just strings
      recentEntries: recentEntries.map(entry => ({
        activity: entry.activity,
        category: entry.category,
        duration: entry.duration,
        startTime: format(entry.startTime, 'yyyy-MM-dd HH:mm'),
        mood: entry.mood || undefined,
        dayOfWeek: format(entry.startTime, 'EEEE'),
        timeOfDay: format(entry.startTime, 'HH:mm')
      })),
      recentReflections: recentReflections.map(ref => ({
        date: format(ref.date, 'yyyy-MM-dd'),
        reflection: ref.reflection,
        rating: ref.rating,
        highlights: ref.highlights,
        improvements: ref.improvements
      })),
      patterns,
      currentTime: format(new Date(), 'yyyy-MM-dd HH:mm'),
      timezone: 'UTC'
    }
    
    return userContext
    
  } catch (error) {
    console.error("Error gathering user context for goals:", error)
    return null
  }
}

function analyzeUserPatterns(entries: any[]) {
  const categories: { [key: string]: number } = {}
  const moods: { [key: string]: number } = {}
  const times: { [key: string]: number } = {}
  const durations: { [key: string]: number[] } = {}
  const hourlyActivity: { [key: number]: number } = {}

  entries.forEach(entry => {
    // Category frequency
    categories[entry.category] = (categories[entry.category] || 0) + 1
    
    // Mood frequency
    if (entry.mood) {
      moods[entry.mood] = (moods[entry.mood] || 0) + 1
    }
    
    // Time patterns
    const hour = entry.startTime.getHours()
    const timeSlot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
    times[timeSlot] = (times[timeSlot] || 0) + 1
    hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1
    
    // Duration patterns by category
    if (!durations[entry.category]) durations[entry.category] = []
    durations[entry.category].push(entry.duration)
  })

  // Get top preferences
  const sortedCategories = Object.entries(categories).sort((a, b) => b[1] - a[1])
  const sortedMoods = Object.entries(moods).sort((a, b) => b[1] - a[1])
  const sortedTimes = Object.entries(times).sort((a, b) => b[1] - a[1])
  
  // Calculate average durations
  const avgDurations: { [key: string]: number } = {}
  Object.entries(durations).forEach(([category, durationList]) => {
    avgDurations[category] = Math.round(durationList.reduce((sum, d) => sum + d, 0) / durationList.length)
  })
  
  // Find most productive hours (top 3)
  const productiveHours = Object.entries(hourlyActivity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => parseInt(hour))

  return {
    preferredCategories: sortedCategories.slice(0, 3).map(([cat]) => cat),
    commonMoods: sortedMoods.slice(0, 3).map(([mood]) => mood),
    preferredTimes: sortedTimes.slice(0, 2).map(([time]) => time),
    averageDurations: avgDurations,
    productiveHours
  }
} 