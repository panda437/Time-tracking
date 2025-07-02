"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Header from "@/components/Header"
import MobileNavigation from "@/components/MobileNavigation"
import { ThumbsUp, MessageSquare, Send } from "lucide-react"

interface Feature {
  id: string
  title: string
  description: string
  upvotes: number
  hasUserVoted: boolean
}

interface UserFeedback {
  id: string
  title: string
  description: string
  createdAt: string
  userEmail?: string
  upvotes: number
  hasUserVoted: boolean
}

export default function FeedbackPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [features, setFeatures] = useState<Feature[]>([])
  const [userFeedback, setUserFeedback] = useState<UserFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [feedbackForm, setFeedbackForm] = useState({ title: "", description: "" })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/auth/signin")
      return
    }

    fetchFeedback()
  }, [session, status, router])

  const fetchFeedback = async () => {
    try {
      const response = await fetch('/api/feedback')
      if (response.ok) {
        const data = await response.json()
        
        // Transform data to match our interface
        const transformedFeedback = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          upvotes: item.upvotes,
          hasUserVoted: item.feedback_votes?.some((vote: any) => vote.user_email === session?.user?.email) || false,
          createdAt: item.created_at,
          userEmail: item.user_email
        }))
        
        setUserFeedback(transformedFeedback)
      }
    } catch (error) {
      console.error('Failed to fetch feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpvote = async (feedbackId: string) => {
    try {
      const response = await fetch(`/api/feedback/${feedbackId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isUpvote: true
        })
      })
      
      if (response.ok) {
        // Refresh feedback data to get updated vote counts
        fetchFeedback()
      }
    } catch (error) {
      console.error('Failed to vote:', error)
    }
  }

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedbackForm.title.trim() || !feedbackForm.description.trim()) return

    setSubmitting(true)
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: feedbackForm.title,
          description: feedbackForm.description
        })
      })
      
      if (response.ok) {
        setFeedbackForm({ title: "", description: "" })
        fetchFeedback() // Refresh to show new feedback
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-[#F7F7F7] to-[#EBEBEB] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FF385C]/20 border-t-[#FF385C] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading feedback...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-[#F7F7F7] to-[#EBEBEB]">
      <Header user={{ name: session.user?.name, email: session.user?.email }} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#222222] mb-4">
            Shape TimeTrack's Future
          </h1>
          <p className="text-xl text-[#767676] max-w-2xl mx-auto">
            Vote on upcoming features and share your ideas to help us build the perfect time tracking experience.
          </p>
        </div>

        {/* All Feedback/Ideas Section */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FF385C] to-[#E31C5F] rounded-xl flex items-center justify-center">
              <ThumbsUp className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#222222]">Feature Ideas & Requests</h2>
          </div>
          
          {userFeedback.length > 0 ? (
            <div className="grid gap-6">
              {userFeedback.map((feedback) => (
                <div key={feedback.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[#222222] mb-2">
                        {feedback.title}
                      </h3>
                      <p className="text-[#767676] mb-4">
                        {feedback.description}
                      </p>
                      <div className="text-xs text-gray-500">
                        {new Date(feedback.createdAt).toLocaleDateString()} • {feedback.userEmail}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleUpvote(feedback.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all hover:scale-105 ${
                        feedback.hasUserVoted
                          ? 'bg-[#FF385C] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-[#FF385C]/10'
                      }`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span className="font-medium">{feedback.upvotes}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No ideas submitted yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>

        {/* User Feedback Section */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00A699] to-[#009B8E] rounded-xl flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#222222]">Share Your Ideas</h2>
          </div>

          {/* Feedback Form */}
          <form onSubmit={handleSubmitFeedback} className="mb-8">
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Feature title or idea..."
                value={feedbackForm.title}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
                required
              />
              <textarea
                placeholder="Describe your idea in detail..."
                value={feedbackForm.description}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent resize-none"
                required
              />
              <button
                type="submit"
                disabled={submitting || !feedbackForm.title.trim() || !feedbackForm.description.trim()}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#FF385C] to-[#E31C5F] text-white font-semibold rounded-xl hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                <span>{submitting ? 'Submitting...' : 'Submit Idea'}</span>
              </button>
            </div>
          </form>

          {/* User Feedback List */}
          {userFeedback.length > 0 && (
            <div className="space-y-4 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-[#222222] mb-4">Recent Ideas</h3>
              {userFeedback.map((feedback) => (
                <div key={feedback.id} className="border border-gray-200 rounded-xl p-4">
                  <h4 className="font-medium text-[#222222] mb-2">{feedback.title}</h4>
                  <p className="text-[#767676] text-sm mb-2">{feedback.description}</p>
                  <div className="text-xs text-gray-500">
                    {new Date(feedback.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <MobileNavigation />
    </div>
  )
}
