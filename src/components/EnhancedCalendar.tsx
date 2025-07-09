"use client"

import { useState, useEffect, useCallback } from "react"
import { format, addDays, startOfDay, isSameDay, parseISO, setHours, setMinutes } from "date-fns"
import { 
  DndContext, 
  DragEndEvent, 
  DragStartEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  closestCenter
} from "@dnd-kit/core"
import { 
  SortableContext, 
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Clock, Edit3, Sparkles, ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react"

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
  isAiGenerated?: boolean
}

interface EnhancedCalendarProps {
  entries: TimeEntry[]
  onEntryUpdate: (entry: TimeEntry) => void
  onEntrySelect: (entry: TimeEntry) => void
  onEntryDelete?: (entryId: string) => void
  centerDate: Date
  setCenterDate: React.Dispatch<React.SetStateAction<Date>>
  loading: boolean
}

interface TimeSlot {
  time: string
  hour: number
  minute: number
}

// Generate time slots for the day (hourly intervals)
const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = []
  for (let hour = 6; hour <= 23; hour++) {
    // Create a clean date with just the hour, no minutes/seconds
    const cleanTime = new Date()
    cleanTime.setHours(hour, 0, 0, 0)
    slots.push({
      time: format(cleanTime, 'HH:mm'),
      hour,
      minute: 0
    })
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

// Draggable Time Entry Component
interface DraggableEntryProps {
  entry: TimeEntry
  onSelect: (entry: TimeEntry) => void
  onDelete?: (entryId: string) => void
  style?: React.CSSProperties
  isDragging?: boolean
}

function DraggableEntry({ entry, onSelect, onDelete, style, isDragging }: DraggableEntryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: entry.id })

  const draggingStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
    ...style
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      work: "border-l-blue-500 bg-blue-50",
      personal: "border-l-green-500 bg-green-50",
      health: "border-l-red-500 bg-red-50",
      education: "border-l-purple-500 bg-purple-50",
      social: "border-l-yellow-500 bg-yellow-50",
      entertainment: "border-l-pink-500 bg-pink-50",
      other: "border-l-gray-500 bg-gray-50"
    }
    return colors[category] || colors.other
  }

  const isAiGenerated = entry.tags?.includes('ai-generated')

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete && window.confirm(`Are you sure you want to delete "${entry.activity}"?`)) {
      onDelete(entry.id)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={draggingStyle}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(entry)}
      className={`
        group relative p-3 border-l-4 rounded-lg shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing touch-manipulation select-none
        ${getCategoryColor(entry.category)}
        ${isAiGenerated ? 'ring-2 ring-purple-200' : ''}
      `}
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* AI Generated Indicator */}
      {isAiGenerated && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
          <Sparkles className="h-3 w-3 text-white" />
        </div>
      )}
      
      {/* Delete Button */}
      {onDelete && (
        <button
          onClick={handleDelete}
          className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity group-hover:opacity-100"
          title="Delete task"
        >
          <X className="h-3 w-3 text-white" />
        </button>
      )}
      
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">
          {entry.activity}
        </h3>
        <div className="flex items-center space-x-1 text-xs text-gray-500 ml-2">
          <Clock className="h-3 w-3" />
          <span>{entry.duration}m</span>
        </div>
      </div>
      
      {entry.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
          {entry.description}
        </p>
      )}
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {format(parseISO(entry.startTime), 'HH:mm')} - {format(parseISO(entry.endTime), 'HH:mm')}
        </span>
        {entry.mood && (
          <span className="text-xs">{entry.mood}</span>
        )}
      </div>
    </div>
  )
}

// Drop Zone Component
interface DropZoneProps {
  timeSlot: TimeSlot
  date: Date
  entries: TimeEntry[]
  onDrop: (timeSlot: TimeSlot, date: Date) => void
}

function DropZone({ timeSlot, date, entries, onDrop }: DropZoneProps) {
  const hasEntry = entries.some(entry => {
    const entryStart = parseISO(entry.startTime)
    // For hourly slots, check if any entry starts within this hour
    return entryStart.getHours() === timeSlot.hour
  })

  if (hasEntry) return null

  return (
    <div 
      className="h-16 border border-dashed border-gray-200 rounded-lg flex items-center justify-center text-sm text-gray-400 hover:border-gray-300 hover:bg-gray-50 transition-colors"
      onClick={() => onDrop(timeSlot, date)}
    >
      {timeSlot.time}
    </div>
  )
}

