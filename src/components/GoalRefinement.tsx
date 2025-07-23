"use client"

import { useState } from "react"
import { Target, Calendar, TrendingUp, Zap, ChevronRight, ChevronDown, Save, X, Plus, Trash2, AlertCircle } from "lucide-react"

interface SmartGoal {
  _id?: string
  goal: string
  targetValue: number
  currentValue: number
  unit: string
  deadline: Date
  relatedCategories: string[]
  specificActivities: string[]
  excludedActivities: string[]
  goalType: string
  milestones: Array<{
    description: string
    targetValue: number
    targetDate: Date
    completed: boolean
  }>
}

interface GoalRefinementProps {
  goals: any[]
  onGoalsUpdate: () => void
}

const GOAL_TEMPLATES = {
  'Work on Projects': {
    goalType: 'project',
    suggestions: {
      specificGoal: 'Complete specific project(s)',
      measurableOutcome: 'Project deliverables or milestones',
      examples: [
        { target: 'Launch personal blog website', value: 1, unit: 'website', categories: ['work'], activities: ['Blog development', 'Content writing', 'Design work'] },
        { target: 'Build mobile app MVP', value: 1, unit: 'app', categories: ['work'], activities: ['React Native development', 'API integration', 'UI design'] },
        { target: 'Generate $500 MRR from side project', value: 500, unit: 'dollars', categories: ['work'], activities: ['Product development', 'Marketing', 'Customer support'] }
      ]
    }
  },
  'Improve Focus': {
    goalType: 'productivity',
    suggestions: {
      specificGoal: 'Reduce distractions and increase deep work time',
      measurableOutcome: 'Hours of focused work or distraction incidents',
      examples: [
        { target: 'Complete 4 hours of deep work daily', value: 4, unit: 'hours', categories: ['work'], activities: ['Deep work sessions', 'Focused coding'], excludedActivities: ['Social media', 'Random browsing'] },
        { target: 'Reduce phone pickups to under 20 per day', value: 20, unit: 'pickups', categories: ['personal'], activities: ['Mindful phone usage', 'Focus blocks'] },
        { target: 'Read 25 pages without interruption daily', value: 25, unit: 'pages', categories: ['education'], activities: ['Reading sessions', 'Study time'] }
      ]
    }
  },
  'Exercise Regularly': {
    goalType: 'health',
    suggestions: {
      specificGoal: 'Establish consistent exercise routine',
      measurableOutcome: 'Workout frequency, duration, or physical metrics',
      examples: [
        { target: 'Work out 4 times per week', value: 4, unit: 'sessions', categories: ['health'], activities: ['Gym session', 'Running', 'Home workout'] },
        { target: 'Lose 10kg in 6 months', value: 10, unit: 'kg', categories: ['health'], activities: ['Cardio exercise', 'Strength training', 'Meal prep'] },
        { target: 'Run 5km without stopping', value: 5, unit: 'km', categories: ['health'], activities: ['Running practice', 'Cardio training'] }
      ]
    }
  },
  'Learn New Skills': {
    goalType: 'learning',
    suggestions: {
      specificGoal: 'Master a specific skill or technology',
      measurableOutcome: 'Certificates, projects, or competency milestones',
      examples: [
        { target: 'Complete React certification course', value: 1, unit: 'certification', categories: ['education'], activities: ['React study', 'Code practice', 'Course videos'] },
        { target: 'Build 3 projects using Next.js', value: 3, unit: 'projects', categories: ['education', 'work'], activities: ['Next.js development', 'Project planning'] },
        { target: 'Study 1 hour daily for Spanish fluency', value: 1, unit: 'hours', categories: ['education'], activities: ['Spanish lessons', 'Language practice'] }
      ]
    }
  },
  'Study': {
    goalType: 'learning',
    suggestions: {
      specificGoal: 'Complete specific educational goals',
      measurableOutcome: 'Grades, certificates, or learning milestones',
      examples: [
        { target: 'Achieve 85% average in current semester', value: 85, unit: 'percentage', categories: ['education'], activities: ['Lecture attendance', 'Assignment work', 'Study sessions'] },
        { target: 'Complete AWS certification', value: 1, unit: 'certification', categories: ['education'], activities: ['AWS study', 'Practice exams', 'Hands-on labs'] },
        { target: 'Read 2 technical books per month', value: 2, unit: 'books', categories: ['education'], activities: ['Technical reading', 'Note taking'] }
      ]
    }
  }
}

