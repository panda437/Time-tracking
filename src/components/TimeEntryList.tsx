"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Edit2, Trash2, Clock } from "lucide-react"

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

interface TimeEntryListProps {
  entries: TimeEntry[]
  onEntryUpdated: (entry: TimeEntry) => void
  onEntryDeleted: (id: string) => void
}

export default function TimeEntryList({ entries, onEntryUpdated, onEntryDeleted }: TimeEntryListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<TimeEntry>>({})

  const handleEdit = (entry: TimeEntry) => {
    setEditingId(entry.id)
    setEditForm({
      activity: entry.activity,
      description: entry.description,
      duration: entry.duration,
      startTime: entry.startTime,
      category: entry.category,
      mood: entry.mood,
    })
  }

  const handleSave = async () => {
    if (!editingId) return

    try {
      const response = await fetch(`/api/entries/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      })

      if (response.ok) {
        const updatedEntry = await response.json()
        onEntryUpdated(updatedEntry)
        setEditingId(null)
        setEditForm({})
      }
    } catch (error) {
      console.error("Error updating entry:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return

    try {
      const response = await fetch(`/api/entries/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onEntryDeleted(id)
      }
    } catch (error) {
      console.error("Error deleting entry:", error)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      work: "bg-blue-100 text-blue-800",
      personal: "bg-green-100 text-green-800",
      health: "bg-red-100 text-red-800",
      education: "bg-purple-100 text-purple-800",
      social: "bg-yellow-100 text-yellow-800",
      entertainment: "bg-pink-100 text-pink-800",
      other: "bg-gray-100 text-gray-800",
    }
    return colors[category] || colors.other
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No time entries yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Start tracking your time by adding your first entry above.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <div key={entry.id || `entry-${index}`} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
          {editingId === entry.id ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editForm.activity || ""}
                onChange={(e) => setEditForm({ ...editForm, activity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <textarea
                value={editForm.description || ""}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
              />
              <div className="flex space-x-4">
                <input
                  type="datetime-local"
                  value={editForm.startTime ? new Date(editForm.startTime).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={editForm.duration || ""}
                  onChange={(e) => setEditForm({ ...editForm, duration: Number(e.target.value) })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                </select>
              </div>
              <div className="flex space-x-4">
                <select
                  value={editForm.category || ""}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="health">Health</option>
                  <option value="education">Education</option>
                  <option value="social">Social</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="other">Other</option>
                </select>
                <select
                  value={editForm.mood || ""}
                  onChange={(e) => setEditForm({ ...editForm, mood: e.target.value || undefined })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No mood</option>
                  <option value="😊">😊 Happy</option>
                  <option value="😌">😌 Calm</option>
                  <option value="🤔">🤔 Thoughtful</option>
                  <option value="😴">😴 Tired</option>
                  <option value="😤">😤 Frustrated</option>
                  <option value="🎯">🎯 Focused</option>
                  <option value="⚡">⚡ Energetic</option>
                  <option value="😐">😐 Neutral</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-medium text-gray-900">{entry.activity}</h3>
                  {entry.mood && <span className="text-lg">{entry.mood}</span>}
                </div>
                {entry.description && (
                  <p className="text-sm text-gray-600 mb-2">{entry.description}</p>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDuration(entry.duration)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(entry.category)}`}>
                    {entry.category}
                  </span>
                  <span>
                    {format(new Date(entry.startTime), "MMM d, h:mm a")}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleEdit(entry)}
                  className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
