"use client"

import { useState, useEffect } from 'react'

export function useInstallPrompt() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [hasCreatedFirstTask, setHasCreatedFirstTask] = useState(false)
  
  useEffect(() => {
    // Check if user has already dismissed the prompt
    const hasSeenInstallPrompt = localStorage.getItem('timetrack-install-prompt-dismissed')
    
    // Check if app is already installed (running in standalone mode)
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true
    
    // Don't show if already dismissed or already installed
    if (hasSeenInstallPrompt || isInstalled) {
      return
    }
    
    // Show prompt after first task creation with a small delay
    if (hasCreatedFirstTask) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true)
      }, 2000) // 2 second delay to let them enjoy the moment
      
      return () => clearTimeout(timer)
    }
  }, [hasCreatedFirstTask])
  
  const triggerAfterFirstTask = () => {
    setHasCreatedFirstTask(true)
  }
  
  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false)
    localStorage.setItem('timetrack-install-prompt-dismissed', 'true')
  }
  
  return {
    showInstallPrompt,
    triggerAfterFirstTask,
    dismissInstallPrompt
  }
} 