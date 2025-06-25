"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import TimeEntryForm from "@/components/TimeEntryForm"
import TimeEntryList from "@/components/TimeEntryList"
import WeeklyOverview from "@/components/WeeklyOverview"
import Header from "@/components/Header"

interface TimeEntry {
  id: string
  activity: string
  description?: string
  duration: number
  startTime: string
  endTime: string
  date: string
  category: string
  mood?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/auth/signin")
      return
    }

    fetchEntries()
  }, [session, status, router])

  const fetchEntries = async () => {
    try {
      const response = await fetch("/api/entries?period=week")
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      }
    } catch (error) {
      console.error("Failed to fetch entries:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEntryAdded = (newEntry: TimeEntry) => {
    setEntries([newEntry, ...entries])
  }

  const handleEntryUpdated = (updatedEntry: TimeEntry) => {
    setEntries(entries.map(entry => 
      entry.id === updatedEntry.id ? updatedEntry : entry
    ))
  }

  const handleEntryDeleted = (deletedId: string) => {
    setEntries(entries.filter(entry => entry.id !== deletedId))
  }

  if (status === "loading" || loading) {
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
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Quick Add Section */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                What did you do in the last half hour?
              </h2>
              <TimeEntryForm onEntryAdded={handleEntryAdded} />
            </div>
          </div>

          {/* Weekly Overview */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                This Week's Overview
              </h2>
              <WeeklyOverview entries={entries} />
            </div>
          </div>

          {/* Recent Entries */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Recent Activities
              </h2>
              <TimeEntryList 
                entries={entries}
                onEntryUpdated={handleEntryUpdated}
                onEntryDeleted={handleEntryDeleted}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
