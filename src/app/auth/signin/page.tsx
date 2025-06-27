"use client"

import { useState, useEffect } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()

  // Redirect if already signed in
  useEffect(() => {
    if (status === "loading") return
    
    if (status === "authenticated" && session) {
      router.push("/dashboard")
    }
  }, [session, status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid credentials")
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-[#F7F7F7] to-[#EBEBEB] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Welcome Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#FF385C] to-[#E31C5F] px-8 py-10 text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-white/20 flex items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center">
                  <span className="text-2xl">⏰</span>
                </div>
              </div>
              <div className="absolute -top-2 -right-6 w-6 h-6 bg-[#00A699] rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back!
            </h1>
            <p className="text-white/80">
              Ready to continue your time tracking journey? ✨
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Google Sign In Button - Moved to top */}
              <button
                type="button"
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                className="w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-smooth shadow-lg bg-white border-2 border-gray-200 text-gray-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-50"
              >
                <div className="flex items-center justify-center space-x-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </div>
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or continue with email</span>
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-[#222222]">
                  Your email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-smooth placeholder-gray-400 bg-[#FAFAFA] focus:bg-white text-lg"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <div className={`w-2 h-2 rounded-full transition-smooth ${
                      email.includes('@') ? 'bg-[#00A699]' : 'bg-gray-300'
                    }`}></div>
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-[#222222]">
                  Your password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-smooth placeholder-gray-400 bg-[#FAFAFA] focus:bg-white text-lg"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <div className={`w-2 h-2 rounded-full transition-smooth ${
                      password.length >= 6 ? 'bg-[#00A699]' : 'bg-gray-300'
                    }`}></div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 animate-scale-in">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-500">⚠️</span>
                    <span className="text-red-700 text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                className={`w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-smooth shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  loading
                    ? 'bg-gray-400 text-white'
                    : 'bg-gradient-to-r from-[#FF385C] to-[#E31C5F] text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing you in...</span>
                  </div>
                ) : (
                  <span>✨ Sign in to TimeTrack</span>
                )}
              </button>

              {/* Progress Indicator */}
              <div className="flex justify-center space-x-2 pt-2">
                <div className={`w-2 h-2 rounded-full transition-smooth ${
                  email ? 'bg-[#FF385C]' : 'bg-gray-300'
                }`}></div>
                <div className={`w-2 h-2 rounded-full transition-smooth ${
                  password ? 'bg-[#FF385C]' : 'bg-gray-300'
                }`}></div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 pb-8 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-[#767676] text-sm mb-3">
                New to TimeTrack?
              </p>
              <Link 
                href="/auth/signup" 
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-[#F7F7F7] hover:bg-[#EBEBEB] transition-smooth font-medium text-[#222222]"
              >
                <span>🎉</span>
                <span>Create your account</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-4 bg-white/80 rounded-full px-6 py-3 shadow-lg backdrop-blur-sm">
            <div className="flex items-center space-x-1">
              <span className="text-sm">🔒</span>
              <span className="text-xs text-[#767676] font-medium">Secure</span>
            </div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="flex items-center space-x-1">
              <span className="text-sm">🛡️</span>
              <span className="text-xs text-[#767676] font-medium">Private</span>
            </div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="flex items-center space-x-1">
              <span className="text-sm">✨</span>
              <span className="text-xs text-[#767676] font-medium">Delightful</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
