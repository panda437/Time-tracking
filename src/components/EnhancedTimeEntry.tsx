import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Clock, Calendar, Send, CheckCircle } from 'lucide-react'

interface TimeSlot {
  startTime: Date
  endTime: Date
  id: string
}

interface EntryData {
  activity: string
  mood: string
  category: string
}

const MOOD_OPTIONS = [
  '😊', '😔', '😤', 
  '🤔', '😴', '🔥'
]

const CATEGORY_OPTIONS = [
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'health', label: 'Health' },
  { value: 'learning', label: 'Learning' },
  { value: 'social', label: 'Social' },
  { value: 'other', label: 'Other' }
]

interface EnhancedTimeEntryProps {
  onEntryAdded?: () => void
}

export default function EnhancedTimeEntry({ onEntryAdded }: EnhancedTimeEntryProps) {
  const { data: session } = useSession()
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [entries, setEntries] = useState<{ [key: string]: EntryData }>({})
  const [submittedSlots, setSubmittedSlots] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    generateTimeSlots()
  }, [])

  const generateTimeSlots = () => {
    const slots: TimeSlot[] = []
    
    // Start with current hour rounded down (e.g., if it's 3:47 PM, use 3:00 PM)
    const currentHour = new Date()
    currentHour.setMinutes(0, 0, 0)
    
    // Generate 10 time slots of 2 hours each, going back 20 hours in clean chunks
    for (let i = 0; i < 10; i++) {
      const hoursBack = i * 2
      const endTime = new Date(currentHour.getTime() - (hoursBack * 60 * 60 * 1000))
      const startTime = new Date(endTime.getTime() - (2 * 60 * 60 * 1000))
      
      slots.push({
        id: `slot-${i}`,
        startTime,
        endTime
      })
    }
    
    setTimeSlots(slots)
    
    // Initialize entries object
    const initialEntries: { [key: string]: EntryData } = {}
    slots.forEach(slot => {
      initialEntries[slot.id] = {
        activity: '',
        mood: '',
        category: 'work'
      }
    })
    setEntries(initialEntries)
  }

  const formatTimeSlot = (startTime: Date, endTime: Date) => {
    const formatTime = (date: Date) => {
      // For exact hours, don't show :00
      if (date.getMinutes() === 0) {
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          hour12: true 
        })
      }
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    }
    
    const formatDate = (date: Date) => {
      const today = new Date()
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      
      if (date.toDateString() === today.toDateString()) {
        return 'Today'
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday'
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }
    }

    return {
      time: `${formatTime(startTime)} - ${formatTime(endTime)}`,
      date: formatDate(startTime)
    }
  }

  const updateEntry = (slotId: string, field: keyof EntryData, value: string) => {
    setEntries(prev => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        [field]: value
      }
    }))
  }

  const submitEntry = async (slot: TimeSlot) => {
    if (!session?.user?.id) return

    const entryData = entries[slot.id]
    if (!entryData.activity.trim()) return

    setSubmitting(prev => ({ ...prev, [slot.id]: true }))

    try {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          activity: entryData.activity,
          description: '',
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
          duration: 120, // 2 hours in minutes
          category: entryData.category,
          mood: entryData.mood || '😊'
        })
      })

      if (response.ok) {
        setSubmittedSlots(prev => new Set([...prev, slot.id]))
        // Clear the entry
        setEntries(prev => ({
          ...prev,
          [slot.id]: {
            activity: '',
            mood: '',
            category: 'work'
          }
        }))
        // Notify parent component
        onEntryAdded?.()
      }
    } catch (error) {
      console.error('Failed to submit entry:', error)
    } finally {
      setSubmitting(prev => ({ ...prev, [slot.id]: false }))
    }
  }

  const isSlotSubmitted = (slotId: string) => submittedSlots.has(slotId)
  const canSubmit = (slotId: string) => entries[slotId]?.activity.trim().length > 0

  return (
    <div className="space-y-3">
      {/* Header Row - Hidden on mobile */}
      <div className="hidden md:grid grid-cols-12 gap-4 pb-3 border-b border-gray-200 text-sm font-medium text-[#767676]">
        <div className="col-span-2">Time Window</div>
        <div className="col-span-4">What did you do?</div>
        <div className="col-span-2">Mood</div>
        <div className="col-span-2">Category</div>
        <div className="col-span-2">Action</div>
      </div>

      {/* Time Slot Rows */}
      {timeSlots.map((slot) => {
        const { time, date } = formatTimeSlot(slot.startTime, slot.endTime)
        const entryData = entries[slot.id]
        const isSubmitted = isSlotSubmitted(slot.id)
        const isSubmittingSlot = submitting[slot.id]

        return (
          <div 
            key={slot.id} 
            className={`border-b border-gray-100 transition-all ${
              isSubmitted ? 'bg-green-50' : 'md:hover:bg-gray-50'
            }`}
          >
            {/* Mobile Layout */}
            <div className="md:hidden p-4 space-y-4">
              {/* Time Window - Mobile */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-[#222222]">{time}</div>
                  <div className="text-sm text-[#767676]">{date}</div>
                </div>
                {isSubmitted && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">Saved</span>
                  </div>
                )}
              </div>

              {/* Activity Input - Mobile */}
              <div>
                <label className="block text-sm font-medium text-[#767676] mb-2">What did you do?</label>
                {isSubmitted ? (
                  <div className="text-base text-green-700 font-medium p-3 bg-green-50 rounded-xl">
                    Entry saved! ✓
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g., Working on project, Reading, Meeting..."
                    value={entryData?.activity || ''}
                    onChange={(e) => updateEntry(slot.id, 'activity', e.target.value)}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent placeholder-gray-400"
                  />
                )}
              </div>

              {/* Mood & Category Row - Mobile */}
              <div className="grid grid-cols-2 gap-4">
                {/* Mood Selector - Mobile */}
                <div>
                  <label className="block text-sm font-medium text-[#767676] mb-2">Mood</label>
                  {isSubmitted ? (
                    <div className="text-2xl p-3 bg-gray-50 rounded-xl text-center">
                      {entryData?.mood || '😊'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {MOOD_OPTIONS.map((mood) => (
                        <button
                          key={mood}
                          onClick={() => updateEntry(slot.id, 'mood', mood)}
                          className={`p-3 text-xl rounded-xl border transition-all active:scale-95 ${
                            entryData?.mood === mood
                              ? 'border-[#FF385C] bg-[#FF385C]/10'
                              : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                          }`}
                        >
                          {mood}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Category Dropdown - Mobile */}
                <div>
                  <label className="block text-sm font-medium text-[#767676] mb-2">Category</label>
                  {isSubmitted ? (
                    <div className="text-base capitalize text-gray-600 p-3 bg-gray-50 rounded-xl text-center">
                      {entryData?.category || 'work'}
                    </div>
                  ) : (
                    <select
                      value={entryData?.category || 'work'}
                      onChange={(e) => updateEntry(slot.id, 'category', e.target.value)}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
                    >
                      {CATEGORY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Action Button - Mobile */}
              {!isSubmitted && (
                <button
                  onClick={() => submitEntry(slot)}
                  disabled={!canSubmit(slot.id) || isSubmittingSlot}
                  className={`w-full flex items-center justify-center px-6 py-4 rounded-xl font-medium text-base transition-all ${
                    canSubmit(slot.id) && !isSubmittingSlot
                      ? 'bg-[#FF385C] text-white hover:bg-[#E31C5F] active:bg-[#D91C5C] active:scale-98'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmittingSlot ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Save Entry
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Desktop Layout - Hidden on mobile */}
            <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:py-4">
              {/* Time Window - Desktop */}
              <div className="col-span-2">
                <div className="text-sm font-medium text-[#222222]">{time}</div>
                <div className="text-xs text-[#767676]">{date}</div>
              </div>

              {/* Activity Input - Desktop */}
              <div className="col-span-4">
                {isSubmitted ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Entry saved!</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g., Working on project, Reading, Meeting..."
                    value={entryData?.activity || ''}
                    onChange={(e) => updateEntry(slot.id, 'activity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent text-sm"
                  />
                )}
              </div>

              {/* Mood Selector - Desktop */}
              <div className="col-span-2">
                {!isSubmitted && (
                  <div className="grid grid-cols-3 gap-1">
                    {MOOD_OPTIONS.map((mood) => (
                      <button
                        key={mood}
                        onClick={() => updateEntry(slot.id, 'mood', mood)}
                        className={`p-2 text-lg rounded-lg border transition-all hover:scale-110 ${
                          entryData?.mood === mood
                            ? 'border-[#FF385C] bg-[#FF385C]/10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {mood}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Category Dropdown - Desktop */}
              <div className="col-span-2">
                {!isSubmitted && (
                  <select
                    value={entryData?.category || 'work'}
                    onChange={(e) => updateEntry(slot.id, 'category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent text-sm"
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Submit Button - Desktop */}
              <div className="col-span-2">
                {!isSubmitted && (
                  <button
                    onClick={() => submitEntry(slot)}
                    disabled={!canSubmit(slot.id) || isSubmittingSlot}
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      canSubmit(slot.id) && !isSubmittingSlot
                        ? 'bg-[#FF385C] text-white hover:bg-[#E31C5F] hover:scale-105'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isSubmittingSlot ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* Summary */}
      <div className="mt-8 p-4 md:p-6 bg-gradient-to-r from-[#FF385C]/10 to-[#E31C5F]/10 rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 md:h-5 md:w-5 text-[#FF385C]" />
            <span className="font-medium text-base md:text-sm text-[#222222]">
              Progress: {submittedSlots.size} of {timeSlots.length} time slots completed
            </span>
          </div>
          <div className="text-base md:text-sm text-[#767676] font-medium">
            {submittedSlots.size === timeSlots.length ? '🎉 All done!' : 'Keep going!'}
          </div>
        </div>
      </div>
    </div>
  )
}