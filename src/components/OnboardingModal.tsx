"use client"

import { useState } from "react"
import { X, Target } from "lucide-react"

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveGoals: (goals: string[]) => void
}

const PRESET_GOALS = [
  "Study",
  "Workout", 
  "Improve Focus",
  "Work on Projects",
  "Read More",
  "Learn New Skills",
  "Meditate",
  "Exercise Regularly"
]

export default function OnboardingModal({ isOpen, onClose, onSaveGoals }: OnboardingModalProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [customGoal, setCustomGoal] = useState("")

  if (!isOpen) return null

  const handleGoalToggle = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    )
  }

  const handleAddCustomGoal = () => {
    if (customGoal.trim() && !selectedGoals.includes(customGoal.trim())) {
      setSelectedGoals(prev => [...prev, customGoal.trim()])
      setCustomGoal("")
    }
  }

  const handleSave = () => {
    if (selectedGoals.length > 0) {
      onSaveGoals(selectedGoals)
      onClose()
    }
  }

  const handleSkip = () => {
    onSaveGoals([])
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF385C] to-[#E31C5F] rounded-xl flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Welcome to Time Track!</h2>
                <p className="text-sm text-gray-600">What are your goals?</p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Description */}
          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed">
              Help us understand what you want to achieve. Select your goals below and we'll track your progress to help you stay motivated.
            </p>
          </div>

          {/* Goal Selection */}
          <div className="space-y-4 mb-6">
            <h3 className="font-semibold text-gray-900">Select your goals:</h3>
            <div className="grid grid-cols-2 gap-3">
              {PRESET_GOALS.map(goal => (
                <button
                  key={goal}
                  onClick={() => handleGoalToggle(goal)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    selectedGoals.includes(goal)
                      ? 'bg-[#FF385C] text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Goal Input */}
          <div className="space-y-3 mb-6">
            <h3 className="font-semibold text-gray-900">Or add your own:</h3>
            <div className="flex space-x-2">
              <input
                type="text"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                placeholder="Type your custom goal..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomGoal()}
              />
              <button
                onClick={handleAddCustomGoal}
                disabled={!customGoal.trim()}
                className="px-4 py-2 bg-[#FF385C] text-white rounded-lg hover:bg-[#E31C5F] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Selected Goals Display */}
          {selectedGoals.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Your selected goals:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedGoals.map(goal => (
                  <span
                    key={goal}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {goal}
                    <button
                      onClick={() => handleGoalToggle(goal)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={selectedGoals.length === 0}
              className="flex-1 px-4 py-3 bg-[#FF385C] text-white rounded-xl font-semibold hover:bg-[#E31C5F] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Save Goals & Continue
            </button>
            <button
              onClick={handleSkip}
              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
            >
              Skip for Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
