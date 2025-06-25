"use client"

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

export default function GoogleAnalytics() {
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
