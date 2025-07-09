"use client"

import { SessionProvider, useSession } from "next-auth/react"
import PWA from "@/components/PWA"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { format } from "date-fns"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <FirstTimeRedirect />
      <PWA />
      {children}
    </SessionProvider>
  )
}

function FirstTimeRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status !== "authenticated") return

    const checkFirstEntry = async () => {
      try {
        // 1. Ensure user has completed goals onboarding
        const goalsRes = await fetch("/api/goals", { cache: "no-store" })
        if (!goalsRes.ok) return
        const goals = await goalsRes.json()
        if (!Array.isArray(goals) || goals.length === 0) {
          // User hasn't submitted goals yet – skip redirect
          return
        }

        // 2. Check if they have any entries
        const res = await fetch("/api/entries?period=week", { cache: "no-store" })
        if (!res.ok) return
        const entries = await res.json()
        if (Array.isArray(entries) && entries.length === 0) {
          const today = format(new Date(), "yyyy-MM-dd")
          router.replace(`/calendar/day/${today}?firstEntry=true`)
        }
      } catch (error) {
        console.error("Failed to check first entry/goals:", error)
      }
    }

    checkFirstEntry()
  }, [status, router])

  return null
}
