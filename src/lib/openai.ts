import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface UserContext {
  goals: string[]
  recentEntries: Array<{
    activity: string
    category: string
    duration: number
    startTime: string
    mood?: string
    rating?: number
    dayOfWeek?: string
    timeOfDay?: string
  }>
  recentReflections: Array<{
    date: string
    reflection: string
    rating: number
    highlights: string[]
    improvements: string[]
  }>
  patterns?: {
    preferredCategories: string[]
    commonMoods: string[]
    preferredTimes: string[]
    averageDurations: { [category: string]: number }
    productiveHours: number[]
  }
  currentTime: string
  timezone: string
}

export interface TaskSuggestion {
  title: string
  description: string
  category: string
  suggestedStartTime: string
  suggestedDuration: number
  reasoning: string
  priority: 'high' | 'medium' | 'low'
}

export interface ScheduleResponse {
  suggestions: TaskSuggestion[]
  overallStrategy: string
  motivationalMessage: string
}

export async function generateScheduleSuggestions(
  userContext: UserContext
): Promise<ScheduleResponse> {
  try {
    const prompt = createSchedulingPrompt(userContext)
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an intelligent time management assistant that helps users plan their day based on their goals, past activities, and personal patterns. You understand productivity, work-life balance, and individual preferences.

Your task is to suggest 6 time blocks for tomorrow that align with the user's goals and optimize their productivity based on their past patterns.

Always respond with valid JSON in this exact format:
{
  "suggestions": [
    {
      "title": "string",
      "description": "string", 
      "category": "work|personal|health|education|social|entertainment|other",
      "suggestedStartTime": "HH:MM",
      "suggestedDuration": number_in_minutes,
      "reasoning": "string",
      "priority": "high|medium|low"
    }
  ],
  "overallStrategy": "string",
  "motivationalMessage": "string"
}

Guidelines:
- Suggest realistic time blocks that fit common schedules
- Consider the user's mood patterns and energy levels
- Balance different categories based on their goals
- Provide thoughtful reasoning for each suggestion
- Keep motivational messages positive and personalized
- Suggest durations between 30-180 minutes
- Use 24-hour format for times (e.g., "09:00", "14:30")
- Consider work-life balance and avoid overloading`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 8000,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    const parsedResponse: ScheduleResponse = JSON.parse(response)
    
    // Validate the response structure
    if (!parsedResponse.suggestions || !Array.isArray(parsedResponse.suggestions)) {
      throw new Error('Invalid response format from AI')
    }

    return parsedResponse
  } catch (error) {
    console.error('Error generating schedule suggestions:', error)
    
    // Return fallback suggestions if AI fails
    return {
      suggestions: [
        {
          title: "Morning Focus Session",
          description: "Tackle your most important task when your energy is highest",
          category: "work",
          suggestedStartTime: "09:00",
          suggestedDuration: 90,
          reasoning: "Morning hours are typically when focus and energy levels are at their peak",
          priority: "high"
        },
        {
          title: "Mid-Morning Task",
          description: "Continue productive work while energy remains high",
          category: "work",
          suggestedStartTime: "10:45",
          suggestedDuration: 75,
          reasoning: "Building on morning momentum for continued productivity",
          priority: "high"
        },
        {
          title: "Midday Break & Movement",
          description: "Take a refreshing break to recharge",
          category: "health", 
          suggestedStartTime: "12:30",
          suggestedDuration: 45,
          reasoning: "Regular breaks help maintain productivity and well-being",
          priority: "medium"
        },
        {
          title: "Afternoon Deep Work",
          description: "Focus on detailed or creative tasks",
          category: "work",
          suggestedStartTime: "14:00",
          suggestedDuration: 90,
          reasoning: "Post-lunch period good for detailed concentration",
          priority: "medium"
        },
        {
          title: "Personal Development",
          description: "Learn something new or work on personal goals",
          category: "education",
          suggestedStartTime: "16:30",
          suggestedDuration: 60,
          reasoning: "Late afternoon energy for self-improvement activities",
          priority: "medium"
        },
        {
          title: "Evening Wind-down",
          description: "Reflect and prepare for tomorrow",
          category: "personal",
          suggestedStartTime: "19:00", 
          suggestedDuration: 60,
          reasoning: "Evening reflection helps process the day and plan ahead",
          priority: "low"
        }
      ],
      overallStrategy: "Focus on balancing productivity with well-being throughout the day",
      motivationalMessage: "Every small step forward is progress. You've got this! 🌟"
    }
  }
}

function createSchedulingPrompt(context: UserContext): string {
  const { goals, recentEntries, recentReflections, patterns, currentTime } = context
  
  const prompt = `Help me plan tomorrow based on my goals and detailed activity patterns.

**My Goals:**
${goals.map(goal => `- ${goal}`).join('\n')}

**Recent Activity History (Past 30 Tasks):**
${recentEntries.slice(0, 15).map(entry => 
  `- ${entry.activity} (${entry.category}, ${entry.duration}min, ${entry.timeOfDay || ''}) ${entry.mood ? `- felt ${entry.mood}` : ''} on ${entry.dayOfWeek || ''}`
).join('\n')}

**My Personal Patterns:**
${patterns ? `
- Preferred Categories: ${patterns.preferredCategories.join(', ')}
- Common Moods: ${patterns.commonMoods.join(', ')}
- Preferred Times: ${patterns.preferredTimes.join(', ')}
- Average Durations: ${Object.entries(patterns.averageDurations).map(([cat, dur]) => `${cat}: ${dur}min`).join(', ')}
- Most Productive Hours: ${patterns.productiveHours.map(h => `${h}:00`).join(', ')}
` : 'No pattern data available yet'}

**Recent Reflections:**
${recentReflections.slice(0, 3).map(ref => 
  `- ${ref.date}: Rated ${ref.rating}/10. "${ref.reflection.slice(0, 100)}..."`
).join('\n')}

**Context:**
- Current time: ${currentTime}
- Please suggest 6 time blocks for tomorrow
- Use my personal patterns to suggest optimal timing and categories
- Consider my productive hours and preferred activity durations
- Balance work towards my goals with my natural preferences
- Help me maintain productivity while respecting my mood and energy patterns

Please provide 6 highly personalized suggestions based on my actual usage patterns and goals.`

  return prompt
}

export default openai 