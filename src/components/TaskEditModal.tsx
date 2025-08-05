"use client"

import { useState, useEffect } from "react"
import { format, parseISO, setHours, setMinutes } from "date-fns"
import { Clock, Edit3, HelpCircle, Sparkles, Trash2, Save } from "lucide-react"
import { useUserCategories } from '@/hooks/useUserCategories'

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

interface TaskEditModalProps {
  entry: TimeEntry | null
  isOpen: boolean
  onClose: () => void
  onSave: (entry: TimeEntry) => void
  onDelete?: (entryId: string) => void
  onReschedule?: (entry: TimeEntry) => void
}

const moods = [
  { emoji: "😊", name: "Happy" },
  { emoji: "🔥", name: "Energized" },
  { emoji: "😌", name: "Calm" },
  { emoji: "🤔", name: "Focused" },
  { emoji: "😴", name: "Tired" },
  { emoji: "😤", name: "Frustrated" },
]

export default function TaskEditModal({ 
  entry, 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  onReschedule 
}: TaskEditModalProps) {
  const { categories } = useUserCategories()
  const [formData, setFormData] = useState<TimeEntry>({
    id: '',
    activity: '',
    description: '',
    duration: 30,
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    category: categories.length > 0 ? categories[0] : 'work',
    mood: '',
    tags: []
  })
  
  const [startTimeInput, setStartTimeInput] = useState('')
  const [endTimeInput, setEndTimeInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (entry && isOpen) {
      setFormData(entry)
      setStartTimeInput(format(parseISO(entry.startTime), 'HH:mm'))
      setEndTimeInput(format(parseISO(entry.endTime), 'HH:mm'))
    }
  }, [entry, isOpen])

  const updateTimes = (newStartTime: string, newEndTime?: string) => {
    const startDate = parseISO(formData.startTime)
    const [startHour, startMinute] = newStartTime.split(':').map(Number)
    const newStart = setMinutes(setHours(startDate, startHour), startMinute)
    
    let newEnd: Date
    if (newEndTime) {
      const [endHour, endMinute] = newEndTime.split(':').map(Number)
      newEnd = setMinutes(setHours(startDate, endHour), endMinute)
    } else {
      // Calculate end time based on duration
      newEnd = new Date(newStart.getTime() + formData.duration * 60 * 1000)
    }
    
    const newDuration = Math.round((newEnd.getTime() - newStart.getTime()) / (1000 * 60))
    
    setFormData(prev => ({
      ...prev,
      startTime: newStart.toISOString(),
      endTime: newEnd.toISOString(),
      duration: newDuration
    }))
  }

  const handleStartTimeChange = (time: string) => {
    setStartTimeInput(time)
    updateTimes(time)
  }

  const handleEndTimeChange = (time: string) => {
    setEndTimeInput(time)
    updateTimes(startTimeInput, time)
  }

  const handleDurationChange = (newDuration: number) => {
    setFormData(prev => {
      const startDate = parseISO(prev.startTime)
      const endDate = new Date(startDate.getTime() + newDuration * 60 * 1000)
      
      setEndTimeInput(format(endDate, 'HH:mm'))
      
      return {
        ...prev,
        duration: newDuration,
        endTime: endDate.toISOString()
      }
    })
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving task:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = () => {
    if (onDelete && formData.id && !formData.id.startsWith('new-')) {
      onDelete(formData.id)
      onClose()
    }
  }

  const handleReschedule = () => {
    if (onReschedule) {
      onReschedule(formData)
      onClose()
    }
  }

  const isAiGenerated = formData.tags.includes('ai-generated')
  const isNewTask = !formData.id || formData.id.startsWith('new-')

  if (!isOpen || !entry) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6 pb-24 md:pb-6">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl mx-auto transform transition-all">
          {/* Header */}
          <div className={`px-8 py-6 rounded-t-3xl ${
            isAiGenerated 
              ? 'bg-gradient-to-r from-purple-500 to-purple-600' 
              : 'bg-gradient-to-r from-[#FF385C] to-[#E31C5F]'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  {isAiGenerated ? (
                    <Sparkles className="h-6 w-6 text-white" />
                  ) : (
                    <Edit3 className="h-6 w-6 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-1">
                    {isNewTask ? 'Create New Task' : 'Edit Task'}
                  </h2>
                  <p className="text-white/80">
                    {isAiGenerated ? 'AI-generated task' : 'Focus on timing and details'}
                  </p>
                </div>
              </div>
              
              {!isNewTask && onReschedule && (
                <button
                  onClick={handleReschedule}
                  className="p-3 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-colors"
                  title="Smart reschedule"
                >
                  <HelpCircle className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8 space-y-6">
            {/* Task Title - Primary Focus */}
            <div className="space-y-3">
              <label className="block text-lg font-medium text-[#222222]">
                Task Title *
              </label>
              <input
                type="text"
                value={formData.activity}
                onChange={(e) => setFormData(prev => ({ ...prev, activity: e.target.value }))}
                placeholder="What needs to be done?"
                className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all placeholder-gray-400 bg-[#FAFAFA] focus:bg-white"
                autoFocus
              />
            </div>

            {/* Time Controls - Main Focus */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#222222] flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Start Time</span>
                </label>
                <input
                  type="time"
                  value={startTimeInput}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#222222] flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>End Time</span>
                </label>
                <input
                  type="time"
                  value={endTimeInput}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#222222]">
                  Duration
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all"
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[#222222]">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add details about this task..."
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all placeholder-gray-400 bg-[#FAFAFA] focus:bg-white resize-none"
              />
            </div>

            {/* Category & Mood */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-[#222222]">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all capitalize"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat} className="capitalize">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-[#222222]">
                  Mood
                </label>
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, mood: '' }))}
                    className={`px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                      !formData.mood
                        ? 'border-[#FF385C] bg-[#FF385C]/10 text-[#FF385C]'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    None
                  </button>
                  {moods.map((mood) => (
                    <button
                      key={mood.emoji}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, mood: mood.emoji }))}
                      className={`px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all whitespace-nowrap ${
                        formData.mood === mood.emoji
                          ? 'border-[#FF385C] bg-[#FF385C]/10 text-[#FF385C]'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {mood.emoji} {mood.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-8 py-6 bg-gray-50 rounded-b-3xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {!isNewTask && onDelete && (
                <button
                  onClick={handleDelete}
                  className="px-6 py-3 text-red-600 hover:text-white hover:bg-red-600 border-2 border-red-200 hover:border-red-600 rounded-xl transition-all font-medium flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Task</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSave}
                disabled={loading || !formData.activity.trim()}
                className="px-6 py-3 bg-gradient-to-r from-[#FF385C] to-[#E31C5F] text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{isNewTask ? 'Create Task' : 'Save Changes'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 