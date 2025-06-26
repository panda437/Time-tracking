"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Clock, Calendar, BarChart3, Timer, Smile, Zap } from "lucide-react"

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
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-[#222222] mb-6 leading-tight">
              Track Your Life's Story,
              <span className="bg-gradient-to-r from-[#FF385C] to-[#E31C5F] bg-clip-text text-transparent block">
                One Moment at a Time
              </span>
            </h1>
            <p className="text-xl text-[#767676] mb-8 leading-relaxed">
              Transform how you understand your time with beautiful, intuitive tracking.
              Discover patterns, celebrate achievements, and make every moment count.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/signin"
                className="px-8 py-4 bg-gradient-to-r from-[#FF385C] to-[#E31C5F] text-white text-lg font-semibold rounded-2xl hover:shadow-xl transition-all hover:scale-105"
              >
                Start Tracking Free
              </Link>
              <Link 
                href="#features"
                className="px-8 py-4 bg-white text-[#222222] text-lg font-semibold rounded-2xl border-2 border-gray-200 hover:border-[#FF385C] hover:shadow-lg transition-all"
              >
                See Features
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#222222] mb-4">
              Everything You Need to Track Your Time
            </h2>
            <p className="text-xl text-[#767676] max-w-2xl mx-auto">
              Simple, beautiful, and powerful tools to help you understand how you spend your most precious resource.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-[#FF385C]/5 to-[#E31C5F]/5 p-8 rounded-3xl border border-[#FF385C]/10">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FF385C] to-[#E31C5F] rounded-2xl flex items-center justify-center mb-6">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#222222] mb-3">Beautiful Time Tracking</h3>
              <p className="text-[#767676]">Intuitive interface that makes tracking your activities feel natural and enjoyable, not like a chore.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-[#00A699]/5 to-[#009B8E]/5 p-8 rounded-3xl border border-[#00A699]/10">
              <div className="w-12 h-12 bg-gradient-to-br from-[#00A699] to-[#009B8E] rounded-2xl flex items-center justify-center mb-6">
                <Smile className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#222222] mb-3">Mood Insights</h3>
              <p className="text-[#767676]">Track how you feel during different activities and discover what truly brings you joy and energy.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-[#FC642D]/5 to-[#E8590C]/5 p-8 rounded-3xl border border-[#FC642D]/10">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FC642D] to-[#E8590C] rounded-2xl flex items-center justify-center mb-6">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#222222] mb-3">Calendar Views</h3>
              <p className="text-[#767676]">Visualize your time with beautiful calendar layouts and timeline views that tell your story.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-purple-500/5 to-purple-600/5 p-8 rounded-3xl border border-purple-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <Timer className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#222222] mb-3">Pomodoro Timer</h3>
              <p className="text-[#767676]">Built-in focus timer to help you stay productive and automatically track your focused work sessions.</p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-blue-500/5 to-blue-600/5 p-8 rounded-3xl border border-blue-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#222222] mb-3">Smart Analytics</h3>
              <p className="text-[#767676]">Discover patterns in your time usage with intelligent insights and beautiful visualizations.</p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-green-500/5 to-green-600/5 p-8 rounded-3xl border border-green-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#222222] mb-3">Gap Detection</h3>
              <p className="text-[#767676]">Smart detection of time gaps in your day with easy tools to fill in what you were doing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-[#FF385C] to-[#E31C5F]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Time?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of people who've discovered the power of beautiful time tracking.
            Start your journey today – it's completely free.
          </p>
          <Link 
            href="/auth/signin"
            className="inline-flex items-center px-8 py-4 bg-white text-[#FF385C] text-lg font-semibold rounded-2xl hover:shadow-xl transition-all hover:scale-105"
          >
            Start Your Story Today →
          </Link>
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
