"use client"

import { useState } from "react"
import { X, Plus, AlertCircle } from "lucide-react"

interface CategorySelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveCategories: (categories: string[]) => void
}

const DEFAULT_CATEGORIES = [
  "Work",
  "Personal", 
  "Health",
  "Education",
  "Social",
  "Fun",
  "Side Project",
  "Other"
]

export default function CategorySelectionModal({ isOpen, onClose, onSaveCategories }: CategorySelectionModalProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [newCategory, setNewCategory] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleAddCategory = () => {
    if (newCategory.trim() && !selectedCategories.includes(newCategory.trim())) {
      setSelectedCategories(prev => [...prev, newCategory.trim()])
      setNewCategory("")
    }
  }

  const handleSaveCategories = async () => {
    if (selectedCategories.length === 0) return
    
    setIsSaving(true)
    setError(null)
    
    try {
      const response = await fetch("/api/user/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ categories: selectedCategories }),
      })
      
      if (response.ok) {
        onSaveCategories(selectedCategories)
        onClose()
      } else {
        const errorData = await response.json()
        console.error("API Error:", errorData)
        setError(errorData.error || "Failed to save categories. Please try again.")
      }
    } catch (error) {
      console.error("Network Error:", error)
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSkip = () => {
    onSaveCategories(DEFAULT_CATEGORIES)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex md:items-center md:justify-center items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[96vh] overflow-y-auto shadow-xl">
        <div className="p-4 sm:p-6 text-sm sm:text-base">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00A699] to-[#009B8E] rounded-xl flex items-center justify-center">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Customize Your Categories</h2>
                <p className="text-sm text-gray-600">Select the categories that matter to you</p>
              </div>
            </div>
            <button onClick={handleSkip} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed">
              Choose the categories that best represent how you spend your time. You can remove defaults and add your own categories.
            </p>
          </div>

          {/* Category Selection */}
          <div className="space-y-3 mb-6">
            <h3 className="font-semibold text-gray-900">Select your categories:</h3>
            <div className="grid grid-cols-2 gap-3">
              {selectedCategories.map(category => (
                <button
                  key={category}
                  onClick={() => handleCategoryToggle(category)}
                  className={`p-2 sm:p-3 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                    selectedCategories.includes(category)
                      ? 'bg-[#00A699] text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{category}</span>
                  {category !== "Other" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCategoryToggle(category)
                      }}
                      className="ml-2 text-xs opacity-70 hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Add New Category */}
          <div className="space-y-2 mb-6">
            <h3 className="font-semibold text-gray-900">Add your own category:</h3>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Type your custom category..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A699] focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <button
                onClick={handleAddCategory}
                disabled={!newCategory.trim()}
                className="px-3 py-2 sm:px-4 bg-[#00A699] text-white rounded-lg hover:bg-[#009B8E] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
              >
                Add
              </button>
            </div>
          </div>

          {/* Selected Categories Display */}
          {selectedCategories.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Your selected categories:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map(category => (
                  <span
                    key={category}
                    className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {category}
                    {category !== "Other" && (
                      <button
                        onClick={() => handleCategoryToggle(category)}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 sticky bottom-0 bg-white pt-4 pb-2">
            <button
              onClick={handleSaveCategories}
              disabled={selectedCategories.length === 0 || isSaving}
              className="px-4 py-2 bg-[#00A699] text-white rounded-lg font-semibold hover:bg-[#009B8E] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : 'Start Tracking Your Time'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 