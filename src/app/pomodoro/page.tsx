"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { Play, Pause, RotateCcw, Coffee } from "lucide-react"
import Header from "@/components/Header"
import { trackPomodoro } from "@/components/GoogleAnalytics"

type PomodoroState = 'idle' | 'running' | 'paused' | 'break'

export default function PomodoroPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [state, setState] = useState<PomodoroState>('idle')
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes in seconds
  const [isBreak, setIsBreak] = useState(false)
  const [taskInput, setTaskInput] = useState("")
  const [completedSessions, setCompletedSessions] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const WORK_TIME = 25 * 60 // 25 minutes
  const BREAK_TIME = 5 * 60 // 5 minutes
  const LONG_BREAK_TIME = 15 * 60 // 15 minutes

  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/auth/signin")
      return
    }
  }, [session, status, router])

  useEffect(() => {
    // Create audio element for notifications
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/notification-sound.wav') // You can add a sound file
    }
  }, [])

  useEffect(() => {
    if (state === 'running' && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [state, timeLeft])

  const handleTimerComplete = () => {
    setState('idle')
    
    if (!isBreak) {
      // Work session completed
      setCompletedSessions(prev => prev + 1)
      trackPomodoro('complete', WORK_TIME)
      
      // Start break
      const isLongBreak = (completedSessions + 1) % 4 === 0
      setTimeLeft(isLongBreak ? LONG_BREAK_TIME : BREAK_TIME)
      setIsBreak(true)
      setState('break')
    } else {
      // Break completed
      setTimeLeft(WORK_TIME)
      setIsBreak(false)
      setState('idle')
    }

    // Play notification sound
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        // Audio play failed, ignore
      })
    }
  }

  const startTimer = () => {
    setState('running')
    trackPomodoro('start', isBreak ? (timeLeft === LONG_BREAK_TIME ? LONG_BREAK_TIME : BREAK_TIME) : WORK_TIME)
  }

  const pauseTimer = () => {
    setState('paused')
    trackPomodoro('pause', timeLeft)
  }

  const resetTimer = () => {
    setState('idle')
    setTimeLeft(isBreak ? BREAK_TIME : WORK_TIME)
    setIsBreak(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgress = () => {
    const totalTime = isBreak ? (timeLeft === LONG_BREAK_TIME ? LONG_BREAK_TIME : BREAK_TIME) : WORK_TIME
    return ((totalTime - timeLeft) / totalTime) * 100
  }

  const circumference = 2 * Math.PI * 120 // radius = 120
  const strokeDashoffset = circumference - (getProgress() / 100) * circumference

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-[#F7F7F7] to-[#EBEBEB]">
      <Header user={session.user} />
      
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pb-32 md:pb-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Focus Session
          </h1>
          <p className="text-xl text-gray-600">
            {isBreak 
              ? state === 'break' 
                ? "Take a moment to breathe 🌸" 
                : "Ready for your break?"
              : state === 'running' 
                ? "Deep work in progress ⚡" 
                : "Ready to dive deep into focus?"
            }
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-w-2xl mx-auto">
          {/* Timer Circle */}
          <div className="px-8 py-12 text-center">
            <div className="relative inline-block">
              {/* Background circle */}
              <svg
                className="transform -rotate-90 w-64 h-64"
                viewBox="0 0 256 256"
              >
                {/* Background circle */}
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="#f3f4f6"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke={isBreak ? "#00A699" : "#FF385C"}
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-in-out"
                  style={{
                    filter: state === 'running' ? 'drop-shadow(0 0 8px rgba(255, 56, 92, 0.4))' : 'none'
                  }}
                />
              </svg>
              
              {/* Center content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-900 mb-2">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-sm text-gray-500 uppercase tracking-wider">
                    {isBreak ? "Break Time" : "Focus Time"}
                  </div>
                </div>
              </div>

              {/* Play button overlay when idle */}
              {state === 'idle' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={startTimer}
                    className="w-20 h-20 bg-gradient-to-r from-[#FF385C] to-[#E31C5F] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 hover:shadow-3xl group"
                    style={{
                      boxShadow: '0 20px 40px rgba(255, 56, 92, 0.3)'
                    }}
                  >
                    <Play className="h-8 w-8 text-white ml-1 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Task Input */}
          {!isBreak && (
            <div className="px-8 pb-8">
              <label className="block text-lg font-medium text-gray-900 mb-3 text-center">
                What will you focus on?
              </label>
              <input
                type="text"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="e.g., Write blog post outline, Review project specs..."
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all placeholder-gray-400 bg-[#FAFAFA] focus:bg-white text-center"
                disabled={state === 'running'}
              />
            </div>
          )}

          {/* Controls */}
          <div className="px-8 pb-8">
            <div className="flex justify-center space-x-4">
              {state === 'running' && (
                <button
                  onClick={pauseTimer}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors font-medium"
                >
                  <Pause className="h-5 w-5" />
                  <span>Pause</span>
                </button>
              )}
              
              {state === 'paused' && (
                <button
                  onClick={startTimer}
                  className="flex items-center space-x-2 px-6 py-3 bg-[#FF385C] hover:bg-[#E31C5F] text-white rounded-2xl transition-colors font-medium"
                >
                  <Play className="h-5 w-5" />
                  <span>Resume</span>
                </button>
              )}

              {(state === 'paused' || state === 'running') && (
                <button
                  onClick={resetTimer}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors font-medium"
                >
                  <RotateCcw className="h-5 w-5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6">
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#FF385C]">{completedSessions}</div>
                <div className="text-sm text-gray-600">Sessions</div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#00A699]">
                  {Math.floor(completedSessions / 4)}
                </div>
                <div className="text-sm text-gray-600">Cycles</div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <Coffee className="h-6 w-6 text-[#FC642D]" />
                  <span className="text-2xl font-bold text-[#FC642D]">
                    {Math.floor(completedSessions / 4)}
                  </span>
                </div>
                <div className="text-sm text-gray-600">Breaks</div>
              </div>
            </div>
          </div>
        </div>

        {/* Motivational message */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center space-x-2 bg-white rounded-full px-6 py-3 shadow-lg border border-gray-100">
            <span className="text-2xl">
              {state === 'running' ? '🔥' : state === 'break' ? '🌸' : '💫'}
            </span>
            <span className="text-gray-600 font-medium">
              {state === 'running' 
                ? "You're in the zone! Keep going!" 
                : state === 'break' 
                  ? "Recharge your mind and body"
                  : "Every focused moment builds momentum"
              }
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
