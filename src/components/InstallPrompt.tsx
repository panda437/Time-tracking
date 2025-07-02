"use client"

import { useState, useEffect } from 'react'
import { X, Download, Smartphone, Zap } from 'lucide-react'

interface InstallPromptProps {
  show: boolean
  onClose: () => void
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

export default function InstallPrompt({ show, onClose }: InstallPromptProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  
  useEffect(() => {
    // Detect iOS for Safari-specific instructions
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))
    
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])
  
  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt()
      const choiceResult = await installPrompt.userChoice
      if (choiceResult.outcome === 'accepted') {
        setInstallPrompt(null)
        onClose()
      }
    }
  }
  
  if (!show) return null
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md mx-auto transform transition-all animate-slide-up">
          {/* Header */}
          <div className="px-6 py-6 text-center">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="w-16 h-16 bg-gradient-to-br from-[#FF385C] to-[#E31C5F] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Smartphone className="h-8 w-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-[#222222] mb-2">
              Install TimeTrack
            </h2>
            <p className="text-[#767676] text-sm leading-relaxed">
              Get instant access to your time tracking right from your home screen. Never lose track of your progress again!
            </p>
          </div>
          
          {/* Benefits */}
          <div className="px-6 py-4 bg-gray-50 rounded-2xl mx-6 mb-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Zap className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm text-[#222222]">Launch instantly from home screen</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Download className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm text-[#222222]">Works offline when needed</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-sm text-[#222222]">App-like experience, no browser</span>
              </div>
            </div>
          </div>
          
          {/* Install Instructions */}
          <div className="px-6 pb-6">
            {installPrompt ? (
              // Chrome/Edge - Show install button
              <button
                onClick={handleInstall}
                className="w-full py-4 px-6 bg-gradient-to-r from-[#FF385C] to-[#E31C5F] text-white rounded-2xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Install App
              </button>
            ) : isIOS ? (
              // iOS Safari - Show manual instructions
              <div className="text-center">
                <p className="text-sm text-[#767676] mb-4">
                  Tap the share button <span className="inline-block w-4 h-4 bg-blue-500 rounded text-white text-xs leading-4">⬆</span> in Safari, then select "Add to Home Screen"
                </p>
                <button
                  onClick={onClose}
                  className="w-full py-3 px-6 bg-gray-100 text-[#222222] rounded-2xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Got it!
                </button>
              </div>
            ) : (
              // Other browsers - Generic message
              <div className="text-center">
                <p className="text-sm text-[#767676] mb-4">
                  Look for the install option in your browser menu, or bookmark this page for quick access.
                </p>
                <button
                  onClick={onClose}
                  className="w-full py-3 px-6 bg-gray-100 text-[#222222] rounded-2xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Maybe later
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 