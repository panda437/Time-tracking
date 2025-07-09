"use client"

import { useEffect } from "react"
// @ts-expect-error clarity has no types
import clarity from "@microsoft/clarity"

export default function MicrosoftClarity() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      clarity("init", "scas5wbamy")
    }
  }, [])
  return null
} 