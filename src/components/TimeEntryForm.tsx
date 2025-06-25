"use client"

import { useState } from "react"
import { subMinutes } from "date-fns"

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

interface TimeEntryFormProps {
  onEntryAdded: (entry: TimeEntry) => void
}

const categories = [
  "work", "personal", "health", "education", "social", "entertainment", "other"
]

const moods = ["😊", "😐", "😔", "😴", "🤯", "🔥"]

export default function TimeEntryForm({ onEntryAdded }: TimeEntryFormProps) {
  const [activity, setActivity] = useState("")
  const [description, setDescription] = useState("")
  const [duration, setDuration] = useState(30)
  const [category, setCategory] = useState("work")
  const [mood, setMood] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const startTime = subMinutes(new Date(), duration).toISOString()
      
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activity,
          description,
          duration,
          startTime,
          category,
          mood: mood || null,
        }),
      })

      if (response.ok) {
        const newEntry = await response.json()
        onEntryAdded(newEntry)
        
        // Reset form
        setActivity("")
        setDescription("")
        setDuration(30)
        setCategory("work")
        setMood("")
      } else {
        console.error("Failed to create entry")
      }
    } catch (error) {
      console.error("Error creating entry:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="activity" className="block text-sm font-medium text-gray-700">
            What did you do? *
          </label>
          <input
            type="text"
            id="activity"
            required
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            placeholder="e.g., Worked on project presentation"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
            How long? (minutes) *
          </label>
          <select
            id="duration"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
            <option value={180}>3 hours</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Additional details (optional)
        </label>
        <textarea
          id="description"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Any additional context or notes..."
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            How was it?
          </label>
          <div className="mt-1 flex space-x-2">
            {moods.map((moodOption) => (
              <button
                key={moodOption}
                type="button"
                onClick={() => setMood(mood === moodOption ? "" : moodOption)}
                className={`text-2xl p-2 rounded-md border ${
                  mood === moodOption
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                {moodOption}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading || !activity}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Add Time Entry"}
        </button>
      </div>
    </form>
  )
}