const CATEGORIES = [
  'work', 'education', 'health', 'personal', 'social', 'entertainment', 'other'
]

export default function GoalRefinement({ goals, onGoalsUpdate }: GoalRefinementProps) {
  const [selectedGoal, setSelectedGoal] = useState<any>(null)
  const [isRefining, setIsRefining] = useState(false)
  const [smartGoal, setSmartGoal] = useState<SmartGoal | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['specific']))
  const [saving, setSaving] = useState(false)

  const unrefinedGoals = goals.filter(g => !g.isRefined)
  const refinedGoals = goals.filter(g => g.isRefined)

  const startRefinement = (goal: any) => {
    setSelectedGoal(goal)
    const template = GOAL_TEMPLATES[goal.goal as keyof typeof GOAL_TEMPLATES]
    
    setSmartGoal({
      _id: goal._id,
      goal: goal.goal,
      targetValue: 0,
      currentValue: 0,
      unit: '',
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days default
      relatedCategories: template?.suggestions.examples[0].categories || ['work'],
      specificActivities: template?.suggestions.examples[0].activities || [],
      excludedActivities: (template?.suggestions.examples[0] as any)?.excludedActivities || [],
      goalType: template?.goalType || 'other',
      milestones: []
    })
    setIsRefining(true)
  }

  const applyTemplate = (example: any) => {
    if (!smartGoal) return
    
    setSmartGoal({
      ...smartGoal,
      targetValue: example.value,
      unit: example.unit,
      relatedCategories: example.categories || smartGoal.relatedCategories,
      specificActivities: example.activities || smartGoal.specificActivities,
      excludedActivities: (example as any).excludedActivities || smartGoal.excludedActivities
    })
  }

  const addMilestone = () => {
    if (!smartGoal) return
    
    const newMilestone = {
      description: '',
      targetValue: Math.ceil(smartGoal.targetValue / 3), // Default to 1/3 of target
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      completed: false
    }
    
    setSmartGoal({
      ...smartGoal,
      milestones: [...smartGoal.milestones, newMilestone]
    })
  }

  const updateMilestone = (index: number, field: string, value: any) => {
    if (!smartGoal) return
    
    const updatedMilestones = [...smartGoal.milestones]
    updatedMilestones[index] = { ...updatedMilestones[index], [field]: value }
    
    setSmartGoal({
      ...smartGoal,
      milestones: updatedMilestones
    })
  }

  const removeMilestone = (index: number) => {
    if (!smartGoal) return
    
    setSmartGoal({
      ...smartGoal,
      milestones: smartGoal.milestones.filter((_, i) => i !== index)
    })
  }

  const saveSmartGoal = async () => {
    if (!smartGoal) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/goals/${smartGoal._id}/refine`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...smartGoal,
          isRefined: true
        }),
      })
      
      if (response.ok) {
        setIsRefining(false)
        setSelectedGoal(null)
        setSmartGoal(null)
        onGoalsUpdate()
      }
    } catch (error) {
      console.error('Failed to save refined goal:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const addActivity = (type: 'specific' | 'excluded') => {
    if (!smartGoal) return
    
    const field = type === 'specific' ? 'specificActivities' : 'excludedActivities'
    setSmartGoal({
      ...smartGoal,
      [field]: [...smartGoal[field], '']
    })
  }

  const updateActivity = (type: 'specific' | 'excluded', index: number, value: string) => {
    if (!smartGoal) return
    
    const field = type === 'specific' ? 'specificActivities' : 'excludedActivities'
    const activities = [...smartGoal[field]]
    activities[index] = value
    
    setSmartGoal({
      ...smartGoal,
      [field]: activities
    })
  }

  const removeActivity = (type: 'specific' | 'excluded', index: number) => {
    if (!smartGoal) return
    
    const field = type === 'specific' ? 'specificActivities' : 'excludedActivities'
    setSmartGoal({
      ...smartGoal,
      [field]: smartGoal[field].filter((_, i) => i !== index)
    })
  }

  if (isRefining && smartGoal) {
    const template = GOAL_TEMPLATES[selectedGoal?.goal as keyof typeof GOAL_TEMPLATES]
    
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-6 rounded-t-2xl">
          <div className="flex items-center justify-between text-white">
            <div>
              <h3 className="text-xl font-semibold mb-1">Refine Goal: {selectedGoal.goal}</h3>
              <p className="text-purple-100">Transform into a SMART goal with specific outcomes</p>
            </div>
            <button
              onClick={() => setIsRefining(false)}
              className="text-purple-100 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Template Examples */}
          {template && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Quick Start Templates
              </h4>
              <div className="grid gap-3">
                {template.suggestions.examples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => applyTemplate(example)}
                    className="text-left p-3 bg-white rounded-lg border border-blue-100 hover:border-blue-300 transition-colors"
                  >
                    <div className="font-medium text-blue-900">{example.target}</div>
                    <div className="text-sm text-blue-700">{example.value} {example.unit}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Specific Goal */}
          <div>
            <button
              onClick={() => toggleSection('specific')}
              className="flex items-center justify-between w-full text-left mb-4"
            >
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <Target className="h-5 w-5 mr-2 text-purple-600" />
                Specific Goal
              </h4>
              {expandedSections.has('specific') ? 
                <ChevronDown className="h-5 w-5 text-gray-400" /> : 
                <ChevronRight className="h-5 w-5 text-gray-400" />
              }
            </button>
            
            {expandedSections.has('specific') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What exactly will you accomplish?
                  </label>
                  <input
                    type="text"
                    value={smartGoal.goal}
                    onChange={(e) => setSmartGoal({...smartGoal, goal: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Launch a React-based personal portfolio website"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Measurable */}
          <div>
            <button
              onClick={() => toggleSection('measurable')}
              className="flex items-center justify-between w-full text-left mb-4"
            >
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                Measurable Outcome
              </h4>
              {expandedSections.has('measurable') ? 
                <ChevronDown className="h-5 w-5 text-gray-400" /> : 
                <ChevronRight className="h-5 w-5 text-gray-400" />
              }
            </button>
            
            {expandedSections.has('measurable') && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Value</label>
                    <input
                      type="number"
                      value={smartGoal.targetValue}
                      onChange={(e) => setSmartGoal({...smartGoal, targetValue: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                    <input
                      type="text"
                      value={smartGoal.unit}
                      onChange={(e) => setSmartGoal({...smartGoal, unit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="dollars, kg, hours, pages"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Value</label>
                    <input
                      type="number"
                      value={smartGoal.currentValue}
                      onChange={(e) => setSmartGoal({...smartGoal, currentValue: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How will you measure success?
                  </label>
                  <input
                    type="text"
                    value={smartGoal.goal} // This field is no longer used for measurable outcome, but kept for consistency
                    onChange={(e) => setSmartGoal({...smartGoal, goal: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Monthly recurring revenue, weight lost, projects completed"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div>
            <button
              onClick={() => toggleSection('timeline')}
              className="flex items-center justify-between w-full text-left mb-4"
            >
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Timeline & Deadline
              </h4>
              {expandedSections.has('timeline') ? 
                <ChevronDown className="h-5 w-5 text-gray-400" /> : 
                <ChevronRight className="h-5 w-5 text-gray-400" />
              }
            </button>
            
            {expandedSections.has('timeline') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Deadline
                  </label>
                  <input
                    type="date"
                    value={smartGoal.deadline.toISOString().split('T')[0]}
                    onChange={(e) => setSmartGoal({...smartGoal, deadline: new Date(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                {/* Milestones */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Milestones (Optional)
                    </label>
                    <button
                      onClick={addMilestone}
                      className="inline-flex items-center px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Milestone
                    </button>
                  </div>
                  
                  {smartGoal.milestones.map((milestone, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 mb-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={milestone.description}
                          onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Milestone description"
                        />
                        <input
                          type="number"
                          value={milestone.targetValue}
                          onChange={(e) => updateMilestone(index, 'targetValue', parseFloat(e.target.value) || 0)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Target value"
                        />
                        <div className="flex space-x-2">
                          <input
                            type="date"
                            value={milestone.targetDate.toISOString().split('T')[0]}
                            onChange={(e) => updateMilestone(index, 'targetDate', new Date(e.target.value))}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <button
                            onClick={() => removeMilestone(index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Activity Mapping */}
          <div>
            <button
              onClick={() => toggleSection('activities')}
              className="flex items-center justify-between w-full text-left mb-4"
            >
              <h4 className="text-lg font-semibold text-gray-900">
                Activity & Category Mapping
              </h4>
              {expandedSections.has('activities') ? 
                <ChevronDown className="h-5 w-5 text-gray-400" /> : 
                <ChevronRight className="h-5 w-5 text-gray-400" />
              }
            </button>
            
            {expandedSections.has('activities') && (
              <div className="space-y-6">
                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Related Categories (time entries that count toward this goal)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {CATEGORIES.map(category => (
                      <label key={category} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={smartGoal.relatedCategories.includes(category)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSmartGoal({
                                ...smartGoal,
                                relatedCategories: [...smartGoal.relatedCategories, category]
                              })
                            } else {
                              setSmartGoal({
                                ...smartGoal,
                                relatedCategories: smartGoal.relatedCategories.filter(c => c !== category)
                              })
                            }
                          }}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Specific Activities */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Specific Activities (that count toward this goal)
                    </label>
                    <button
                      onClick={() => addActivity('specific')}
                      className="text-purple-600 hover:text-purple-700 transition-colors text-sm"
                    >
                      <Plus className="h-4 w-4 inline mr-1" />
                      Add Activity
                    </button>
                  </div>
                  
                  {smartGoal.specificActivities.map((activity, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={activity}
                        onChange={(e) => updateActivity('specific', index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., React development, Blog writing, Gym workout"
                      />
                      <button
                        onClick={() => removeActivity('specific', index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Excluded Activities */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Excluded Activities (that don't count toward this goal)
                    </label>
                    <button
                      onClick={() => addActivity('excluded')}
                      className="text-red-600 hover:text-red-700 transition-colors text-sm"
                    >
                      <Plus className="h-4 w-4 inline mr-1" />
                      Add Exclusion
                    </button>
                  </div>
                  
                  {smartGoal.excludedActivities.map((activity, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={activity}
                        onChange={(e) => updateActivity('excluded', index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="e.g., Social media, Random browsing, Non-work meetings"
                      />
                      <button
                        onClick={() => removeActivity('excluded', index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              onClick={() => setIsRefining(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveSmartGoal}
              disabled={saving || !smartGoal.goal || !smartGoal.targetValue}
              className="inline-flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save SMART Goal
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Unrefined Goals */}
      {unrefinedGoals.length > 0 && (
        <div className="bg-orange-50 rounded-2xl border border-orange-200 p-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-6 w-6 text-orange-600 mr-3" />
            <h3 className="font-semibold text-orange-900">
              Goals That Need Refinement ({unrefinedGoals.length})
            </h3>
          </div>
          <p className="text-orange-800 mb-4">
            These goals are too vague for effective tracking. Refine them into SMART goals with specific outcomes.
          </p>
          
          <div className="grid gap-3 md:grid-cols-2">
            {unrefinedGoals.map((goal, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-orange-100">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{goal.goal}</span>
                  <button
                    onClick={() => startRefinement(goal)}
                    className="inline-flex items-center px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    Refine Goal
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refined Goals */}
      {refinedGoals.length > 0 && (
        <div className="bg-green-50 rounded-2xl border border-green-200 p-6">
          <h3 className="font-semibold text-green-900 mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            SMART Goals ({refinedGoals.length})
          </h3>
          
          <div className="space-y-4">
            {refinedGoals.map((goal, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-green-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{goal.goal}</h4>
                    <div className="text-sm text-gray-600 mb-2">
                      Target: {goal.targetValue} {goal.unit} by {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No deadline'}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(100, (goal.currentValue / goal.targetValue) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {goal.currentValue} / {goal.targetValue} {goal.unit} 
                      ({Math.round((goal.currentValue / goal.targetValue) * 100)}%)
                    </div>
                  </div>
                  <button
                    onClick={() => startRefinement(goal)}
                    className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Target className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {unrefinedGoals.length === 0 && refinedGoals.length === 0 && (
        <div className="text-center py-8">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No goals to refine. Set some goals first!</p>
        </div>
      )}
    </div>
  )
} 