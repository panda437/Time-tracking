import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/prisma"
import { TimeEntry, UserGoal, DayReflection } from "@/lib/models"
import { format, subDays } from "date-fns"
import OpenAI from 'openai'

export const maxDuration = 60

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await connectDB()
    
    const body = await request.json()
    const { message, conversationHistory } = body

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Gather user context for AI analysis
    const userContext = await gatherUserContextForChat(session.user.id)
    
    if (!userContext) {
      return NextResponse.json({ 
        error: "Insufficient data for analysis. Please set goals and track activities for a few days." 
      }, { status: 400 })
    }

    // Generate AI response using OpenAI
    const aiResponse = await generateGoalChatResponse(message, conversationHistory, userContext)
    
    return NextResponse.json({
      success: true,
      response: aiResponse
    })
    
  } catch (error) {
    console.error("Error in goal chat:", error)
    return NextResponse.json({ 
      error: "Failed to process chat request", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

async function gatherUserContextForChat(userId: string) {
  try {
    // Get user goals - only active goals (not archived or completed)
    const goals = await UserGoal.find({
      userId,
      isActive: true,
      isArchived: { $ne: true },
      isCompleted: { $ne: true }
    }).sort({ createdAt: 1 })
    
    if (goals.length === 0) {
      return null
    }
    
    // Get last 50 entries for better context
    const recentEntries = await TimeEntry.find({
      userId
    }).sort({ startTime: -1 }).limit(50)
    
    if (recentEntries.length < 3) {
      return null
    }
    
    // Get recent reflections (last 2 weeks)
    const twoWeeksAgo = subDays(new Date(), 14)
    const recentReflections = await DayReflection.find({
      userId,
      date: { $gte: twoWeeksAgo }
    }).sort({ date: -1 }).limit(10)
    
    // Analyze patterns from entries
    const patterns = analyzeUserPatterns(recentEntries)
    
    return {
      goals: goals.map(goal => ({
        goal: goal.goal,
        specificGoal: goal.specificGoal,
        targetValue: goal.targetValue,
        currentValue: goal.currentValue,
        unit: goal.unit,
        deadline: goal.deadline,
        progress: goal.targetValue ? (goal.currentValue / goal.targetValue) * 100 : 0,
        goalType: goal.goalType,
        relatedCategories: goal.relatedCategories,
        specificActivities: goal.specificActivities
      })),
      recentEntries: recentEntries.map(entry => ({
        activity: entry.activity,
        description: entry.description,
        duration: entry.duration,
        startTime: format(entry.startTime, 'yyyy-MM-dd HH:mm'),
        category: entry.category,
        mood: entry.mood || undefined
      })),
      recentReflections: recentReflections.map(ref => ({
        date: format(ref.date, 'yyyy-MM-dd'),
        reflection: ref.reflection,
        rating: ref.rating,
        highlights: ref.highlights,
        improvements: ref.improvements
      })),
      patterns,
      currentTime: format(new Date(), 'yyyy-MM-dd HH:mm')
    }
    
  } catch (error) {
    console.error("Error gathering user context for chat:", error)
    return null
  }
}

function analyzeUserPatterns(entries: any[]) {
  const categoryStats: { [key: string]: number } = {}
  const moodStats: { [key: string]: number } = {}
  const timeStats: { [key: string]: number } = {}
  
  entries.forEach(entry => {
    // Category analysis
    categoryStats[entry.category] = (categoryStats[entry.category] || 0) + entry.duration
    
    // Mood analysis
    if (entry.mood) {
      moodStats[entry.mood] = (moodStats[entry.mood] || 0) + 1
    }
    
    // Time analysis (hour of day)
    const hour = new Date(entry.startTime).getHours()
    timeStats[hour] = (timeStats[hour] || 0) + entry.duration
  })
  
  return {
    topCategories: Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, duration]) => ({ category, duration })),
    topMoods: Object.entries(moodStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([mood, count]) => ({ mood, count })),
    productiveHours: Object.entries(timeStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour, duration]) => ({ hour: parseInt(hour), duration }))
  }
}

