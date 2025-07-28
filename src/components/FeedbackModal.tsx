"use client"

import { useState } from "react"
import { X, MessageCircle, Star, Heart } from "lucide-react"
import Link from "next/link"

interface FeedbackModalProps {
  show: boolean
  onClose: () => void
}

export default function FeedbackModal({ show, onClose }: FeedbackModalProps) {
  const [hasSeenFeedbackPrompt, setHasSeenFeedbackPrompt] = useState(false)

  const handleClose = () => {
    setHasSeenFeedbackPrompt(true)
    localStorage.setItem('timetrack-feedback-prompt-dismissed', 'true')
    onClose()
  }

  const handleFeedbackClick = () => {
    setHasSeenFeedbackPrompt(true)
    localStorage.setItem('timetrack-feedback-prompt-dismissed', 'true')
    onClose()
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose}></div>
        <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md mx-auto transform transition-all">
          {/* Header */}
          <div className="px-6 py-6 rounded-t-3xl bg-gradient-to-r from-[#FF385C] to-[#E31C5F]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    We'd love your feedback!
                  </h2>
                  <p className="text-white/80 text-sm">
                    Help us make Roozi even better
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <Heart className="h-8 w-8 text-[#FF385C]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How's your experience with Roozi?
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Your feedback helps us improve and add features that matter most to you. 
                Share your thoughts, suggestions, or report any issues you've encountered.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href="/feedback"
                onClick={handleFeedbackClick}
                className="w-full flex items-center justify-center px-4 py-3 bg-[#FF385C] text-white rounded-xl hover:bg-[#E31C5F] transition-colors font-medium"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Share Feedback
              </Link>
              
              <button
                onClick={handleClose}
                className="w-full px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
              >
                Maybe later
              </button>
            </div>

            {/* Rating Section */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-center text-sm text-gray-500 mb-3">
                Enjoying Roozi? Rate us!
              </p>
              <div className="flex justify-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => {
                      // You can add rating logic here
                      handleClose()
                    }}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star className="h-6 w-6 text-yellow-400 hover:text-yellow-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 