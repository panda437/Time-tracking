"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, BarChart3 } from "lucide-react"

export default function MobileNavigation() {
  const pathname = usePathname()
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Focus', href: '/pomodoro', icon: '⏳' },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white/95 backdrop-blur-sm z-50 pb-safe">
      <nav className="flex justify-around py-4 px-2 safe-area-inset-bottom">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = typeof item.icon === 'string' ? null : item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex flex-col items-center py-2 px-4 rounded-xl transition-smooth
                ${
                  isActive
                    ? 'text-[#FF385C] bg-[#FF385C]/8'
                    : 'text-[#767676] hover:text-[#222222]'
                }
              `}
            >
              {Icon ? (
                <Icon className="h-6 w-6 mb-1" />
              ) : (
                <span className="text-xl mb-1">{item.icon}</span>
              )}
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
