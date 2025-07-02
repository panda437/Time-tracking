// Server-side analytics using GA4 Measurement Protocol
const GA_MEASUREMENT_ID = 'G-03R4WGQ6KX'
const GA_API_SECRET = process.env.GA4_API_SECRET // You'll need to add this to your env

interface AnalyticsEvent {
  name: string
  parameters?: Record<string, any>
}

export async function trackServerEvent(
  clientId: string,
  userId: string,
  events: AnalyticsEvent[]
) {
  // Only track in production or if explicitly enabled
  if (process.env.NODE_ENV === 'development' && !process.env.ENABLE_DEV_ANALYTICS) {
    console.log('📊 Server Analytics Event (DEV):', { clientId, userId, events })
    return
  }

  if (!GA_API_SECRET) {
    console.warn('GA4_API_SECRET not configured for server-side analytics')
    return
  }

  try {
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          user_id: userId,
          events: events.map(event => ({
            name: event.name,
            parameters: {
              engagement_time_msec: 100,
              ...event.parameters
            }
          }))
        })
      }
    )

    if (!response.ok) {
      console.error('Failed to send analytics event:', response.status)
    }
  } catch (error) {
    console.error('Analytics tracking error:', error)
  }
}

// Helper functions for specific success metrics
export async function trackUserTaskMilestone(
  userId: string,
  taskCount: number,
  clientId?: string
) {
  const milestones = [3, 10, 25, 50, 100]
  const milestone = milestones.find(m => taskCount === m)
  
  if (milestone) {
    await trackServerEvent(
      clientId || generateClientId(userId),
      userId,
      [
        {
          name: 'task_milestone_reached',
          parameters: {
            milestone_count: milestone,
            user_id: userId,
            event_category: 'engagement',
            // Special flag for the critical 3-task success metric
            is_success_metric: milestone === 3
          }
        }
      ]
    )

    // Special tracking for 3-task milestone (key success metric)
    if (milestone === 3) {
      await trackServerEvent(
        clientId || generateClientId(userId),
        userId,
        [
          {
            name: 'three_tasks_success',
            parameters: {
              event_category: 'success_metric',
              metric_type: 'engagement',
              user_id: userId
            }
          }
        ]
      )
    }
  }
}

export async function trackUserRetention(
  userId: string,
  retentionDay: number,
  clientId?: string
) {
  if (retentionDay === 2) {
    await trackServerEvent(
      clientId || generateClientId(userId),
      userId,
      [
        {
          name: 'day_2_retention',
          parameters: {
            retention_day: retentionDay,
            event_category: 'success_metric',
            metric_type: 'retention',
            user_id: userId
          }
        }
      ]
    )
  }
}

// Generate a consistent client ID for server-side events
function generateClientId(userId: string): string {
  // Create a consistent client ID based on user ID
  return userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) + '.server'
}

// Track user's first activity
export async function trackUserFirstActivity(
  userId: string,
  activityType: 'task_created' | 'goal_set' | 'reflection_completed',
  clientId?: string
) {
  await trackServerEvent(
    clientId || generateClientId(userId),
    userId,
    [
      {
        name: 'first_activity',
        parameters: {
          activity_type: activityType,
          event_category: 'onboarding',
          user_id: userId
        }
      }
    ]
  )
} 