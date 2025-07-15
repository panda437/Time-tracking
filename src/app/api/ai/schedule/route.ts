import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/prisma"
import { TimeEntry, UserGoal, DayReflection, AIInsight } from "@/lib/models"
import { generateScheduleSuggestions, UserContext } from "@/lib/openai"
import { format, subDays, addDays } from "date-fns"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await connectDB()
    
    const body = await request.json()
    const { forDate } = body
    
    // Default to tomorrow if no date provided
    const targetDate = forDate ? new Date(forDate) : addDays(new Date(), 1)
    const targetDateString = format(targetDate, 'yyyy-MM-dd')
    
    // Check if we already have planned tasks for this date
    const existingEntries = await TimeEntry.find({
      userId: session.user.id,
      date: targetDate
    })
    
    if (existingEntries.length > 0) {
      return NextResponse.json({ 
        message: "Tasks already planned for this date",
        existing: existingEntries 
      })
    }
    
    // Gather user context for AI
    const userContext = await gatherUserContext(session.user.id)
    
    if (!userContext) {
      return NextResponse.json({ 
        error: "Insufficient user data for AI suggestions" 
      }, { status: 400 })
    }
    
    // Generate AI suggestions with tracking
    const startTime = Date.now()
    const aiResponse = await generateScheduleSuggestions(userContext)
    const processingTime = Date.now() - startTime
    
    // Save AI insight to MongoDB for learning
    const dataPoints = {
      totalEntries: userContext.recentEntries.length,
      totalGoals: userContext.goals.length,
      reflections: userContext.recentReflections.length,
      hasPatterns: !!userContext.patterns
    }
    
    try {
      await AIInsight.create({
        userId: session.user.id,
        analysisType: 'schedule_suggestion',
        aiModel: 'gpt-4o-mini',
        modelVersion: '4o-mini',
        analysis: aiResponse,
        userContext: {
          goals: userContext.goals,
          recentEntries: userContext.recentEntries,
          recentReflections: userContext.recentReflections,
          patterns: userContext.patterns,
          dataPoints
        },
        processingTime
      })
    } catch (saveError) {
      console.error('Failed to save AI insight:', saveError)
      // Don't fail the request if saving fails
    }
    
    // Store the suggestions as AI-generated entries
    const aiEntries = await Promise.all(
      aiResponse.suggestions.map(async (suggestion) => {
        // Convert suggested time to full datetime
        const [hours, minutes] = suggestion.suggestedStartTime.split(':').map(Number)
        const startTime = new Date(targetDate)
        startTime.setHours(hours, minutes, 0, 0)
        
        const endTime = new Date(startTime.getTime() + suggestion.suggestedDuration * 60 * 1000)
        
        const entry = await TimeEntry.create({
          userId: session.user.id,
          activity: suggestion.title,
          description: `${suggestion.description}\n\nAI Reasoning: ${suggestion.reasoning}`,
          duration: suggestion.suggestedDuration,
          startTime,
          endTime,
          date: targetDate,
          category: suggestion.category,
          tags: JSON.stringify(['ai-generated', suggestion.priority]),
          mood: null
        })

        // Transform MongoDB document to have 'id' instead of '_id'
        return {
          id: entry._id.toString(),
          activity: entry.activity,
          description: entry.description,
          duration: entry.duration,
          startTime: entry.startTime.toISOString(),
          endTime: entry.endTime.toISOString(),
          category: entry.category,
          mood: entry.mood,
          tags: entry.tags ? JSON.parse(entry.tags) : []
        }
      })
    )
    
    return NextResponse.json({
      success: true,
      date: targetDateString,
      suggestions: aiResponse.suggestions,
      entries: aiEntries,
      strategy: aiResponse.overallStrategy,
      message: aiResponse.motivationalMessage
    })
    
  } catch (error) {
    console.error("Error generating AI schedule:", error)
    return NextResponse.json({ 
      error: "Failed to generate schedule suggestions", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

function analyzePatterns(entries: any[]) {
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

async function gatherUserContext(userId: string): Promise<UserContext | null> {
  try {
    // Get user goals
    const goals = await UserGoal.find({
      userId,
      isActive: true
    }).sort({ createdAt: 1 })
    
    if (goals.length === 0) {
      return null // Need goals for meaningful suggestions
    }
    
    // Get past 30 tasks for better pattern analysis
    const past30Entries = await TimeEntry.find({
      userId
    }).sort({ startTime: -1 }).limit(30)
    
    // Get recent reflections (last week)
    const oneWeekAgo = subDays(new Date(), 7)
    const recentReflections = await DayReflection.find({
      userId,
      date: { $gte: oneWeekAgo }
    }).sort({ date: -1 }).limit(7)
    
    // Analyze patterns from past entries
    const categoryStats = analyzePatterns(past30Entries)
    
    const userContext: UserContext = {
      goals: goals.map(g => g.goal),
      recentEntries: past30Entries.map(entry => ({
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
      patterns: {
        preferredCategories: categoryStats.preferredCategories,
        commonMoods: categoryStats.commonMoods,
        preferredTimes: categoryStats.preferredTimes,
        averageDurations: categoryStats.averageDurations,
        productiveHours: categoryStats.productiveHours
      },
      currentTime: format(new Date(), 'yyyy-MM-dd HH:mm'),
      timezone: 'UTC' // TODO: Get from user preferences
    }
    
    return userContext
    
  } catch (error) {
    console.error("Error gathering user context:", error)
    return null
  }
}

// Endpoint to trigger AI scheduling (called by background job)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const autoTrigger = searchParams.get("auto") === "true"
  
  try {
    await connectDB()
    
    const currentHour = new Date().getHours()
    
    // Only auto-trigger after 5 PM (17:00)
    if (autoTrigger && currentHour < 17) {
      return NextResponse.json({ 
        message: "AI scheduling only available after 5 PM",
        currentHour
      })
    }
    
    // Check if user has been active today (had any updates/new tasks)
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    
    const todayActivity = await TimeEntry.find({
      userId: session.user.id,
      createdAt: { $gte: todayStart, $lt: todayEnd }
    })
    
    if (autoTrigger && todayActivity.length === 0) {
      return NextResponse.json({ 
        message: "No activity today, skipping AI scheduling" 
      })
    }
    
    // Trigger AI scheduling for tomorrow by calling the logic directly
    const tomorrow = addDays(new Date(), 1)
    const targetDate = tomorrow
    const targetDateString = format(targetDate, 'yyyy-MM-dd')
    
    // Check if we already have planned tasks for tomorrow
    const existingEntries = await TimeEntry.find({
      userId: session.user.id,
      date: targetDate
    })
    
    if (existingEntries.length > 0) {
      return NextResponse.json({ 
        message: "Tasks already planned for tomorrow",
        existing: existingEntries 
      })
    }
    
    // Gather user context for AI
    const userContext = await gatherUserContext(session.user.id)
    
    if (!userContext) {
      return NextResponse.json({ 
        error: "Insufficient user data for AI suggestions" 
      }, { status: 400 })
    }
    
    // Generate AI suggestions
    const aiResponse = await generateScheduleSuggestions(userContext)
    
    // Store the suggestions as AI-generated entries
    const aiEntries = await Promise.all(
      aiResponse.suggestions.map(async (suggestion) => {
        // Convert suggested time to full datetime
        const [hours, minutes] = suggestion.suggestedStartTime.split(':').map(Number)
        const startTime = new Date(targetDate)
        startTime.setHours(hours, minutes, 0, 0)
        
        const endTime = new Date(startTime.getTime() + suggestion.suggestedDuration * 60 * 1000)
        
        const entry = await TimeEntry.create({
          userId: session.user.id,
          activity: suggestion.title,
          description: `${suggestion.description}\n\nAI Reasoning: ${suggestion.reasoning}`,
          duration: suggestion.suggestedDuration,
          startTime,
          endTime,
          date: targetDate,
          category: suggestion.category,
          tags: JSON.stringify(['ai-generated', suggestion.priority]),
          mood: null
        })

        // Transform MongoDB document to have 'id' instead of '_id'
        return {
          id: entry._id.toString(),
          activity: entry.activity,
          description: entry.description,
          duration: entry.duration,
          startTime: entry.startTime.toISOString(),
          endTime: entry.endTime.toISOString(),
          category: entry.category,
          mood: entry.mood,
          tags: entry.tags ? JSON.parse(entry.tags) : []
        }
      })
    )
    
    return NextResponse.json({
      success: true,
      date: targetDateString,
      suggestions: aiResponse.suggestions,
      entries: aiEntries,
      strategy: aiResponse.overallStrategy,
      message: aiResponse.motivationalMessage,
      autoTriggered: true
    })
    
  } catch (error) {
    console.error("Error in AI scheduling trigger:", error)
    return NextResponse.json({ 
      error: "Failed to trigger AI scheduling" 
    }, { status: 500 })
  }
} 