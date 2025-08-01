"use client"

import { useState, useRef, useEffect } from 'react'

interface ScrollPickerProps {
  items: Array<{ value: string; label: string; icon?: string; emoji?: string }>
  selectedValue: string
  onSelect: (value: string) => void
  height?: number
  itemHeight?: number
}

export default function ScrollPicker({ 
  items, 
  selectedValue, 
  onSelect, 
  height = 120, 
  itemHeight = 40 
}: ScrollPickerProps) {
  const [scrollY, setScrollY] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrolling = useRef(false)

  const selectedIndex = items.findIndex(item => item.value === selectedValue)
  const centerOffset = height / 2 - itemHeight / 2

  useEffect(() => {
    if (selectedIndex >= 0) {
      setScrollY(selectedIndex * itemHeight)
    }
  }, [selectedIndex, itemHeight])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isScrolling.current) {
      isScrolling.current = true
      setTimeout(() => {
        isScrolling.current = false
      }, 150)
    }

    const scrollTop = e.currentTarget.scrollTop
    setScrollY(scrollTop)
    
    const index = Math.round(scrollTop / itemHeight)
    if (index >= 0 && index < items.length) {
      onSelect(items[index].value)
    }
  }

  const scrollToIndex = (index: number) => {
    const targetScrollY = index * itemHeight
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: targetScrollY,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="relative" style={{ height }}>
      {/* Gradient overlays */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
      
      {/* Center highlight */}
      <div 
        className="absolute left-0 right-0 border-2 border-[#FF385C] rounded-lg pointer-events-none z-5"
        style={{ 
          top: centerOffset, 
          height: itemHeight 
        }}
      />
      
      {/* Scrollable container */}
      <div
        ref={containerRef}
        className="overflow-y-auto scrollbar-hide"
        style={{ height }}
        onScroll={handleScroll}
      >
        <div style={{ height: centerOffset }} />
        {items.map((item, index) => (
          <div
            key={item.value}
            className="flex items-center justify-center cursor-pointer transition-all duration-200"
            style={{ height: itemHeight }}
            onClick={() => scrollToIndex(index)}
          >
            <div className="flex items-center space-x-2">
              {item.icon && <span className="text-lg">{item.icon}</span>}
              {item.emoji && <span className="text-lg">{item.emoji}</span>}
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          </div>
        ))}
        <div style={{ height: centerOffset }} />
      </div>
    </div>
  )
} 