export default function EnhancedCalendar({ entries, onEntryUpdate, onEntrySelect, onEntryDelete, centerDate, setCenterDate, loading }: EnhancedCalendarProps) {
  const [draggedEntry, setDraggedEntry] = useState<TimeEntry | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Responsive detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Generate calendar days (2 for mobile, 5 for desktop centered on today)
  const getDaysToShow = useCallback(() => {
    if (isMobile) {
      // Mobile: 2 consecutive days starting from currentDate
      return [centerDate, addDays(centerDate, 1)]
    } else {
      // Desktop: 5-day window centered on currentDate
      return [
        addDays(centerDate, -2), // two days before
        addDays(centerDate, -1), // previous day
        centerDate,              // selected/center day
        addDays(centerDate, 1),  // next day
        addDays(centerDate, 2)   // two days after
      ]
    }
  }, [centerDate, isMobile])

  const days = getDaysToShow()

  // Get entries for a specific day
  const getEntriesForDay = (date: Date) => {
    return entries.filter(entry => 
      isSameDay(parseISO(entry.startTime), date)
    ).sort((a, b) => 
      parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime()
    )
  }

  // Get entries for a specific time slot
  const getEntriesForTimeSlot = (date: Date, timeSlot: TimeSlot) => {
    return getEntriesForDay(date).filter(entry => {
      const entryStart = parseISO(entry.startTime)
      // For hourly slots, check if entry starts within this hour
      return entryStart.getHours() === timeSlot.hour
    })
  }

  // Drag and drop handlers
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const entry = entries.find(e => e.id === event.active.id)
    setDraggedEntry(entry || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || !draggedEntry) {
      setDraggedEntry(null)
      return
    }

    // Handle dropping on time slots
    if (over.id && typeof over.id === 'string' && over.id.startsWith('slot-')) {
      const [, dateStr, hour] = over.id.split('-')
      const newDate = new Date(dateStr)
      const newStartTime = new Date(newDate)
      newStartTime.setHours(parseInt(hour), 0, 0, 0)
      const newEndTime = new Date(newStartTime.getTime() + draggedEntry.duration * 60 * 1000)

      const updatedEntry: TimeEntry = {
        ...draggedEntry,
        startTime: newStartTime.toISOString(),
        endTime: newEndTime.toISOString()
      }

      onEntryUpdate(updatedEntry)
    }

    setDraggedEntry(null)
  }

  const handleTimeSlotClick = (timeSlot: TimeSlot, date: Date) => {
    // Create a new entry at this time slot with clean time
    const startTime = new Date(date)
    startTime.setHours(timeSlot.hour, 0, 0, 0)
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)
    
    const newEntry: TimeEntry = {
      id: `new-${Date.now()}`,
      activity: "New Task",
      duration: 60,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      category: "other",
      tags: []
    }
    
    onEntrySelect(newEntry)
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (isMobile) {
      // Mobile: move window by 2 days
      setCenterDate(prev => addDays(prev, direction === 'next' ? 2 : -2))
    } else {
      // Desktop: shift window by 5 days to keep views contiguous
      setCenterDate(prev => addDays(prev, direction === 'next' ? 5 : -5))
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FF385C] to-[#E31C5F] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div>
              <h2 className="text-xl font-semibold text-white">
                {isMobile ? "2-Day View" : "5-Day View"}
              </h2>
              <p className="text-white/80 text-sm flex items-center space-x-2">
                <span>{format(days[0], 'MMM d')} - {format(days[days.length - 1], 'MMM d, yyyy')}</span>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              </p>
            </div>
            
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          
          <button
            onClick={() => setCenterDate(new Date())}
            className="px-4 py-2 bg-white/20 text-white text-sm font-medium rounded-xl hover:bg-white/30 transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Days Header */}
          <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-5'} gap-4 mb-6`}>
            {days.map((day) => (
              <div key={day.toISOString()} className="text-center">
                <div className={`
                  p-3 rounded-xl border-2 transition-all
                  ${isSameDay(day, new Date()) 
                    ? 'border-[#FF385C] bg-[#FF385C]/10 text-[#FF385C]' 
                    : 'border-gray-200 text-gray-700'
                  }
                `}>
                  <div className="font-semibold text-lg">
                    {format(day, 'EEE')}
                  </div>
                  <div className="text-sm">
                    {format(day, 'd')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="relative overflow-auto max-h-96">
            <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-5'} gap-4`}>
              {days.map((day) => {
                const dayEntries = getEntriesForDay(day)
                
                return (
                  <div key={day.toISOString()} className="space-y-2">
                    <SortableContext items={dayEntries.map(e => e.id)} strategy={verticalListSortingStrategy}>
                      {TIME_SLOTS.map((timeSlot) => {
                        const slotEntries = getEntriesForTimeSlot(day, timeSlot)
                        const slotId = `slot-${day.toISOString()}-${timeSlot.hour}`
                        
                                                  return (
                            <div key={slotId} className="min-h-16">
                            {slotEntries.length > 0 ? (
                              slotEntries.map((entry) => (
                                <DraggableEntry
                                  key={entry.id}
                                  entry={entry}
                                  onSelect={onEntrySelect}
                                  onDelete={onEntryDelete}
                                />
                              ))
                            ) : (
                              <DropZone
                                timeSlot={timeSlot}
                                date={day}
                                entries={dayEntries}
                                onDrop={handleTimeSlotClick}
                              />
                            )}
                          </div>
                        )
                      })}
                    </SortableContext>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {draggedEntry ? (
              <DraggableEntry
                entry={draggedEntry}
                onSelect={() => {}}
                onDelete={() => {}}
                isDragging={true}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
} 