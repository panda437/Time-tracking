"use client"

import { useState, useEffect, useRef } from "react"
import { format, parse, addMinutes, startOfDay, isSameDay } from "date-fns"

interface TimePickerProps {
  defaultTime?: Date
  defaultDate?: Date
  duration: number
  onTimeChange: (startTime: Date, endTime: Date) => void
  onDateChange: (date: Date) => void
}

export default function TimePicker({ 
  defaultTime, 
  defaultDate = new Date(), 
  duration, 
  onTimeChange, 
  onDateChange 
}: TimePickerProps) {
  const sliderRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedDate, setSelectedDate] = useState(defaultDate)
  
  // Round current time to last half hour
  const roundToHalfHour = (date: Date) => {
    const minutes = date.getMinutes()
    const roundedMinutes = Math.floor(minutes / 30) * 30
    const rounded = new Date(date)
    rounded.setMinutes(roundedMinutes, 0, 0)
    return rounded
  }

  const [startTime, setStartTime] = useState(() => {
    return defaultTime ? roundToHalfHour(defaultTime) : roundToHalfHour(new Date())
  })

  // Convert time to slider position (0-1440 minutes in a day)
  const timeToPosition = (time: Date) => {
    const hours = time.getHours()
    const minutes = time.getMinutes()
    return (hours * 60 + minutes) / 1440 * 100 // Convert to percentage
  }

  // Convert slider position to time
  const positionToTime = (percentage: number, date: Date) => {
    const totalMinutes = Math.round((percentage / 100) * 1440)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    const newTime = startOfDay(date)
    newTime.setHours(hours, minutes, 0, 0)
    return newTime
  }

  // Snap to nearest 30-minute mark
  const snapToHalfHour = (time: Date) => {
    const minutes = time.getMinutes()
    const roundedMinutes = Math.round(minutes / 30) * 30
    const snapped = new Date(time)
    if (roundedMinutes === 60) {
      snapped.setHours(snapped.getHours() + 1, 0, 0, 0)
    } else {
      snapped.setMinutes(roundedMinutes, 0, 0)
    }
    return snapped
  }

  // Calculate end time based on start time and duration
  const calculateEndTime = (start: Date, durationMinutes: number) => {
    return addMinutes(start, durationMinutes)
  }

  const [sliderPosition, setSliderPosition] = useState(() => timeToPosition(startTime))

  // Update times when slider changes
  useEffect(() => {
    const newStartTime = positionToTime(sliderPosition, selectedDate)
    const snappedStartTime = snapToHalfHour(newStartTime)
    const endTime = calculateEndTime(snappedStartTime, duration)
    
    setStartTime(snappedStartTime)
    onTimeChange(snappedStartTime, endTime)
  }, [sliderPosition, selectedDate, duration, onTimeChange])

  // Handle mouse/touch events for slider
  const handleSliderStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true)
    updateSliderPosition(e)
  }

  const updateSliderPosition = (e: React.MouseEvent | React.TouchEvent) => {
    if (!sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    
    setSliderPosition(percentage)
  }

  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return
    updateSliderPosition(e)
  }

  const handleSliderEnd = () => {
    setIsDragging(false)
  }

  // Mouse and touch event listeners
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => handleSliderMove(e as any)
    const handleMouseUp = () => handleSliderEnd()
    const handleTouchMove = (e: TouchEvent) => handleSliderMove(e as any)
    const handleTouchEnd = () => handleSliderEnd()

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging])

  // Handle date change
  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate)
    onDateChange(newDate)
  }

  // Format time for display
  const formatTime = (time: Date) => format(time, 'h:mm a')
  const formatDate = (date: Date) => format(date, 'MMM d, yyyy')

  const endTime = calculateEndTime(startTime, duration)
  const isToday = isSameDay(selectedDate, new Date())

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <div className="space-y-3">
        <label className="block text-lg font-medium text-[#222222]">
          When did this happen?
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => handleDateChange(new Date(e.target.value + 'T00:00:00'))}
            className="px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-smooth bg-[#FAFAFA] focus:bg-white text-lg"
          />
          {isToday && (
            <span className="px-3 py-1 bg-[#00A699]/10 text-[#00A699] text-sm font-medium rounded-full">
              Today
            </span>
          )}
        </div>
      </div>

      {/* Time Selection */}
      <div className="space-y-4">
        <label className="block text-lg font-medium text-[#222222]">
          What time did you start?
        </label>
        
        {/* Time Display */}
        <div className="bg-gradient-to-r from-[#FF385C]/5 to-[#E31C5F]/5 rounded-2xl p-6 border border-[#FF385C]/10">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <div className="text-sm text-[#767676] font-medium">Start Time</div>
              <div className="text-2xl font-bold text-[#FF385C]">
                {formatTime(startTime)}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-0.5 bg-[#FF385C]/30"></div>
              <span className="text-[#767676] text-sm">
                {duration}m
              </span>
              <div className="w-8 h-0.5 bg-[#FF385C]/30"></div>
            </div>
            <div className="text-center">
              <div className="text-sm text-[#767676] font-medium">End Time</div>
              <div className="text-2xl font-bold text-[#00A699]">
                {formatTime(endTime)}
              </div>
            </div>
          </div>

          {/* Time Slider */}
          <div className="space-y-3">
            <div
              ref={sliderRef}
              className="relative h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full cursor-pointer select-none"
              onMouseDown={handleSliderStart}
              onTouchStart={handleSliderStart}
            >
              {/* Half-hour markers */}
              {Array.from({ length: 49 }, (_, i) => i * 30).map((minutes) => {
                const position = (minutes / 1440) * 100
                const isHour = minutes % 60 === 0
                return (
                  <div
                    key={minutes}
                    className={`absolute top-1/2 transform -translate-y-1/2 ${
                      isHour 
                        ? 'w-1 h-6 bg-gray-400' 
                        : 'w-0.5 h-3 bg-gray-300'
                    } rounded-full`}
                    style={{ left: `${position}%` }}
                  />
                )
              })}

              {/* Slider track with gradient */}
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#FF385C] to-[#E31C5F] rounded-full transition-all duration-200"
                style={{ width: `${sliderPosition}%` }}
              />

              {/* Slider thumb */}
              <div
                className={`absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white border-4 border-[#FF385C] rounded-full shadow-lg cursor-grab transition-all duration-200 ${
                  isDragging ? 'scale-110 cursor-grabbing shadow-xl' : 'hover:scale-105'
                }`}
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute inset-1 bg-[#FF385C] rounded-full opacity-50" />
              </div>
            </div>

            {/* Time labels */}
            <div className="flex justify-between text-xs text-[#767676] px-1">
              <span>12:00 AM</span>
              <span>6:00 AM</span>
              <span>12:00 PM</span>
              <span>6:00 PM</span>
              <span>11:59 PM</span>
            </div>
          </div>
        </div>

        {/* Quick time presets */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Now', offset: 0 },
            { label: '30m ago', offset: -30 },
            { label: '1h ago', offset: -60 },
            { label: '2h ago', offset: -120 },
            { label: 'Morning (9 AM)', time: '09:00' },
            { label: 'Afternoon (2 PM)', time: '14:00' },
          ].map((preset) => {
            const handlePresetClick = () => {
              let newTime: Date
              if ('offset' in preset && preset.offset !== undefined) {
                newTime = addMinutes(new Date(), preset.offset)
              } else if ('time' in preset && preset.time) {
                newTime = parse(preset.time, 'HH:mm', selectedDate)
              } else {
                newTime = new Date()
              }
              const snappedTime = snapToHalfHour(newTime)
              const newPosition = timeToPosition(snappedTime)
              setSliderPosition(newPosition)
            }

            return (
              <button
                key={preset.label}
                type="button"
                onClick={handlePresetClick}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-[#FF385C]/10 hover:text-[#FF385C] text-gray-600 rounded-full transition-colors"
              >
                {preset.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
