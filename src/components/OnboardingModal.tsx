"use client"

import { useState } from "react"
import { X, Target, ArrowLeft, ArrowRight, Check, AlertCircle } from "lucide-react"

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveGoals: (goals: any[]) => void
}

const PRESET_GOALS = [
  "Study for an Exam",
  "Lose Weight", 
  "Build Side Projects",
  "Grow Business",
  "Read More",
  "Learn New Skill",
  "Care for Family",
  "Find a New Job",
  "Improve Sleep",
  "Grow on Social Media"
]

const CATEGORIES = [
  "work", "education", "health", "personal", "social", "entertainment", "other"
]

export default function OnboardingModal({ isOpen, onClose, onSaveGoals }: OnboardingModalProps) {
  const [step, setStep] = useState(0)
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [customGoal, setCustomGoal] = useState("")
  const [goalDetails, setGoalDetails] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleNext = async () => {
    if (step === 0 && selectedGoals.length > 0) {
      // Initialize goal details for each selected goal
      const details = selectedGoals.map(goal => ({
        goal,
        specificGoal: "",
        measurableOutcome: "",
        targetValue: 0,
        currentValue: 0,
        unit: "",
        deadline: "",
        relatedCategories: [],
        specificActivities: [],
        excludedActivities: [],
        goalType: "other",
        milestones: [],
        isRefined: true
      }))
      setGoalDetails(details)
      setStep(1)
    } else if (step > 0 && step < selectedGoals.length) {
      setStep(step + 1)
    } else if (step === selectedGoals.length) {
      // Final step - save all goals
      await handleSaveGoals()
    }
  }

  const handleSaveGoals = async () => {
    setIsSaving(true)
    setError(null)
    
    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ goals: goalDetails }),
      })
      
      if (response.ok) {
        onSaveGoals(goalDetails)
        onClose()
      } else {
        const errorData = await response.json()
        console.error("API Error:", errorData)
        
        if (response.status === 401) {
          setError("You need to be logged in to save goals. Please refresh the page and try again.")
        } else {
          setError(errorData.error || "Failed to save goals. Please try again.")
        }
      }
    } catch (error) {
      console.error("Network Error:", error)
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleSkip = () => {
    onSaveGoals([])
    onClose()
  }

  const updateGoalDetail = (field: string, value: any) => {
    setGoalDetails(prev => {
      const updated = [...prev]
      updated[step - 1] = { ...updated[step - 1], [field]: value }
      return updated
    })
  }

  const currentGoal = step > 0 ? goalDetails[step - 1] : null
  const totalSteps = selectedGoals.length + 1
  const isLastStep = step === selectedGoals.length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex md:items-center md:justify-center items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[96vh] overflow-y-auto shadow-xl">
        <div className="p-4 sm:p-6 text-sm sm:text-base">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF385C] to-[#E31C5F] rounded-xl flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {step === 0 ? "Welcome to Time Track!" : `Goal ${step}: ${currentGoal?.goal}`}
                </h2>
                <p className="text-sm text-gray-600">
                  {step === 0 ? "What are your goals?" : "Add specific details"}
                </p>
              </div>
            </div>
            <button onClick={handleSkip} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Progress Dots */}
          {totalSteps > 1 && (
            <div className="flex justify-center space-x-2 mb-6">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i === step ? 'bg-[#FF385C]' : i < step ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Step 0: Goal Selection */}
          {step === 0 && (
            <>
              {/* Description */}
              <div className="mb-6">
                <p className="text-gray-700 leading-relaxed">
                  Help us understand what you want to achieve. Select your goals below and we'll track your progress to help you stay motivated.
                </p>
              </div>

              {/* Goal Selection */}
              <div className="space-y-3 mb-6">
                <h3 className="font-semibold text-gray-900">Select your goals:</h3>
                <div className="grid grid-cols-2 gap-3">
                  {PRESET_GOALS.map(goal => (
                    <button
                      key={goal}
                      onClick={() => handleGoalToggle(goal)}
                      className={`p-2 sm:p-3 rounded-xl text-xs sm:text-sm font-medium transition-all ${
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
              <div className="space-y-2 mb-6">
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
                    className="px-3 py-2 sm:px-4 bg-[#FF385C] text-white rounded-lg hover:bg-[#E31C5F] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
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
            </>
          )}

          {/* Goal Detail Steps */}
          {step > 0 && currentGoal && (
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Specific Goal</label>
                <input
                  type="text"
                  value={currentGoal.specificGoal}
                  onChange={e => updateGoalDetail('specificGoal', e.target.value)}
                  placeholder="What exactly will you accomplish?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Measurable Outcome</label>
                <input
                  type="text"
                  value={currentGoal.measurableOutcome}
                  onChange={e => updateGoalDetail('measurableOutcome', e.target.value)}
                  placeholder="How will you measure success?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Target Value</label>
                  <input
                    type="number"
                    value={currentGoal.targetValue}
                    onChange={e => updateGoalDetail('targetValue', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <input
                    type="text"
                    value={currentGoal.unit}
                    onChange={e => updateGoalDetail('unit', e.target.value)}
                    placeholder="e.g. hours, kg, sessions"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Deadline</label>
                <input
                  type="date"
                  value={currentGoal.deadline}
                  onChange={e => updateGoalDetail('deadline', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Related Categories</label>
                <select
                  multiple
                  value={currentGoal.relatedCategories}
                  onChange={e => updateGoalDetail('relatedCategories', Array.from(e.target.selectedOptions, option => option.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Final Step */}
          {isLastStep && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">All Set!</h3>
              <p className="text-gray-600">
                We've captured details for all {selectedGoals.length} goals. Let's start tracking your progress!
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between space-x-3 sticky bottom-0 bg-white pt-4 pb-2">
            {step > 0 && (
              <button
                onClick={handleBack}
                disabled={isSaving}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </button>
            )}
            
            <div className="flex-1" />
            
            {step === 0 ? (
              <button
                onClick={handleNext}
                disabled={selectedGoals.length === 0}
                className="px-4 py-2 bg-[#FF385C] text-white rounded-lg font-semibold hover:bg-[#E31C5F] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={isSaving}
                className="flex items-center px-4 py-2 bg-[#FF385C] text-white rounded-lg font-semibold hover:bg-[#E31C5F] transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : (isLastStep ? 'Get Started' : 'Next')}
                {!isSaving && <ArrowRight className="h-4 w-4 ml-1" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
