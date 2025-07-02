"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { subMinutes } from "date-fns"
import TimePicker from "./TimePicker"
import { trackTimeEntry, trackFormInteraction } from "./GoogleAnalytics"

interface TimeEntry {
  id: string
  activity: string
  description?: string
  duration: number
  startTime: string
  endTime: string
  date: string
  category: string
  mood?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface TimeEntryFormProps {
  onEntryAdded: (entry: TimeEntry) => void
  showExpandedByDefault?: boolean
  isFirstEntry?: boolean
}

const categories = [
  "work", "personal", "health", "education", "social", "entertainment", "other"
]

const moods = [
  { emoji: "😊", name: "Happy", color: "from-yellow-400 to-orange-400" },
  { emoji: "🔥", name: "Energized", color: "from-red-400 to-pink-400" },
  { emoji: "😌", name: "Calm", color: "from-green-400 to-teal-400" },
  { emoji: "🤔", name: "Focused", color: "from-blue-400 to-indigo-400" },
  { emoji: "😴", name: "Tired", color: "from-gray-400 to-slate-400" },
  { emoji: "😤", name: "Frustrated", color: "from-orange-400 to-red-400" },
]

const durationOptions = [
  { value: 15, label: "15 min", description: "Quick task" },
  { value: 30, label: "30 min", description: "Half hour" },
  { value: 45, label: "45 min", description: "Medium session" },
  { value: 60, label: "1 hour", description: "Full hour" },
  { value: 90, label: "1.5 hours", description: "Extended time" },
  { value: 120, label: "2 hours", description: "Long session" },
  { value: 180, label: "3 hours", description: "Deep work" },
]

export default function TimeEntryForm({ onEntryAdded, showExpandedByDefault = false, isFirstEntry = false }: TimeEntryFormProps) {
  const router = useRouter()
  const [activity, setActivity] = useState("")
  const [description, setDescription] = useState("")
  const [duration, setDuration] = useState(30)
  const [category, setCategory] = useState("work")
  const [mood, setMood] = useState("")
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(showExpandedByDefault)
  const [startTime, setStartTime] = useState<Date>(new Date())
  const [endTime, setEndTime] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showSuccess, setShowSuccess] = useState(false)


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Use the selected start time from TimePicker, or fallback to calculated time
      const submissionStartTime = isExpanded 
        ? startTime.toISOString() 
        : subMinutes(new Date(), duration).toISOString()
      
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activity,
          description,
          duration,
          startTime: submissionStartTime,
          category,
          mood: mood || null,
        }),
      })

      if (response.ok) {
        const newEntry = await response.json()
        onEntryAdded(newEntry)
        
        // Track the time entry creation
        trackTimeEntry('create', category, duration)
        trackFormInteraction('submit', 'time_entry_form')
        
        // Show success message
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 5000)
        
        // If this is the first entry, redirect to reflection page
        if (isFirstEntry) {
          setTimeout(() => {
            router.push('/reflection')
          }, 2000)
          return
        }
        
        // Reset form
        setActivity("")
        setDescription("")
        setDuration(30)
        setCategory("work")
        setMood("")
        setIsExpanded(false) // Collapse form after success
      } else {
        console.error("Failed to create entry")
      }
    } catch (error) {
      console.error("Error creating entry:", error)
    } finally {
      setLoading(false)
    }
  }

  // Memoize TimePicker event handlers to prevent infinite loops
  const handleTimeChange = useCallback((newStartTime: Date, newEndTime: Date) => {
    setStartTime(newStartTime)
    setEndTime(newEndTime)
  }, [])

  const handleDateChange = useCallback((newDate: Date) => {
    setSelectedDate(newDate)
  }, [])

  const selectedMood = moods.find(m => m.emoji === mood)
  const selectedDuration = durationOptions.find(d => d.value === duration)

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden animate-slide-up">
      {/* Header with conversational tone */}
      <div className="bg-gradient-to-r from-[#FF385C] to-[#E31C5F] px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-white/30 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-white/20 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-white/20 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
          

        </div>
        
        <h2 className="text-2xl font-semibold text-white mt-2 mb-1">
          What did you just accomplish?
        </h2>
        <p className="text-white/80 text-sm">
          Let's capture this moment in your journey ✨
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* Main Activity Input */}
        <div className="space-y-3">
          <label className="block text-lg font-medium text-[#222222]">
            Tell me about it...
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="e.g., Brainstormed ideas for the new app design"
              className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-smooth placeholder-gray-400 bg-[#FAFAFA] focus:bg-white"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4">
              <div className={`w-3 h-3 rounded-full transition-smooth ${
                activity ? 'bg-[#00A699]' : 'bg-gray-300'
              }`}></div>
            </div>
          </div>
        </div>

        {/* Duration Selection */}
        <div className="space-y-4">
          <label className="block text-lg font-medium text-[#222222]">
            How much time did this take?
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {durationOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDuration(option.value)}
                className={`p-4 rounded-2xl border-2 transition-bounce text-center ${
                  duration === option.value
                    ? 'border-[#FF385C] bg-[#FF385C]/8 shadow-md'
                    : 'border-gray-200 hover:border-[#FF385C]/50 hover:bg-[#FF385C]/5'
                }`}
              >
                <div className={`font-semibold ${
                  duration === option.value ? 'text-[#FF385C]' : 'text-[#222222]'
                }`}>
                  {option.label}
                </div>
                <div className="text-xs text-[#767676] mt-1">
                  {option.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Details Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium text-[#222222]">Want to add more details?</span>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#F7F7F7] via-white to-[#F7F7F7] hover:from-[#EBEBEB] hover:via-[#F0F0F0] hover:to-[#EBEBEB] transition-smooth shadow-sm hover:shadow-md border border-gray-100"
          >
            <span className="text-sm font-medium text-[#767676]">
              {isExpanded ? 'Less' : 'More'}
            </span>
            <div className={`transform transition-smooth ${
              isExpanded ? 'rotate-180' : ''
            }`}>
              ↓
            </div>
          </button>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="space-y-6 animate-slide-up">
            {/* Time Picker */}
            <TimePicker
              defaultTime={startTime}
              defaultDate={selectedDate}
              duration={duration}
              onTimeChange={handleTimeChange}
              onDateChange={handleDateChange}
            />

            {/* Description */}
            <div className="space-y-3">
              <label className="block text-base font-medium text-[#222222]">
                Any additional thoughts?
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share any context, challenges, or wins..."
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-smooth placeholder-gray-400 bg-[#FAFAFA] focus:bg-white resize-none"
              />
            </div>

            {/* Category */}
            <div className="space-y-3">
              <label className="block text-base font-medium text-[#222222]">
                What area of life was this?
              </label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`p-3 rounded-xl border-2 transition-bounce text-sm font-medium capitalize ${
                      category === cat
                        ? 'border-[#00A699] bg-[#00A699]/8 text-[#00A699]'
                        : 'border-gray-200 text-[#767676] hover:border-[#00A699]/50 hover:bg-[#00A699]/5'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Mood */}
            <div className="space-y-3">
              <label className="block text-base font-medium text-[#222222]">
                How are you feeling about it?
              </label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {moods.map((moodOption) => (
                  <button
                    key={moodOption.emoji}
                    type="button"
                    onClick={() => setMood(mood === moodOption.emoji ? "" : moodOption.emoji)}
                    className={`p-4 rounded-2xl border-2 transition-bounce text-center group ${
                      mood === moodOption.emoji
                        ? 'border-[#FC642D] bg-gradient-to-br ' + moodOption.color + ' shadow-lg'
                        : 'border-gray-200 hover:border-[#FC642D]/50 bg-white hover:shadow-md'
                    }`}
                  >
                    <div className="text-2xl mb-1">{moodOption.emoji}</div>
                    <div className={`text-xs font-medium ${
                      mood === moodOption.emoji ? 'text-white' : 'text-[#767676] group-hover:text-[#222222]'
                    }`}>
                      {moodOption.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading || !activity}
            className={`w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-smooth shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
              loading
                ? 'bg-gray-400 text-white'
                : 'bg-gradient-to-r from-[#FF385C] to-[#E31C5F] text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Saving your moment...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <span>✨ Capture this time</span>
              </div>
            )}
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center space-x-2 pt-2">
          <div className={`w-2 h-2 rounded-full transition-smooth ${
            activity ? 'bg-[#FF385C]' : 'bg-gray-300'
          }`}></div>
          <div className={`w-2 h-2 rounded-full transition-smooth ${
            duration ? 'bg-[#FF385C]' : 'bg-gray-300'
          }`}></div>
          <div className={`w-2 h-2 rounded-full transition-smooth ${
            (description || category || mood) && isExpanded ? 'bg-[#FF385C]' : 'bg-gray-300'
          }`}></div>
        </div>
      </form>

      {/* Success Message */}
      {showSuccess && (
        <div className="absolute inset-x-0 top-full mt-4 mx-8 p-6 bg-gradient-to-r from-[#00A699] to-[#009B8E] text-white rounded-2xl shadow-xl border border-[#00A699]/20 animate-slide-up">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xl">✨</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">
                Beautiful! Your moment is captured ✓
              </h3>
              <p className="text-white/90 text-sm mb-3">
                "{activity}" has been added to your story. {selectedMood ? `Love that ${selectedMood.name.toLowerCase()} energy! ` : ''}
              </p>
              <p className="text-white/80 text-sm">
                💡 <span className="font-medium">Keep the momentum going!</span> What else made your day meaningful?
              </p>
            </div>
            <button 
              onClick={() => setShowSuccess(false)}
              className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <span className="text-white/70 hover:text-white text-sm">✕</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
