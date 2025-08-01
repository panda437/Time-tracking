"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { subMinutes } from "date-fns"
import TimePicker from "./TimePicker"
import ScrollPicker from "./ScrollPicker"
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
  const [duration, setDuration] = useState(60)
  const [category, setCategory] = useState("work")
  const [mood, setMood] = useState("")
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(showExpandedByDefault)
  const [startTime, setStartTime] = useState<Date>(() => {
    const now = new Date()
    const startTime = new Date(now)
    startTime.setMinutes(startTime.getMinutes() - 60) // Start 1 hour ago
    // Round to nearest half hour
    const minutes = startTime.getMinutes()
    const roundedMinutes = Math.floor(minutes / 30) * 30
    startTime.setMinutes(roundedMinutes)
    startTime.setSeconds(0)
    startTime.setMilliseconds(0)
    return startTime
  })
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

  const updateStartTimeForDuration = useCallback((newDuration: number) => {
    const now = new Date()
    const startTime = new Date(now)
    startTime.setMinutes(startTime.getMinutes() - newDuration)
    // Round to nearest half hour
    const minutes = startTime.getMinutes()
    const roundedMinutes = Math.floor(minutes / 30) * 30
    startTime.setMinutes(roundedMinutes)
    startTime.setSeconds(0)
    startTime.setMilliseconds(0)
    setStartTime(startTime)
  }, [])

  const [areaScrollIndex, setAreaScrollIndex] = useState(0)
  const [feelingScrollIndex, setFeelingScrollIndex] = useState(0)

  const selectedMood = moods.find(m => m.emoji === mood)
  const selectedDuration = durationOptions.find(d => d.value === duration)

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden animate-slide-up">
      <form onSubmit={handleSubmit} className="p-2 md:p-6 space-y-4">
        {/* What did you accomplish? */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-base font-medium text-[#222222]">
            <span>◎</span>
            <span>What did you do in the last one hour?</span>
          </label>
          <input
            type="text"
            required
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            placeholder="Scrolled social media .."
            className="w-full px-4 py-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all placeholder-gray-400 bg-gray-50 focus:bg-white"
          />
        </div>

        {/* Mobile Layout: How long full width, then Time+Date in one row */}
        <div className="md:hidden space-y-3">
          {/* How long - Full width */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-[#222222]">
              <span>⏱️</span>
              <span>How long?</span>
            </label>
            <div className="flex flex-wrap gap-1">
              {[
                { value: 15, label: "15m" },
                { value: 30, label: "30m" },
                { value: 60, label: "1h" },
                { value: 90, label: "1.5h" },
                { value: 120, label: "2h" },
                { value: 180, label: "3h" }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setDuration(option.value)
                    updateStartTimeForDuration(option.value)
                  }}
                  className={`px-2 py-1 rounded-md border transition-all text-xs font-medium ${
                    duration === option.value
                      ? 'bg-[#FF385C] text-white border-[#FF385C]'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-[#FF385C]/50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time and Date - One row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Start Time */}
            <div className="space-y-1">
              <label className="flex items-center space-x-2 text-sm font-medium text-[#222222]">
                <span>⌚</span>
                <span>Start Time</span>
              </label>
              <input
                type="time"
                value={startTime.toTimeString().slice(0, 5)}
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(':')
                  const newTime = new Date(startTime)
                  newTime.setHours(parseInt(hours), parseInt(minutes))
                  setStartTime(newTime)
                }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all bg-gray-50 focus:bg-white"
              />
            </div>

            {/* Date */}
            <div className="space-y-1">
              <label className="flex items-center space-x-2 text-sm font-medium text-[#222222]">
                <span>🗓️</span>
                <span>Date</span>
              </label>
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all bg-gray-50 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Desktop Layout: How long, Start time, Date - all 3 in one row */}
        <div className="hidden md:grid md:grid-cols-3 gap-3">
          {/* How long? */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-[#222222]">
              <span>⏱️</span>
              <span>How long?</span>
            </label>
            <div className="flex flex-wrap gap-1">
              {[
                { value: 15, label: "15m" },
                { value: 30, label: "30m" },
                { value: 60, label: "1h" },
                { value: 90, label: "1.5h" },
                { value: 120, label: "2h" },
                { value: 180, label: "3h" }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setDuration(option.value)
                    updateStartTimeForDuration(option.value)
                  }}
                  className={`px-2 py-1 rounded-md border transition-all text-xs font-medium ${
                    duration === option.value
                      ? 'bg-[#FF385C] text-white border-[#FF385C]'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-[#FF385C]/50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Start Time */}
          <div className="space-y-1">
            <label className="flex items-center space-x-2 text-sm font-medium text-[#222222]">
              <span>⌚</span>
              <span>Start Time</span>
            </label>
            <input
              type="time"
              value={startTime.toTimeString().slice(0, 5)}
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(':')
                const newTime = new Date(startTime)
                newTime.setHours(parseInt(hours), parseInt(minutes))
                setStartTime(newTime)
              }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all bg-gray-50 focus:bg-white"
            />
          </div>

          {/* Date */}
          <div className="space-y-1">
            <label className="flex items-center space-x-2 text-sm font-medium text-[#222222]">
              <span>🗓️</span>
              <span>Date</span>
            </label>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all bg-gray-50 focus:bg-white"
            />
          </div>
        </div>

        {/* Area and Feeling - Desktop: one row, Mobile: side-by-side scroll pickers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mobile: Side-by-side scroll pickers */}
          <div className="md:hidden grid grid-cols-2 gap-4">
            {/* Area */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-[#222222]">
                <span>📁</span>
                <span>Area</span>
              </label>
              <ScrollPicker
                items={[
                  { value: "work", label: "Work", icon: "💼" },
                  { value: "personal", label: "Personal", icon: "🏠" },
                  { value: "health", label: "Health", icon: "💪" },
                  { value: "education", label: "Education", icon: "🎓" },
                  { value: "social", label: "Social", icon: "👥" },
                  { value: "fun", label: "Fun", icon: "🎬" },
                  { value: "side-project", label: "Side Project", icon: "💡" },
                  { value: "other", label: "Other", icon: "📝" }
                ]}
                selectedValue={category}
                onSelect={setCategory}
                height={120}
                itemHeight={40}
              />
            </div>

            {/* Feeling */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-[#222222]">
                <span>😊</span>
                <span>Feeling</span>
              </label>
              <ScrollPicker
                items={[
                  { value: "🤩", label: "Excited", emoji: "🤩" },
                  { value: "🔥", label: "Energized", emoji: "🔥" },
                  { value: "😄", label: "Happy", emoji: "😄" },
                  { value: "😵‍💫", label: "Focused", emoji: "😵‍💫" },
                  { value: "😌", label: "Calm", emoji: "😌" },
                  { value: "😩", label: "Tired", emoji: "😩" },
                  { value: "😤", label: "Frustrated", emoji: "😤" },
                  { value: "😥", label: "Stressed", emoji: "😥" }
                ]}
                selectedValue={mood}
                onSelect={setMood}
                height={120}
                itemHeight={40}
              />
            </div>
          </div>

          {/* Desktop: Separate columns */}
          <div className="hidden md:block">
            {/* Area */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-[#222222]">
                <span>📁</span>
                <span>Area</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "work", label: "Work", icon: "💼" },
                  { value: "personal", label: "Personal", icon: "🏠" },
                  { value: "health", label: "Health", icon: "💪" },
                  { value: "education", label: "Education", icon: "🎓" },
                  { value: "social", label: "Social", icon: "👥" },
                  { value: "fun", label: "Fun", icon: "🎬" },
                  { value: "side-project", label: "Side Project", icon: "💡" },
                  { value: "other", label: "Other", icon: "📝" }
                ].map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-full border transition-all ${
                      category === cat.value
                        ? 'bg-[#FF385C] text-white border-[#FF385C]'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-[#FF385C]/50'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm font-medium capitalize">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            {/* Feeling */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-[#222222]">
                <span>😊</span>
                <span>Feeling</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { emoji: "🤩", name: "Excited" },
                  { emoji: "🔥", name: "Energized" },
                  { emoji: "😄", name: "Happy" },
                  { emoji: "😵‍💫", name: "Focused" },
                  { emoji: "😌", name: "Calm" },
                  { emoji: "😩", name: "Tired" },
                  { emoji: "😤", name: "Frustrated" },
                  { emoji: "😥", name: "Stressed" }
                ].map((moodOption) => (
                  <button
                    key={moodOption.emoji}
                    type="button"
                    onClick={() => setMood(mood === moodOption.emoji ? "" : moodOption.emoji)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-full border transition-all ${
                      mood === moodOption.emoji
                        ? 'bg-[#FF385C] text-white border-[#FF385C]'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-[#FF385C]/50'
                    }`}
                  >
                    <span className="text-lg">{moodOption.emoji}</span>
                    <span className="text-sm font-medium">{moodOption.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Thoughts */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium text-[#222222]">
            <span>💬</span>
            <span>Additional Thoughts</span>
          </label>
          <textarea
            rows={1}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Any reflections or challenges..."
            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all placeholder-gray-400 bg-gray-50 focus:bg-white resize-none"
          />
        </div>

        {/* Submit Button */}
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
              <span>Saving...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <span>✨</span>
              <span>Capture This Time</span>
            </div>
          )}
        </button>
      </form>

      {/* Success Message */}
      {showSuccess && (
        <div className="absolute inset-x-0 top-full mt-4 mx-6 p-6 bg-gradient-to-r from-[#00A699] to-[#009B8E] text-white rounded-2xl shadow-xl border border-[#00A699]/20 animate-slide-up">
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
                "{activity}" has been added to your story. {selectedMood ? `Love that energy! ` : ''}
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
