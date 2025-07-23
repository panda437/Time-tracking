"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { Target, Save, X, Plus, Trash2, Calendar, Edit3 } from "lucide-react"

interface GoalEditModalProps {
  goal: any | null
  onClose: () => void
  onSaved: () => void
}

const CATEGORIES = [
  "work", "education", "health", "personal", "social", "entertainment", "other"
]

const GOAL_TYPES = [
  "financial", "health", "learning", "productivity", "relationship", "habit", "project", "other"
]

export default function GoalEditModal({ goal, onClose, onSaved }: GoalEditModalProps) {
  const isNew = !goal
  const [form, setForm] = useState<any>({
    goal: "",
    targetValue: 0,
    currentValue: 0,
    unit: "",
    deadline: "",
    relatedCategories: [],
    specificActivities: [],
    excludedActivities: [],
    goalType: "other",
    milestones: [],
    isRefined: false
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (goal) {
      setForm({
        ...form,
        ...goal,
        deadline: goal.deadline ? format(new Date(goal.deadline), 'yyyy-MM-dd') : ""
      })
    }
    // eslint-disable-next-line
  }, [goal])

  const handleChange = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleArrayChange = (field: string, index: number, value: string) => {
    setForm((prev: any) => {
      const arr = [...(prev[field] || [])]
      arr[index] = value
      return { ...prev, [field]: arr }
    })
  }

  const addArrayItem = (field: string) => {
    setForm((prev: any) => ({ ...prev, [field]: [...(prev[field] || []), ""] }))
  }

  const removeArrayItem = (field: string, index: number) => {
    setForm((prev: any) => {
      const arr = [...(prev[field] || [])]
      arr.splice(index, 1)
      return { ...prev, [field]: arr }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      let res
      if (isNew) {
        // POST to /api/goals with new goal (as array)
        res = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goals: [{ ...form, isRefined: true }] })
        })
      } else {
        // PUT to /api/goals/[id]/refine
        res = await fetch(`/api/goals/${goal._id}/refine`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, isRefined: true })
        })
      }
      if (res.ok) {
        onSaved()
        onClose()
      } else {
        const err = await res.json()
        setError(err.error || "Failed to save goal")
      }
    } catch (e) {
      setError("Failed to save goal")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    // Optional: implement delete if needed
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6 pb-24 md:pb-6">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
        <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl mx-auto transform transition-all">
          {/* Header */}
          <div className="px-8 py-6 rounded-t-3xl bg-gradient-to-r from-[#FF385C] to-[#E31C5F]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-1">
                    {isNew ? 'Add New Goal' : (form.goal || 'Edit Goal')}
                  </h2>
                  <p className="text-white/80">
                    {isNew ? 'Create a new SMART goal' : 'Edit or refine your goal'}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-colors" title="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8 space-y-6">
            {error && <div className="bg-red-100 text-red-700 rounded-lg p-3 mb-2">{error}</div>}
            <div className="space-y-3">
              <label className="block text-lg font-medium text-[#222222]">Goal Title *</label>
              <input
                type="text"
                value={form.goal}
                onChange={e => handleChange('goal', e.target.value)}
                placeholder="E.g. Work on Projects, Exercise Regularly"
                className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all placeholder-gray-400 bg-[#FAFAFA] focus:bg-white"
                autoFocus
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="block text-lg font-medium text-[#222222]">Target Value</label>
                <input
                  type="number"
                  value={form.targetValue}
                  onChange={e => handleChange('targetValue', Number(e.target.value))}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all placeholder-gray-400 bg-[#FAFAFA] focus:bg-white"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-lg font-medium text-[#222222]">Current Value</label>
                <input
                  type="number"
                  value={form.currentValue}
                  onChange={e => handleChange('currentValue', Number(e.target.value))}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all placeholder-gray-400 bg-[#FAFAFA] focus:bg-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="block text-lg font-medium text-[#222222]">Unit</label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={e => handleChange('unit', e.target.value)}
                  placeholder="e.g. hours, kg, sessions"
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all placeholder-gray-400 bg-[#FAFAFA] focus:bg-white"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-lg font-medium text-[#222222]">Deadline</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={e => handleChange('deadline', e.target.value)}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all placeholder-gray-400 bg-[#FAFAFA] focus:bg-white"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-lg font-medium text-[#222222]">Related Categories</label>
              <select
                multiple
                value={form.relatedCategories}
                onChange={e => handleChange('relatedCategories', Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all bg-[#FAFAFA] focus:bg-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <label className="block text-lg font-medium text-[#222222]">Specific Activities</label>
              {form.specificActivities.map((act: string, idx: number) => (
                <div key={idx} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={act}
                    onChange={e => handleArrayChange('specificActivities', idx, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg"
                  />
                  <button onClick={() => removeArrayItem('specificActivities', idx)} className="text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button onClick={() => addArrayItem('specificActivities')} className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"><Plus className="h-4 w-4 mr-1" /> Add Activity</button>
            </div>
            <div className="space-y-3">
              <label className="block text-lg font-medium text-[#222222]">Excluded Activities</label>
              {form.excludedActivities.map((act: string, idx: number) => (
                <div key={idx} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={act}
                    onChange={e => handleArrayChange('excludedActivities', idx, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg"
                  />
                  <button onClick={() => removeArrayItem('excludedActivities', idx)} className="text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button onClick={() => addArrayItem('excludedActivities')} className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"><Plus className="h-4 w-4 mr-1" /> Add Excluded</button>
            </div>
            <div className="space-y-3">
              <label className="block text-lg font-medium text-[#222222]">Goal Type</label>
              <select
                value={form.goalType}
                onChange={e => handleChange('goalType', e.target.value)}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all bg-[#FAFAFA] focus:bg-white"
              >
                {GOAL_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            {/* Milestones */}
            <div className="space-y-3">
              <label className="block text-lg font-medium text-[#222222]">Milestones</label>
              {form.milestones.map((ms: any, idx: number) => (
                <div key={idx} className="grid grid-cols-4 gap-2 mb-2 items-center">
                  <input
                    type="text"
                    value={ms.description}
                    onChange={e => {
                      const arr = [...form.milestones]
                      arr[idx].description = e.target.value
                      setForm((prev: any) => ({ ...prev, milestones: arr }))
                    }}
                    placeholder="Description"
                    className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  <input
                    type="number"
                    value={ms.targetValue}
                    onChange={e => {
                      const arr = [...form.milestones]
                      arr[idx].targetValue = Number(e.target.value)
                      setForm((prev: any) => ({ ...prev, milestones: arr }))
                    }}
                    placeholder="Target"
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  <input
                    type="date"
                    value={ms.targetDate ? format(new Date(ms.targetDate), 'yyyy-MM-dd') : ''}
                    onChange={e => {
                      const arr = [...form.milestones]
                      arr[idx].targetDate = e.target.value
                      setForm((prev: any) => ({ ...prev, milestones: arr }))
                    }}
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  <button onClick={() => {
                    const arr = [...form.milestones]
                    arr.splice(idx, 1)
                    setForm((prev: any) => ({ ...prev, milestones: arr }))
                  }} className="text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button onClick={() => setForm((prev: any) => ({ ...prev, milestones: [...(prev.milestones || []), { description: '', targetValue: 0, targetDate: '', completed: false } ] }))} className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"><Plus className="h-4 w-4 mr-1" /> Add Milestone</button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 px-8 py-6 border-t border-gray-100 rounded-b-3xl bg-gray-50">
            <button onClick={onClose} className="px-5 py-3 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-5 py-3 rounded-xl bg-[#FF385C] text-white font-semibold hover:bg-[#E31C5F] transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Goal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 