async function generateGoalChatResponse(message: string, conversationHistory: any[], userContext: any) {
  try {
    // Create a comprehensive prompt with user context
    const prompt = createChatPrompt(message, conversationHistory, userContext)
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are Roozi, an intelligent time management and goal achievement assistant. You have access to the user's detailed time tracking data, goals, reflections, and patterns. 

Your role is to provide personalized, actionable advice based on their actual data. Be encouraging but honest, specific but not overwhelming. Use their real data to give concrete suggestions.

Key principles:
- Reference their actual goals, activities, and patterns
- Provide specific, actionable advice
- Be encouraging but realistic
- Use their data to personalize responses
- Suggest improvements based on their patterns
- Help them align their time with their goals`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const response = completion.choices[0]?.message?.content
    return response || "I'm having trouble processing your request right now. Please try again."
    
  } catch (error) {
    console.error("Error generating AI chat response:", error)
    // Fallback to basic response
    return generateFallbackResponse(message, userContext)
  }
}

function createChatPrompt(message: string, conversationHistory: any[], userContext: any): string {
  const { goals, recentEntries, recentReflections, patterns, currentTime } = userContext
  
  const conversationContext = conversationHistory.length > 0 
    ? `\n\nPrevious conversation:\n${conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}`
    : ''

  return `User's current message: "${message}"

**User's Active Goals:**
${goals.map((goal: any) => `- ${goal.specificGoal || goal.goal} (${goal.progress.toFixed(1)}% complete, target: ${goal.targetValue} ${goal.unit})`).join('\n')}

**Recent Activity (Last 10 entries):**
${recentEntries.slice(0, 10).map((entry: any) => 
  `- ${entry.activity} (${entry.category}, ${entry.duration}min) ${entry.mood ? `- felt ${entry.mood}` : ''}`
).join('\n')}

**User's Patterns:**
- Top Categories: ${patterns.topCategories.map((cat: any) => `${cat.category} (${cat.duration}min)`).join(', ')}
- Most Productive Hours: ${patterns.productiveHours.map((h: any) => `${h.hour}:00`).join(', ')}
- Common Moods: ${patterns.topMoods.map((m: any) => m.mood).join(', ')}

**Recent Reflections:**
${recentReflections.slice(0, 3).map((ref: any) => 
  `- ${ref.date} (${ref.rating}/10): "${ref.reflection.slice(0, 100)}..."`
).join('\n')}

**Current Time:** ${currentTime}${conversationContext}

Please provide a personalized, helpful response based on the user's actual data. Reference their specific goals, activities, and patterns when giving advice.`
}

function generateFallbackResponse(message: string, userContext: any): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('wasting time') || lowerMessage.includes('time sink')) {
    const lowValueCategories = userContext.patterns.topCategories
      .filter((cat: any) => ['entertainment', 'social', 'other'].includes(cat.category))
      .slice(0, 2)
    
    if (lowValueCategories.length > 0) {
      return `Based on your time tracking, you're spending significant time on ${lowValueCategories.map((cat: any) => cat.category).join(' and ')}. Consider setting specific limits or finding more productive alternatives for these activities.`
    } else {
      return "Your time tracking shows good balance across activities. Consider reviewing your goals to see if your time aligns with your priorities."
    }
  }
  
  if (lowerMessage.includes('energy') || lowerMessage.includes('happy') || lowerMessage.includes('enjoy')) {
    const positiveMoods = userContext.patterns.topMoods
      .filter((mood: any) => ['energized', 'happy', 'focused', 'productive'].includes(mood.mood))
    
    if (positiveMoods.length > 0) {
      return `You seem to feel most ${positiveMoods.map((mood: any) => mood.mood).join(' and ')} during your activities. Try to schedule more of these types of tasks during your most productive hours.`
    } else {
      return "I notice you haven't been tracking your mood consistently. Adding mood tracking can help identify which activities give you the most energy and satisfaction."
    }
  }
  
  if (lowerMessage.includes('align') || lowerMessage.includes('goals')) {
    const goalProgress = userContext.goals
      .filter((goal: any) => goal.progress < 50)
      .slice(0, 2)
    
    if (goalProgress.length > 0) {
      return `I see you're behind on some goals: ${goalProgress.map((goal: any) => goal.goal).join(' and ')}. Consider dedicating more time to these specific activities to stay on track.`
    } else {
      return "Great job! Your time tracking shows good alignment with your goals. Keep up the consistent effort!"
    }
  }
  
  if (lowerMessage.includes('pattern') || lowerMessage.includes('productivity')) {
    const productiveHours = userContext.patterns.productiveHours
    if (productiveHours.length > 0) {
      return `Your most productive hours are around ${productiveHours.map((hour: any) => `${hour.hour}:00`).join(', ')}. Try to schedule your most important tasks during these times.`
    } else {
      return "I'm still learning about your productivity patterns. Continue tracking your time consistently to get better insights."
    }
  }
  
  if (lowerMessage.includes('prioritize') || lowerMessage.includes('important')) {
    const topCategories = userContext.patterns.topCategories.slice(0, 3)
    return `Based on your current time allocation, you're prioritizing ${topCategories.map((cat: any) => cat.category).join(', ')}. Review if this aligns with your most important goals.`
  }
  
  if (lowerMessage.includes('improve') || lowerMessage.includes('management')) {
    return "To improve your time management, try: 1) Setting specific time blocks for important tasks, 2) Reviewing your patterns weekly, 3) Adjusting your schedule based on your most productive hours, and 4) Setting realistic daily priorities."
  }
  
  // Default response
  return "I can help you analyze your time patterns and goal progress. Try asking about specific areas like time sinks, energy levels, goal alignment, or productivity patterns. You can also ask me to suggest improvements based on your data."
} 