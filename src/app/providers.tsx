"use client"

import { SessionProvider } from "next-auth/react"
import PWA from "@/components/PWA"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PWA />
      {children}
    </SessionProvider>
  )
}
