"use client"

import { useEffect } from "react"
// @ts-expect-error – clarity has no types
import clarity from "@microsoft/clarity"

export default function MicrosoftClarity() {
  useEffect(() => {
    // Avoid running during build or without browser
    if (typeof window !== "undefined") {
      try {
        clarity("init", "scas5wbamy")
      } catch (e) {
        console.error("Clarity init error", e)
      }
    }
  }, [])

  return null
} 