import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface UserContext {
  goals: any[] // Can be string[] or full goal objects
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

export interface GoalInsight {
  goalName: string
  status: 'on-track' | 'behind' | 'exceeding' | 'needs-attention'
  progressPercentage: number
  timeAllocated: number // minutes spent on goal-related activities
  alignment: 'high' | 'medium' | 'low' // how well activities align with goal
  insights: string[]
  recommendations: string[]
  blockers: string[]
  successFactors: string[]
}

export interface GoalAnalysisResponse {
  overallScore: number // 1-10 scale
  insights: GoalInsight[]
  whatIsWorking: string[]
  whatNeedsWork: string[]
  keyRecommendations: string[]
  adjustmentSuggestions: {
    goalName: string
    suggestion: string
    reason: string
  }[]
  motivationalMessage: string
  nextSteps: string[]
}

export async function analyzeGoalProgress(
  userContext: UserContext
): Promise<GoalAnalysisResponse> {
  try {
    const prompt = createGoalAnalysisPrompt(userContext)
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert goal achievement coach and productivity analyst. Your task is to analyze a user's goals against their actual time tracking data to provide actionable insights.

Analyze the user's goals, time entries, reflections, and patterns to determine:
1. How well their activities align with their stated goals
2. What patterns are helping or hindering goal achievement
3. Specific, actionable recommendations for improvement
4. Goal adjustment suggestions based on actual behavior

Always respond with valid JSON in this exact format:
{
  "overallScore": number_1_to_10,
  "insights": [
    {
      "goalName": "string",
      "status": "on-track|behind|exceeding|needs-attention",
      "progressPercentage": number_0_to_100,
      "timeAllocated": number_minutes,
      "alignment": "high|medium|low",
      "insights": ["string", "string"],
      "recommendations": ["string", "string"],
      "blockers": ["string"],
      "successFactors": ["string"]
    }
  ],
  "whatIsWorking": ["string", "string"],
  "whatNeedsWork": ["string", "string"],
  "keyRecommendations": ["string", "string"],
  "adjustmentSuggestions": [
    {
      "goalName": "string",
      "suggestion": "string", 
      "reason": "string"
    }
  ],
  "motivationalMessage": "string",
  "nextSteps": ["string", "string"]
}

Guidelines:
- Be specific and actionable in recommendations
- Use actual data patterns from their time entries
- Consider mood and reflection data for deeper insights
- Identify specific blockers and success factors
- Suggest realistic goal adjustments based on behavior patterns
- Keep motivational message encouraging but honest about areas for improvement`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 8000,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    const parsedResponse: GoalAnalysisResponse = JSON.parse(response)
    
    // Validate the response structure
    if (!parsedResponse.insights || !Array.isArray(parsedResponse.insights)) {
      throw new Error('Invalid goal analysis response format')
    }

    return parsedResponse
  } catch (error) {
    console.error('Error analyzing goal progress:', error)
    
    // Return fallback analysis if AI fails
    return createFallbackGoalAnalysis(userContext.goals)
  }
}

function createGoalAnalysisPrompt(context: UserContext): string {
  const { goals, recentEntries, recentReflections, patterns, currentTime } = context
  
  // Analyze goal-activity alignment
  const goalActivityMapping = analyzeGoalActivityAlignment(goals, recentEntries)
  
  const prompt = `Please analyze my goal progress and provide detailed insights.

**My Goals (Enhanced SMART Goals):**
${goalActivityMapping.map(mapping => {
  const goal = mapping.goalObject
  if (goal.isRefined) {
    return `- ${mapping.goal} (SMART Goal)
  * Specific: ${goal.specificGoal || 'Not specified'}
  * Measurable: ${goal.targetValue} ${goal.unit} (Current: ${goal.currentValue})
  * Progress: ${mapping.progressPercentage.toFixed(1)}%
  * Deadline: ${goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No deadline'}
  * Related Categories: ${goal.relatedCategories?.join(', ') || 'None'}
  * Specific Activities: ${goal.specificActivities?.join(', ') || 'None'}
  * Excluded Activities: ${goal.excludedActivities?.join(', ') || 'None'}`
  } else {
    return `- ${mapping.goal} (Basic Goal - Needs Refinement)`
  }
}).join('\n')}

**Recent Activity Analysis (Last 30 entries):**
${recentEntries.slice(0, 20).map(entry => 
  `- ${entry.activity} (${entry.category}, ${entry.duration}min) ${entry.mood ? `- ${entry.mood} mood` : ''} on ${entry.dayOfWeek || ''} at ${entry.timeOfDay || ''}`
).join('\n')}

**Goal-Activity Alignment Analysis:**
${goalActivityMapping.map(mapping => {
  const alignmentQuality = mapping.isSmartGoal ? 
    (mapping.totalTime > 0 ? 'Precise tracking with specific activities' : 'Well-defined but no matching activities found') :
    'Basic keyword matching only'
  
  return `- Goal "${mapping.goal}": 
  * ${mapping.relatedActivities.length} related activities (${mapping.totalTime}min total)
  * Alignment Method: ${alignmentQuality}
  * Average Session: ${mapping.averageTime.toFixed(0)}min
  ${mapping.isSmartGoal ? `* SMART Progress: ${mapping.progressPercentage.toFixed(1)}% toward ${mapping.targetValue} ${mapping.unit}` : ''}`
}).join('\n')}

**Personal Patterns:**
${patterns ? `
- Most Active Categories: ${patterns.preferredCategories.join(', ')}
- Common Moods: ${patterns.commonMoods.join(', ')}
- Peak Productivity: ${patterns.productiveHours.map(h => `${h}:00`).join(', ')}
- Preferred Times: ${patterns.preferredTimes.join(', ')}
- Avg Durations: ${Object.entries(patterns.averageDurations).map(([cat, dur]) => `${cat}(${dur}min)`).join(', ')}
` : 'No pattern data available yet'}

**Recent Reflections & Insights:**
${recentReflections.slice(0, 5).map(ref => 
  `- ${ref.date} (${ref.rating}/10): "${ref.reflection.slice(0, 150)}..." 
    Highlights: [${ref.highlights.join(', ')}]
    Improvements: [${ref.improvements.join(', ')}]`
).join('\n')}

**Analysis Request:**
1. For each goal, assess progress based on time allocation and activity alignment
2. Identify specific patterns that support or hinder each goal
3. Determine what's working well vs what needs improvement
4. Suggest specific, actionable steps for better goal achievement
5. Recommend any goal adjustments based on actual behavior patterns
6. Consider the user's mood data and reflections for deeper insights

Current time: ${currentTime}

Please provide a comprehensive analysis with specific, data-driven insights and actionable recommendations.`

  return prompt
}

function analyzeGoalActivityAlignment(goals: any[], entries: any[]) {
  return goals.map(goal => {
    let relatedActivities = []
    
    if (goal.isRefined && goal.specificActivities?.length > 0) {
      // For SMART goals, use specific activity mapping
      relatedActivities = entries.filter(entry => {
        // Check if activity matches specific activities
        const activityMatch = goal.specificActivities.some((specificActivity: string) =>
          entry.activity.toLowerCase().includes(specificActivity.toLowerCase()) ||
          specificActivity.toLowerCase().includes(entry.activity.toLowerCase())
        )
        
        // Check if category is in related categories
        const categoryMatch = goal.relatedCategories?.includes(entry.category)
        
        // Exclude if activity is in excluded list
        const isExcluded = goal.excludedActivities?.some((excludedActivity: string) =>
          entry.activity.toLowerCase().includes(excludedActivity.toLowerCase())
        )
        
        return (activityMatch || categoryMatch) && !isExcluded
      })
    } else {
      // For basic goals, use keyword matching
      relatedActivities = entries.filter(entry => 
        isActivityRelatedToGoal(entry.activity, goal.goal || goal.specificGoal || '') || 
        entry.category === mapGoalToCategory(goal.goal || goal.specificGoal || '')
      )
    }
    
    const totalTime = relatedActivities.reduce((sum, activity) => sum + activity.duration, 0)
    
    return {
      goal: goal.goal || goal.specificGoal,
      goalObject: goal,
      relatedActivities: relatedActivities.map(a => a.activity),
      totalTime,
      averageTime: relatedActivities.length > 0 ? totalTime / relatedActivities.length : 0,
      isSmartGoal: goal.isRefined,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      unit: goal.unit,
      deadline: goal.deadline,
      progressPercentage: goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0
    }
  })
}

function isActivityRelatedToGoal(activity: string, goal: string): boolean {
  const activityWords = activity.toLowerCase().split(/\s+/)
  const goalWords = goal.toLowerCase().split(/\s+/)
  
  // Simple keyword matching - could be enhanced with more sophisticated NLP
  return goalWords.some(goalWord => 
    activityWords.some(activityWord => 
      activityWord.includes(goalWord) || goalWord.includes(activityWord)
    )
  )
}

function mapGoalToCategory(goal: string): string {
  const goalLower = goal.toLowerCase()
  if (goalLower.includes('study') || goalLower.includes('learn')) return 'education'
  if (goalLower.includes('workout') || goalLower.includes('exercise') || goalLower.includes('fitness')) return 'health'
  if (goalLower.includes('work') || goalLower.includes('project')) return 'work'
  if (goalLower.includes('read')) return 'education'
  if (goalLower.includes('meditate') || goalLower.includes('focus')) return 'health'
  return 'other'
}

function createFallbackGoalAnalysis(goals: any[]): GoalAnalysisResponse {
  return {
    overallScore: 6,
    insights: goals.map(goal => ({
      goalName: typeof goal === 'string' ? goal : (goal.specificGoal || goal.goal),
      status: 'needs-attention' as const,
      progressPercentage: 50,
      timeAllocated: 0,
      alignment: 'medium' as const,
      insights: ['Need more data to provide detailed insights'],
      recommendations: ['Start tracking activities related to this goal'],
      blockers: ['Insufficient data for analysis'],
      successFactors: ['Consistent tracking will help identify patterns']
    })),
    whatIsWorking: ['You have clearly defined goals'],
    whatNeedsWork: ['More consistent time tracking', 'Better goal-activity alignment'],
    keyRecommendations: ['Track more activities related to your goals', 'Use specific activity names'],
    adjustmentSuggestions: [],
    motivationalMessage: 'Great start with goal setting! More consistent tracking will unlock powerful insights.',
    nextSteps: ['Continue tracking daily activities', 'Be specific with activity descriptions', 'Review progress weekly']
  }
}

export default openai 