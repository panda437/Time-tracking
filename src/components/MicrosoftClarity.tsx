"use client"

import { useEffect } from "react"
import Clarity from "@microsoft/clarity"

export default function MicrosoftClarity() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      Clarity.init("scas5wbamy")
    }
  }, [])
  return null
} 