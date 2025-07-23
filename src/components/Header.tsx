"use client"

import { signOut } from "next-auth/react"
import { Clock, LogOut, User, Calendar, BarChart3, Heart, HelpCircle, Target } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

interface User {
  name?: string | null
  email?: string | null
}

interface HeaderProps {
  user: User
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, description: 'Your time overview' },
    { name: 'Calendar', href: '/calendar', icon: Calendar, description: 'Smart schedule view' },
    { name: 'Goals', href: '/goals', icon: Target, description: 'Your goals' },
  ]

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  const firstName = user.name?.split(' ')[0] || user.email?.split('@')[0] || 'there'

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Brand & Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo with heart */}
            <Link href="/dashboard" className="flex items-center group transition-smooth hover:scale-105">
              <div className="relative">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-[#FF385C] to-[#E31C5F] flex items-center justify-center shadow-lg transition-smooth group-hover:shadow-xl">
                  <Clock className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <Heart className="absolute -top-1 -right-1 h-3 w-3 md:h-4 md:w-4 text-[#FF385C] fill-current animate-pulse-warm" />
              </div>
              <div className="ml-2 md:ml-3 flex flex-col items-start">
                <span className="text-lg md:text-2xl font-semibold text-[#222222] tracking-tight">Roozi</span>
                <span className="text-[10px] text-gray-400 font-normal mt-0.5">previously <span className="text-[#FF385C]">Time Track</span></span>
              </div>
            </Link>
            
            {/* Navigation - Desktop Only */}
            <nav className="hidden md:flex space-x-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      group relative inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-smooth
                      ${
                        isActive
                          ? 'bg-[#FF385C]/8 text-[#FF385C] shadow-sm'
                          : 'text-[#767676] hover:text-[#222222] hover:bg-[#F7F7F7]'
                      }
                    `}
                  >
                    <Icon className={`h-4 w-4 mr-2.5 transition-smooth ${
                      isActive ? 'text-[#FF385C]' : 'text-[#767676] group-hover:text-[#222222]'
                    }`} />
                    <span>{item.name}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#FF385C] rounded-full animate-scale-in" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
          
          {/* User Profile */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Greeting - Desktop Only */}
            <div className="hidden lg:block text-right">
              <p className="text-sm font-medium text-[#222222]">{getGreeting()}, {firstName}!</p>
              <p className="text-xs text-[#767676]">Ready to track your day?</p>
            </div>
            
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 md:space-x-3 p-1.5 md:p-2 rounded-2xl transition-smooth hover:bg-[#F7F7F7] focus:outline-none focus:ring-2 focus:ring-[#FF385C]/20"
              >
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#00A699] to-[#009B8E] flex items-center justify-center shadow-md transition-smooth hover:shadow-lg">
                  <span className="text-white font-semibold text-sm">
                    {firstName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-[#222222] leading-tight">{firstName}</p>
                  <p className="text-xs text-[#767676] leading-tight">{user.email}</p>
                </div>
              </button>
              
              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-scale-in z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-[#222222]">{user.name || firstName}</p>
                    <p className="text-xs text-[#767676]">{user.email}</p>
                  </div>
                  
                  <div className="py-2">
                    <Link
                      href="/analytics"
                      onClick={() => setIsProfileOpen(false)}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-[#767676] hover:text-[#222222] hover:bg-[#F7F7F7] transition-smooth"
                    >
                      <BarChart3 className="h-4 w-4 mr-3" />
                      Analytics
                    </Link>
                    <Link
                      href="/pomodoro"
                      onClick={() => setIsProfileOpen(false)}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-[#767676] hover:text-[#222222] hover:bg-[#F7F7F7] transition-smooth"
                    >
                      <span className="text-lg mr-3">⏳</span>
                      Focus
                    </Link>
                    <Link
                      href="/reflection"
                      onClick={() => setIsProfileOpen(false)}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-[#767676] hover:text-[#222222] hover:bg-[#F7F7F7] transition-smooth"
                    >
                      <Heart className="h-4 w-4 mr-3" />
                      Daily Reflection
                    </Link>
                    <Link
                      href="/feedback"
                      onClick={() => setIsProfileOpen(false)}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-[#767676] hover:text-[#222222] hover:bg-[#F7F7F7] transition-smooth"
                    >
                      <HelpCircle className="h-4 w-4 mr-3" />
                      Feedback
                    </Link>
                    <button
                      onClick={() => {
                        const subject = encodeURIComponent('TimeTrack Support Request')
                        const body = encodeURIComponent(`Hi Asif,

I need help with TimeTrack. 

My account: ${user.email}

Issue description:
[Please describe your issue here]

Thanks!`)
                        window.location.href = `mailto:asifkabeer1@gmail.com?subject=${subject}&body=${body}`
                        setIsProfileOpen(false)
                      }}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-[#767676] hover:text-[#222222] hover:bg-[#F7F7F7] transition-smooth"
                    >
                      <HelpCircle className="h-4 w-4 mr-3" />
                      Support
                    </button>
                    <button
                      onClick={() => {
                        signOut({ callbackUrl: "/auth/signin" })
                        setIsProfileOpen(false)
                      }}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-[#767676] hover:text-[#222222] hover:bg-[#F7F7F7] transition-smooth"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
