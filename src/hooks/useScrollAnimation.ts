import { useEffect, useRef, useState } from 'react'

export function useScrollAnimation() {
  const elementRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const lastScrollYRef = useRef(0)
  const isScrollingRef = useRef(false)

  useEffect(() => {
    const handleScroll = () => {
      if (isScrollingRef.current) return
      
      isScrollingRef.current = true
      
      const currentScrollY = window.scrollY
      const scrollDifference = currentScrollY - lastScrollYRef.current
      
      console.log('Scroll position:', currentScrollY, 'Difference:', scrollDifference)
      
      if (Math.abs(scrollDifference) > 10) { // Only trigger if scroll is significant
        if (scrollDifference > 0) {
          console.log('Scrolling DOWN - setting to productive')
          setIsVisible(true)
        } else {
          console.log('Scrolling UP - setting to poor')
          setIsVisible(false)
        }
      }
      
      lastScrollYRef.current = currentScrollY
      
      // Debounce scroll events
      setTimeout(() => {
        isScrollingRef.current = false
      }, 100)
    }

    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return { elementRef, isVisible }
} 