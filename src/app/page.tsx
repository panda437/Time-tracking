"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Clock, Edit3, BarChart3, Zap, ArrowRight } from "lucide-react"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && status === "authenticated") {
      router.push("/dashboard")
    }
  }, [mounted, status, router])

  // Show loading only if not mounted yet or if session is actually loading
  if (!mounted || (status === "loading" && mounted)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-[#F7F7F7] to-[#EBEBEB] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FF385C]/20 border-t-[#FF385C] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-[#F7F7F7] to-[#EBEBEB]">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF385C]/10 via-[#00A699]/10 to-[#FC642D]/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
          {/* Navigation */}
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF385C] to-[#E31C5F] rounded-2xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-[#222222]">TimeTrack</span>
            </div>
            <Link 
              href="/auth/signin"
              className="px-6 py-3 bg-gradient-to-r from-[#FF385C] to-[#E31C5F] text-white rounded-xl hover:shadow-lg transition-all hover:scale-105"
            >
              Get Started
            </Link>
          </nav>

          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-[#222222] mb-6 leading-tight">
              Your day is a story.
              <span className="bg-gradient-to-r from-[#FF385C] to-[#E31C5F] bg-clip-text text-transparent block">
                Start tracking it
              </span>
            </h1>
            <p className="text-lg md:text-xl text-[#767676] mb-8 leading-relaxed">
              Log what you do, spot patterns, and take action toward a better you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/signin"
                className="px-8 py-4 bg-gradient-to-r from-[#FF385C] to-[#E31C5F] text-white text-lg font-semibold rounded-2xl hover:shadow-xl transition-all hover:scale-105"
              >
                Start Tracking Free
              </Link>
              
            </div>
          </div>
        </div>
      </header>

      {/* How It Works Strip */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
            {/* Step 1 */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF385C] to-[#E31C5F] flex items-center justify-center text-white shadow-lg">
                <Edit3 className="w-6 h-6" />
              </div>
              <p className="text-xl font-semibold text-[#222222]">Log</p>
            </div>

            {/* Arrow */}
            <ArrowRight className="hidden sm:block w-5 h-5 text-gray-400" />

            {/* Step 2 */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                <BarChart3 className="w-6 h-6" />
              </div>
              <p className="text-xl font-semibold text-[#222222]">See patterns</p>
            </div>

            {/* Arrow */}
            <ArrowRight className="hidden sm:block w-5 h-5 text-gray-400" />

            {/* Step 3 */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white shadow-lg">
                <Zap className="w-6 h-6" />
              </div>
              <p className="text-xl font-semibold text-[#222222]">Act</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#222222]">Loved by people like you</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                quote: "I’ve been tracking my personal time for about three years now, and it’s been a game-changer! The insights helped me realize how much time I was spending on low-value activities and motivated me to allocate more time to learning and self-care.",
                name: "Leo_scarlata",
                avatar: "/sample1.svg",
              },
              {
                quote: "The true benefit comes from the act of tracking itself—reviewing how you’ve spent your time will naturally influence you to make better choices going forward. I’ve been using Toggl for three years and can’t recommend it enough.",
                name: "Ambitious_224mogul",
                avatar: "/avatar%20(2).svg",
              },
              {
                quote: "Only after I started measuring what I was doing with my time did my eyes open, because I found myself doing a lot of things I had no idea about—like hours mindlessly browsing or checking my email more than 100 times a day. The actual value outside of work context is learning about yourself, and more importantly, improving yourself.",
                name: "typologist",
                avatar: "/avatar%20(3).svg",
              },
              {
                quote: "One thing that’s cool about time tracking is that you can look back on a random day and see the ‘movie’ of your life. When I realized how much time I spent playing Xbox, I ended up stopping for a few weeks because it was just so many hours.",
                name: "leonmessi",
                avatar: "/avatar%20(4).svg",
              },
            ].map((t, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col h-full">
                <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full mb-4 mx-auto object-cover" />
                <p className="text-sm text-[#222222] flex-1">“{t.quote}”</p>
                <p className="mt-4 font-semibold text-[#FF385C] text-sm flex items-center justify-center">
                  — {t.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personal Story Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 p-8 md:p-12 border border-gray-100">
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#FF385C]/10 to-[#E31C5F]/10 rounded-full">
                <span className="text-[#FF385C] font-semibold text-sm">MY STORY</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-[#222222] leading-tight">
                Hi, I'm Asif
              </h2>
              
              <div className="space-y-4 text-lg text-[#767676] leading-relaxed max-w-2xl">
                <p>
                  During my college years, I found myself constantly overwhelmed and scattered. 
                  I'd start my day with good intentions, but by evening, I couldn't account for 
                  where my time had gone.
                </p>
                
                <p>
                  That's when I discovered the power of time tracking. What started as a simple 
                  habit <b>transformed</b> how I approached my days. I began to see patterns, understand 
                  my energy levels, and most importantly – stay grounded in the present moment.
                </p>
                <p>
                  Hopefully, you feel that when you use it and it helps you as much as it helped me.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-gray-100">
                <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                  <div className="relative">
                    <img 
                      src="/Asif.jpg" 
                      alt="Asif Kabeer"
                      className="w-12 h-12 rounded-full object-cover object-bottom shadow-lg ring-2 ring-white"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-[#FF385C] to-[#E31C5F] rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-[#222222]">Asif Kabeer</p>
                    <p className="text-sm text-[#767676]">Founder, TimeTrack</p>
                  </div>
                </div>
                
                <Link 
                  href="/auth/signin"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#FF385C] to-[#E31C5F] text-white font-semibold rounded-xl hover:shadow-lg transition-all hover:scale-105"
                >
                  Start Your Journey →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#222222] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-[#FF385C] to-[#E31C5F] rounded-xl flex items-center justify-center">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold">TimeTrack</span>
          </div>
          <p className="text-gray-400">
            Transform how you understand your time. Track your life's story, one moment at a time.
          </p>
        </div>
      </footer>
    </div>
  )
}
