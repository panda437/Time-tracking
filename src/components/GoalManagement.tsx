"use client"

import { useState } from "react"
import { Plus, X, Edit3, Trash2, Save, Target } from "lucide-react"

interface Goal {
  _id: string
  goal: string
  isActive: boolean
}

interface GoalManagementProps {
  goals: Goal[]
  onGoalsUpdate: () => void
}

const PRESET_GOALS = [
  "Study",
  "Workout", 
  "Improve Focus",
  "Work on Projects",
  "Read More",
  "Learn New Skills",
  "Meditate",
  "Exercise Regularly",
  "Build Healthy Habits",
  "Network and Connect",
  "Practice Gratitude",
  "Organize Life"
]

export default function GoalManagement({ goals, onGoalsUpdate }: GoalManagementProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedGoals, setEditedGoals] = useState<string[]>(goals.map(g => g.goal))
  const [newGoal, setNewGoal] = useState("")
  const [saving, setSaving] = useState(false)

  const handleAddGoal = (goalText: string) => {
    if (goalText.trim() && !editedGoals.includes(goalText.trim())) {
      setEditedGoals([...editedGoals, goalText.trim()])
      setNewGoal("")
    }
  }

  const handleRemoveGoal = (index: number) => {
    setEditedGoals(editedGoals.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ goals: editedGoals }),
      })
      
      if (response.ok) {
        setIsEditing(false)
        onGoalsUpdate()
      }
    } catch (error) {
      console.error("Failed to save goals:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedGoals(goals.map(g => g.goal))
    setNewGoal("")
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <Target className="h-5 w-5 mr-2 text-[#FF385C]" />
            Your Goals ({goals.length})
          </h3>
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-3 py-2 bg-[#FF385C] text-white rounded-lg hover:bg-[#E31C5F] transition-colors text-sm"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Goals
          </button>
        </div>
        
        {goals.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {goals.map((goal, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <span className="text-gray-900 font-medium">{goal.goal}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-4">No goals set yet</p>
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 bg-[#FF385C] text-white rounded-lg hover:bg-[#E31C5F] transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Goal
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <Edit3 className="h-5 w-5 mr-2 text-[#FF385C]" />
          Edit Your Goals
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={handleCancel}
            className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-3 py-2 bg-[#FF385C] text-white rounded-lg hover:bg-[#E31C5F] disabled:opacity-50 transition-colors text-sm"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Goals
              </>
            )}
          </button>
        </div>
      </div>

      {/* Current Goals */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-gray-900">Current Goals:</h4>
        <div className="space-y-2">
          {editedGoals.map((goal, index) => (
            <div key={index} className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3">
              <span className="flex-1 text-gray-900">{goal}</span>
              <button
                onClick={() => handleRemoveGoal(index)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Goal */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-gray-900">Add New Goal:</h4>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            placeholder="Type your custom goal..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleAddGoal(newGoal)}
          />
          <button
            onClick={() => handleAddGoal(newGoal)}
            disabled={!newGoal.trim()}
            className="px-3 py-2 bg-[#FF385C] text-white rounded-lg hover:bg-[#E31C5F] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Preset Goals */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Or choose from presets:</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PRESET_GOALS.filter(preset => !editedGoals.includes(preset)).map(preset => (
            <button
              key={preset}
              onClick={() => handleAddGoal(preset)}
              className="p-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
} 