"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { format, subDays, parseISO, setHours, setMinutes } from "date-fns"
import Header from "@/components/Header"
import MobileNavigation from "@/components/MobileNavigation"
import { Calendar, Clock, Edit3, ArrowRight, Sparkles, Heart, Save } from "lucide-react"
import { useUserCategories } from "@/hooks/useUserCategories"

interface TimeEntry {
  id: string
  activity: string
  description?: string
  duration: number
  startTime: string
  endTime: string
  category: string
  mood?: string
  tags: string[]
}

interface DayReflection {
  id?: string
  date: string
  reflection: string
  rating: number
  highlights: string[]
  improvements: string[]
  gratitude: string
}

interface TimeSlot {
  id: string
  startTime: Date
  endTime: Date
  startHour: number
  endHour: number
  hasEntry: boolean
  entries: TimeEntry[]
  // For missing entries
  activity: string
  category: string
  mood: string
}

const moods = [
  { emoji: "😊", name: "Happy" },
  { emoji: "🔥", name: "Energized" },
  { emoji: "😌", name: "Calm" },
  { emoji: "🤔", name: "Focused" },
  { emoji: "😴", name: "Tired" },
  { emoji: "😤", name: "Frustrated" },
]

export default function ReflectionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { categories } = useUserCategories()
  const [yesterdayEntries, setYesterdayEntries] = useState<TimeEntry[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [savingSlots, setSavingSlots] = useState<{ [key: string]: boolean }>({})
  const [reflection, setReflection] = useState<DayReflection>({
    date: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
    reflection: '',
    rating: 5,
    highlights: [''],
    improvements: [''],
    gratitude: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const yesterday = subDays(new Date(), 1)

  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/auth/signin")
      return
    }

    fetchYesterdayData()
  }, [session, status, router])

  const generateTimeSlots = (entries: TimeEntry[]) => {
    // Create 2-hour time slots from 7 AM to 9 PM
    const timeSlotDefinitions = [
      { start: 7, end: 9 },   // 7 AM - 9 AM
      { start: 9, end: 11 },  // 9 AM - 11 AM  
      { start: 11, end: 13 }, // 11 AM - 1 PM
      { start: 13, end: 15 }, // 1 PM - 3 PM
      { start: 15, end: 17 }, // 3 PM - 5 PM
      { start: 17, end: 19 }, // 5 PM - 7 PM
      { start: 19, end: 21 }, // 7 PM - 9 PM
    ]

    const slots: TimeSlot[] = timeSlotDefinitions.map((slotDef, index) => {
      const startTime = setHours(setMinutes(yesterday, 0), slotDef.start)
      const endTime = setHours(setMinutes(yesterday, 0), slotDef.end)
      
      // Check if there are any entries that overlap with this time slot
      const slotEntries = entries.filter(entry => {
        const entryStart = new Date(entry.startTime)
        const entryEnd = new Date(entry.endTime)
        
        // Check if entry overlaps with this slot
        return (entryStart < endTime && entryEnd > startTime)
      })

      return {
        id: `slot-${index}`,
        startTime,
        endTime,
        startHour: slotDef.start,
        endHour: slotDef.end,
        hasEntry: slotEntries.length > 0,
        entries: slotEntries,
        activity: '',
        category: 'personal',
        mood: '😊'
      }
    })

    return slots
  }

  const fetchYesterdayData = async () => {
    try {
      const yesterdayDate = format(yesterday, 'yyyy-MM-dd')
      
      // Fetch yesterday's entries
      const entriesResponse = await fetch(`/api/entries?date=${yesterdayDate}`)
      if (entriesResponse.ok) {
        const entries = await entriesResponse.json()
        setYesterdayEntries(entries)
        
        // Generate time slots
        const slots = generateTimeSlots(entries)
        setTimeSlots(slots)
      }

      // Fetch existing reflection if any
      const reflectionResponse = await fetch(`/api/reflections?date=${yesterdayDate}`)
      if (reflectionResponse.ok) {
        const existingReflection = await reflectionResponse.json()
        if (existingReflection) {
          setReflection(existingReflection)
          setSubmitted(true)
        }
      }
    } catch (error) {
      console.error("Failed to fetch yesterday's data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSlotUpdate = (slotId: string, field: 'activity' | 'category' | 'mood', value: string) => {
    setTimeSlots(prev => prev.map(slot => 
      slot.id === slotId ? { ...slot, [field]: value } : slot
    ))
  }

  const saveSlotEntry = async (slot: TimeSlot) => {
    if (!slot.activity.trim()) return

    setSavingSlots(prev => ({ ...prev, [slot.id]: true }))

    try {
      const duration = Math.round((slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60))
      
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activity: slot.activity,
          duration,
          startTime: slot.startTime.toISOString(),
          category: slot.category,
          mood: slot.mood,
        }),
      })

      if (response.ok) {
        const newEntry = await response.json()
        setYesterdayEntries(prev => [...prev, newEntry])
        
        // Update the slot to show it now has an entry
        setTimeSlots(prev => prev.map(s => 
          s.id === slot.id 
            ? { ...s, hasEntry: true, entries: [newEntry], activity: '', category: 'personal', mood: '😊' }
            : s
        ))
      }
    } catch (error) {
      console.error("Failed to save slot entry:", error)
    } finally {
      setSavingSlots(prev => ({ ...prev, [slot.id]: false }))
    }
  }

  const handleSubmitReflection = async () => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/reflections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reflection),
      })

      if (response.ok) {
        setSubmitted(true)
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    } catch (error) {
      console.error("Failed to save reflection:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const formatTime = (timeString: string) => {
    try {
      return format(parseISO(timeString), 'h:mm a')
    } catch {
      return timeString
    }
  }

  const formatTimeForSlot = (date: Date) => {
    return format(date, 'h a')
  }

  const formatSlotTime = (slot: TimeSlot) => {
    return `${formatTimeForSlot(slot.startTime)} - ${formatTimeForSlot(slot.endTime)}`
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      work: { bg: "bg-blue-100", text: "text-blue-700" },
      personal: { bg: "bg-green-100", text: "text-green-700" },
      health: { bg: "bg-red-100", text: "text-red-700" },
      education: { bg: "bg-purple-100", text: "text-purple-700" },
      social: { bg: "bg-yellow-100", text: "text-yellow-700" },
      entertainment: { bg: "bg-pink-100", text: "text-pink-700" },
      other: { bg: "bg-gray-100", text: "text-gray-700" }
    }
    return colors[category] || colors.other
  }

  const getTotalDuration = () => {
    return yesterdayEntries.reduce((total, entry) => total + entry.duration, 0)
  }

  const addHighlight = () => {
    setReflection(prev => ({
      ...prev,
      highlights: [...prev.highlights, '']
    }))
  }

  const updateHighlight = (index: number, value: string) => {
    setReflection(prev => ({
      ...prev,
      highlights: prev.highlights.map((h, i) => i === index ? value : h)
    }))
  }

  const removeHighlight = (index: number) => {
    setReflection(prev => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index)
    }))
  }

  const addImprovement = () => {
    setReflection(prev => ({
      ...prev,
      improvements: [...prev.improvements, '']
    }))
  }

  const updateImprovement = (index: number, value: string) => {
    setReflection(prev => ({
      ...prev,
      improvements: prev.improvements.map((h, i) => i === index ? value : h)
    }))
  }

  const removeImprovement = (index: number) => {
    setReflection(prev => ({
      ...prev,
      improvements: prev.improvements.filter((_, i) => i !== index)
    }))
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-[#F7F7F7] to-[#EBEBEB] flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#FF385C] to-[#E31C5F] rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-[#222222] mb-2">
            Gathering your memories...
          </h2>
          <p className="text-[#767676]">
            Let's reflect on yesterday's journey ✨
          </p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-[#F7F7F7] to-[#EBEBEB] flex items-center justify-center">
        <div className="text-center animate-slide-up">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#00A699] to-[#008B7A] rounded-full flex items-center justify-center mb-6">
            <Sparkles className="h-10 w-10 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-semibold text-[#222222] mb-2">
            Beautiful reflection captured! ✨
          </h2>
          <p className="text-[#767676] mb-4">
            Now let's plan an amazing day ahead...
          </p>
          <div className="flex items-center justify-center space-x-2 text-[#FF385C]">
            <span>Taking you to your dashboard</span>
            <ArrowRight className="h-4 w-4 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-[#F7F7F7] to-[#EBEBEB]">
      <Header user={session.user} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 md:pb-8">
        {/* Hero Section */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center space-x-3 bg-white rounded-2xl px-6 py-3 shadow-lg border border-gray-100 mb-6">
            <Calendar className="h-6 w-6 text-[#FF385C]" />
            <span className="text-lg font-medium text-[#222222]">
              {format(yesterday, 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-[#222222] mb-4">
            How did yesterday unfold? 🌅
          </h1>
          <p className="text-lg text-[#767676] max-w-2xl mx-auto">
            Take a moment to reflect on your journey. Fill in any missing activities and share your thoughts about the day.
          </p>
        </div>

        <div className="space-y-8">
          {/* Timeline Section */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden animate-slide-up">
            <div className="bg-gradient-to-r from-[#00A699] to-[#007A6B] px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-2">
                    Your Yesterday Timeline
                  </h2>
                  <p className="text-white/80">
                    {yesterdayEntries.length} {yesterdayEntries.length === 1 ? 'activity' : 'activities'} tracked • {formatDuration(getTotalDuration())} total
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="space-y-6">
                {timeSlots.map((slot) => (
                  <div key={slot.id} className="relative">
                    {/* Time indicator */}
                    <div className="absolute -left-2 top-0 w-4 h-4 bg-[#00A699] rounded-full border-4 border-white shadow-md"></div>
                    <div className="absolute left-6 top-0 w-0.5 h-full bg-gradient-to-b from-[#00A699] to-[#007A6B] opacity-30"></div>
                    
                    <div className="ml-12">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-[#222222]">
                          {formatSlotTime(slot)}
                        </h3>
                        <span className="text-sm text-[#767676] font-medium">
                          Yesterday
                        </span>
                      </div>

                      {slot.hasEntry ? (
                        // Show existing entries
                        <div className="space-y-3">
                          {slot.entries.map((entry) => {
                            const colors = getCategoryColor(entry.category)
                            return (
                              <div key={entry.id} className={`p-4 rounded-2xl border-2 ${colors.bg} border-gray-200`}>
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-[#222222]">{entry.activity}</h4>
                                  <div className="flex items-center space-x-2 text-sm text-[#767676]">
                                    <span>{formatTime(entry.startTime)}</span>
                                    <span>•</span>
                                    <span>{formatDuration(entry.duration)}</span>
                                    {entry.mood && <span>•</span>}
                                    {entry.mood && <span>{entry.mood}</span>}
                                  </div>
                                </div>
                                {entry.description && (
                                  <p className="text-sm text-[#767676] mb-2">{entry.description}</p>
                                )}
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                                  {entry.category}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        // Show input form for missing entry
                        <div className="p-6 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 hover:border-[#00A699]/50 hover:bg-gray-100 transition-all">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            {/* Activity Input */}
                            <div className="md:col-span-5">
                              <label className="block text-sm font-medium text-[#222222] mb-2">
                                What did you do?
                              </label>
                              <input
                                type="text"
                                value={slot.activity}
                                onChange={(e) => handleSlotUpdate(slot.id, 'activity', e.target.value)}
                                placeholder="e.g., Working on project, Reading, Meeting..."
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#00A699]/20 focus:border-[#00A699] transition-all placeholder-gray-400 bg-white"
                              />
                            </div>

                            {/* Mood Selection */}
                            <div className="md:col-span-3">
                              <label className="block text-sm font-medium text-[#222222] mb-2">
                                Mood
                              </label>
                              <div className="flex space-x-1">
                                {moods.slice(0, 3).map((moodOption) => (
                                  <button
                                    key={moodOption.emoji}
                                    type="button"
                                    onClick={() => handleSlotUpdate(slot.id, 'mood', moodOption.emoji)}
                                    className={`p-2 rounded-lg border-2 transition-all ${
                                      slot.mood === moodOption.emoji
                                        ? 'border-[#00A699] bg-[#00A699]/10'
                                        : 'border-gray-200 hover:border-[#00A699]/50'
                                    }`}
                                    title={moodOption.name}
                                  >
                                    <span className="text-lg">{moodOption.emoji}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Category */}
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-[#222222] mb-2">
                                Category
                              </label>
                              <select
                                value={slot.category}
                                onChange={(e) => handleSlotUpdate(slot.id, 'category', e.target.value)}
                                className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#00A699]/20 focus:border-[#00A699] transition-all bg-white"
                              >
                                {categories.map((cat) => (
                                  <option key={cat} value={cat} className="capitalize">
                                    {cat}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Save Button */}
                            <div className="md:col-span-2">
                              <button
                                onClick={() => saveSlotEntry(slot)}
                                disabled={!slot.activity.trim() || savingSlots[slot.id]}
                                className="w-full py-3 px-4 bg-gradient-to-r from-[#00A699] to-[#007A6B] text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                              >
                                {savingSlots[slot.id] ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Saving...</span>
                                  </>
                                ) : (
                                  <>
                                    <Save className="h-4 w-4" />
                                    <span>Save</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {timeSlots.some(slot => !slot.hasEntry) && (
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-700">
                    💡 <strong>Tip:</strong> Fill in what you remember from yesterday. 
                    This helps us understand your patterns and create better AI suggestions for tomorrow!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Reflection Form */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden animate-slide-up">
            <div className="bg-gradient-to-r from-[#FC642D] to-[#E8590C] px-8 py-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Edit3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-1">
                    Your Daily Reflection
                  </h2>
                  <p className="text-white/80">
                    Share your thoughts and feelings about yesterday
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Overall Reflection */}
              <div className="space-y-3">
                <label className="block text-lg font-medium text-[#222222]">
                  How would you describe yesterday? 💭
                </label>
                <textarea
                  value={reflection.reflection}
                  onChange={(e) => setReflection(prev => ({ ...prev, reflection: e.target.value }))}
                  placeholder="Share your thoughts about how the day went, what you learned, how you felt..."
                  className="w-full px-5 py-4 text-base border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#FC642D]/20 focus:border-[#FC642D] transition-all placeholder-gray-400 bg-[#FAFAFA] focus:bg-white min-h-[120px] resize-none"
                />
              </div>

              {/* Day Rating */}
              <div className="space-y-3">
                <label className="block text-lg font-medium text-[#222222]">
                  Rate your day (1-10) ⭐
                </label>
                <div className="flex space-x-2">
                  {[1,2,3,4,5,6,7,8,9,10].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setReflection(prev => ({ ...prev, rating }))}
                      className={`w-12 h-12 rounded-xl border-2 font-semibold transition-all ${
                        reflection.rating >= rating
                          ? 'border-[#FC642D] bg-[#FC642D] text-white'
                          : 'border-gray-200 text-gray-400 hover:border-[#FC642D]/50'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>

              {/* Highlights */}
              <div className="space-y-3">
                <label className="block text-lg font-medium text-[#222222]">
                  What were the highlights? ✨
                </label>
                <div className="space-y-3">
                  {reflection.highlights.map((highlight, index) => (
                    <div key={index} className="flex space-x-3">
                      <input
                        type="text"
                        value={highlight}
                        onChange={(e) => updateHighlight(index, e.target.value)}
                        placeholder="A moment that made you smile..."
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#FC642D]/20 focus:border-[#FC642D] transition-all placeholder-gray-400 bg-[#FAFAFA] focus:bg-white"
                      />
                      {reflection.highlights.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeHighlight(index)}
                          className="px-3 py-3 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addHighlight}
                    className="text-[#FC642D] hover:text-[#E8590C] font-medium text-sm transition-colors"
                  >
                    + Add another highlight
                  </button>
                </div>
              </div>

              {/* Improvements */}
              <div className="space-y-3">
                <label className="block text-lg font-medium text-[#222222]">
                  What could be improved? 🌱
                </label>
                <div className="space-y-3">
                  {reflection.improvements.map((improvement, index) => (
                    <div key={index} className="flex space-x-3">
                      <input
                        type="text"
                        value={improvement}
                        onChange={(e) => updateImprovement(index, e.target.value)}
                        placeholder="Something to work on for tomorrow..."
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#FC642D]/20 focus:border-[#FC642D] transition-all placeholder-gray-400 bg-[#FAFAFA] focus:bg-white"
                      />
                      {reflection.improvements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeImprovement(index)}
                          className="px-3 py-3 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addImprovement}
                    className="text-[#FC642D] hover:text-[#E8590C] font-medium text-sm transition-colors"
                  >
                    + Add another improvement
                  </button>
                </div>
              </div>

              {/* Gratitude */}
              <div className="space-y-3">
                <label className="block text-lg font-medium text-[#222222]">
                  What are you grateful for? 🙏
                </label>
                <textarea
                  value={reflection.gratitude}
                  onChange={(e) => setReflection(prev => ({ ...prev, gratitude: e.target.value }))}
                  placeholder="Something or someone you're thankful for today..."
                  className="w-full px-5 py-4 text-base border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#FC642D]/20 focus:border-[#FC642D] transition-all placeholder-gray-400 bg-[#FAFAFA] focus:bg-white min-h-[100px] resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  onClick={handleSubmitReflection}
                  disabled={submitting || !reflection.reflection.trim()}
                  className="w-full bg-gradient-to-r from-[#FC642D] to-[#E8590C] text-white py-4 px-8 rounded-2xl font-semibold text-lg hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Saving your reflection...</span>
                    </>
                  ) : (
                    <>
                      <Heart className="h-5 w-5" />
                      <span>Save & Continue to Planning</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MobileNavigation />
    </div>
  )
} 