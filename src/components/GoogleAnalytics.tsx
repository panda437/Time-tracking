"use client"

import { useEffect } from 'react'
import Script from 'next/script'

export const GA_TRACKING_ID = 'G-03R4WGQ6KX'

// Analytics tracking functions
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', { action, category, label, value })
  }
  
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

export const trackTimeEntry = (action: 'create' | 'edit' | 'delete', category: string, duration: number) => {
  trackEvent(action, 'time_entry', category, duration)
}

export const trackPageView = (page_title: string, page_location: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_title,
      page_location,
    })
  }
}

export const trackUserGoals = (action: 'set' | 'update', goalCount: number) => {
  trackEvent(action, 'user_goals', `${goalCount}_goals`, goalCount)
}

export const trackPomodoro = (action: 'start' | 'complete' | 'pause', duration?: number) => {
  trackEvent(action, 'pomodoro', undefined, duration)
}

export const trackCalendarInteraction = (action: 'day_click' | 'month_change' | 'hover_tooltip') => {
  trackEvent(action, 'calendar_interaction')
}

export const trackFormInteraction = (action: 'expand' | 'collapse' | 'submit', formType: string) => {
  trackEvent(action, 'form_interaction', formType)
}

// Success Metrics Tracking
export const trackDay2Return = () => {
  // Check if user visited yesterday and is visiting today
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()
  
  const lastVisit = localStorage.getItem('timetrack-last-visit')
  const day2Tracked = localStorage.getItem('timetrack-day2-tracked')
  
  // If they visited yesterday and this is today, and we haven't tracked this yet
  if (lastVisit === yesterday && !day2Tracked) {
    trackEvent('day_2_return', 'retention_milestone', 'user_returned_day_2')
    localStorage.setItem('timetrack-day2-tracked', 'true')
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('🎉 Day 2 Return tracked!')
    }
  }
  
  // Always update last visit
  localStorage.setItem('timetrack-last-visit', today)
}

export const trackTaskMilestone = (taskCount: number) => {
  const milestones = [3, 10, 25, 50, 100]
  const trackedMilestones = JSON.parse(localStorage.getItem('timetrack-milestones-tracked') || '[]')
  
  milestones.forEach(milestone => {
    if (taskCount >= milestone && !trackedMilestones.includes(milestone)) {
      trackEvent('task_milestone', 'engagement_milestone', `${milestone}_tasks_created`, milestone)
      trackedMilestones.push(milestone)
      
      // Special tracking for the critical 3-task milestone
      if (milestone === 3) {
        trackEvent('three_tasks_milestone', 'success_metric', 'user_created_3_tasks', 3)
      }
      
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎯 ${milestone} tasks milestone tracked!`)
      }
    }
  })
  
  localStorage.setItem('timetrack-milestones-tracked', JSON.stringify(trackedMilestones))
}

export default function GoogleAnalytics() {
  // Track Day 2 return on every page load
  useEffect(() => {
    trackDay2Return()
  }, [])

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_view_on_load: true,
              send_page_view: true
            });
          `,
        }}
      />
    </>
  )
}

// Extend window type for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}
