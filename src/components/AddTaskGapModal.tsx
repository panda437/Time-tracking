"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Clock, X, Calendar, Smile } from "lucide-react"
import { trackTimeEntry, trackFormInteraction } from "./GoogleAnalytics"
import { CATEGORIES } from '@/lib/categories'

interface AddTaskGapModalProps {
  isOpen: boolean
  onClose: () => void
  startTime: Date
  endTime: Date
  onTaskAdded: (task: any) => void
  title?: string
  subtitle?: string
}

const moods = [
  { emoji: "😊", name: "Happy" },
  { emoji: "🔥", name: "Energized" },
  { emoji: "😌", name: "Calm" },
  { emoji: "🤔", name: "Focused" },
  { emoji: "😴", name: "Tired" },
  { emoji: "😤", name: "Frustrated" },
]

export default function AddTaskGapModal({ isOpen, onClose, startTime, endTime, onTaskAdded, title, subtitle }: AddTaskGapModalProps) {
  const [activity, setActivity] = useState("")
  const [category, setCategory] = useState("work")
  const [mood, setMood] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  if (!isOpen) return null

  const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activity,
          duration,
          startTime: startTime.toISOString(),
          category,
          mood: mood || null,
        }),
      })

      if (response.ok) {
        const newEntry = await response.json()
        onTaskAdded(newEntry)
        
        // Track the gap-filled time entry creation
        trackTimeEntry('create', category, duration)
        trackFormInteraction('submit', 'gap_fill_modal')
        
        // Reset form and close modal
        setActivity("")
        setCategory("work")
        setMood("")
        setError("")
        onClose()
      } else {
        const errorData = await response.text()
        console.error("Failed to create entry:", errorData)
        setError("Failed to create task. Please try again.")
      }
    } catch (error) {
      console.error("Error creating entry:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FF385C] to-[#E31C5F] px-6 py-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
          
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {title || 'Fill in the gap'}
              </h2>
              <p className="text-white/80 text-sm">
                {subtitle || 'What happened during this time?'}
              </p>
            </div>
          </div>

          {/* Time Range Display */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-white/70" />
                <span className="text-sm font-medium">
                  {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                </span>
              </div>
              <div className="text-sm font-medium">
                {Math.floor(duration / 60)}h {duration % 60}m
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Activity Input */}
          <div className="space-y-3">
            <label className="block text-lg font-medium text-gray-900">
              What did you do?
            </label>
            <input
              type="text"
              required
              value={activity}
              onChange={(e) => {
                setActivity(e.target.value)
                if (error) setError("") // Clear error when user types
              }}
              placeholder="e.g., Had lunch with Sarah, Read a book..."
              className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all placeholder-gray-400 bg-gray-50 focus:bg-white"
            />
          </div>

          {/* Category */}
          <div className="space-y-3">
            <label className="block text-base font-medium text-gray-900">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`p-3 rounded-xl border-2 transition-all text-sm font-medium capitalize ${
                    category === cat
                      ? 'border-[#00A699] bg-[#00A699]/8 text-[#00A699]'
                      : 'border-gray-200 text-gray-600 hover:border-[#00A699]/50 hover:bg-[#00A699]/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div className="space-y-3">
            <label className="block text-base font-medium text-gray-900">
              How did it feel?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {moods.map((moodOption) => (
                <button
                  key={moodOption.emoji}
                  type="button"
                  onClick={() => setMood(mood === moodOption.emoji ? "" : moodOption.emoji)}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    mood === moodOption.emoji
                      ? 'border-[#FC642D] bg-[#FC642D]/8 shadow-md'
                      : 'border-gray-200 hover:border-[#FC642D]/50 bg-white hover:shadow-sm'
                  }`}
                >
                  <div className="text-xl mb-1">{moodOption.emoji}</div>
                  <div className={`text-xs font-medium ${
                    mood === moodOption.emoji ? 'text-[#FC642D]' : 'text-gray-600'
                  }`}>
                    {moodOption.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !activity}
              className={`w-full py-3 px-6 rounded-xl font-semibold text-base transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                loading
                  ? 'bg-gray-400 text-white'
                  : 'bg-gradient-to-r from-[#FF385C] to-[#E31C5F] text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Adding task...</span>
                </div>
              ) : (
                "✨ Add to timeline"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
