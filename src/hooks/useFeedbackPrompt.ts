import { useState, useEffect } from 'react'

export function useFeedbackPrompt() {
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false)

  useEffect(() => {
    // Check if user has already seen the feedback prompt
    const hasSeenFeedbackPrompt = localStorage.getItem('timetrack-feedback-prompt-dismissed')
    
    if (!hasSeenFeedbackPrompt) {
      // Show feedback prompt after a delay (e.g., after user has used the app for a bit)
      const timer = setTimeout(() => {
        setShowFeedbackPrompt(true)
      }, 30000) // Show after 30 seconds

      return () => clearTimeout(timer)
    }
  }, [])

  const triggerAfterFirstTask = () => {
    // Show feedback prompt after first task creation
    const hasSeenFeedbackPrompt = localStorage.getItem('timetrack-feedback-prompt-dismissed')
    
    if (!hasSeenFeedbackPrompt) {
      setTimeout(() => {
        setShowFeedbackPrompt(true)
      }, 2000) // Show 2 seconds after first task
    }
  }

  const dismissFeedbackPrompt = () => {
    setShowFeedbackPrompt(false)
    localStorage.setItem('timetrack-feedback-prompt-dismissed', 'true')
  }

  return {
    showFeedbackPrompt,
    triggerAfterFirstTask,
    dismissFeedbackPrompt
  }
} 