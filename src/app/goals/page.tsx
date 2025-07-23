"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Header from "@/components/Header"
import MobileNavigation from "@/components/MobileNavigation"
import GoalManagement from "@/components/GoalManagement"
import GoalRefinement from "@/components/GoalRefinement"
import GoalEditModal from "@/components/GoalEditModal"
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Brain, 
  Lightbulb,
  Clock,
  BarChart3,
  Edit3,
  Plus,
  Zap,
  Sparkles,
  RefreshCw,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react"

interface GoalInsight {
  goalName: string
  status: 'on-track' | 'behind' | 'exceeding' | 'needs-attention'
  progressPercentage: number
  timeAllocated: number
  alignment: 'high' | 'medium' | 'low'
  insights: string[]
  recommendations: string[]
  blockers: string[]
  successFactors: string[]
}

interface GoalAnalysisResponse {
  overallScore: number
  insights: GoalInsight[]
  whatIsWorking: string[]
  whatNeedsWork: string[]
  keyRecommendations: string[]
  adjustmentSuggestions: {
    goalName: string
    suggestion: string
    reason: string
  }[]
  motivationalMessage: string
  nextSteps: string[]
}

interface Goal {
  _id: string
  goal: string
  isActive: boolean
  isRefined?: boolean
  targetValue?: number
  currentValue?: number
  unit?: string
  deadline?: string | Date
  relatedCategories?: string[]
  specificActivities?: string[]
  excludedActivities?: string[]
  goalType?: string
  milestones?: Array<{
    description: string
    targetValue: number
    targetDate: string | Date
    completed: boolean
    completedDate?: string | Date
  }>
  createdAt?: string | Date
}

export default function GoalsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [goals, setGoals] = useState<Goal[]>([])
  const [analysis, setAnalysis] = useState<GoalAnalysisResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzingGoals, setAnalyzingGoals] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [goalToEdit, setGoalToEdit] = useState<any>(null)

  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/auth/signin")
      return
    }

    fetchGoals()
  }, [session, status, router])

  const fetchGoals = async () => {
    try {
      const response = await fetch("/api/goals")
      if (response.ok) {
        const goalsData = await response.json()
        setGoals(goalsData)
        
        setLoading(false)
      }
    } catch (error) {
      console.error("Failed to fetch goals:", error)
      setError("Failed to load goals")
      setLoading(false)
    }
  }

  const fetchAnalysis = async () => {
    setAnalyzingGoals(true)
    setError(null)
    
    try {
      const response = await fetch("/api/goals/analyze")
      if (response.ok) {
        const data = await response.json()
        setAnalysis(data.analysis)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to analyze goals")
      }
    } catch (error) {
      console.error("Failed to fetch goal analysis:", error)
      setError("Failed to analyze goals")
    } finally {
      setAnalyzingGoals(false)
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'exceeding': return <TrendingUp className="h-5 w-5 text-blue-500" />
      case 'behind': return <TrendingDown className="h-5 w-5 text-orange-500" />
      case 'needs-attention': return <AlertTriangle className="h-5 w-5 text-red-500" />
      default: return <Target className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'bg-green-50 border-green-200 text-green-800'
      case 'exceeding': return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'behind': return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'needs-attention': return 'bg-red-50 border-red-200 text-red-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getAlignmentIcon = (alignment: string) => {
    switch (alignment) {
      case 'high': return <ArrowUp className="h-4 w-4 text-green-500" />
      case 'medium': return <Minus className="h-4 w-4 text-yellow-500" />
      case 'low': return <ArrowDown className="h-4 w-4 text-red-500" />
      default: return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const refinedGoals = goals.filter((g: any) => g.isRefined)
  const unrefinedGoals = goals.filter((g: any) => !g.isRefined)

  if (loading && !analysis) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={{ name: session?.user?.name, email: session?.user?.email }} />
        <main className="pt-20 pb-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF385C]"></div>
            </div>
          </div>
        </main>
        <MobileNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={{ name: session?.user?.name, email: session?.user?.email }} />
      <main className="pt-20 pb-20 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FF385C] to-[#E31C5F] rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#222222]">
                AI Goal Analysis
              </h1>
            </div>
            <p className="text-lg text-[#767676] max-w-2xl mx-auto">
              Discover what's working, what's not, and get personalized recommendations 
              to achieve your goals faster.
            </p>
          </div>

          {refinedGoals.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#222222] flex items-center">
                <Target className="h-6 w-6 mr-3 text-green-600" />
                Your Refined Goals
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {refinedGoals.map(goal => (
                  <div key={goal._id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col relative">
                    <div className="flex items-center mb-2">
                      <Target className="h-7 w-7 text-purple-500 mr-3" />
                      <div className="flex-1">
                        <div className="text-lg font-bold text-gray-900">{goal.goal}</div>
                        <div className="text-sm text-gray-500">Target: {goal.targetValue} {goal.unit}</div>
                      </div>
                      <button onClick={() => { setGoalToEdit(goal); setShowGoalModal(true); }} className="ml-2 text-gray-400 hover:text-gray-700"><Edit3 className="h-5 w-5" /></button>
                    </div>
                    <div className="mt-2 mb-1">
                      <div className="text-xs text-gray-500 mb-1">Progress</div>
                      <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                        <div className="bg-[#FF385C] h-2 rounded-full" style={{ width: `${Math.min(100, (goal.currentValue && goal.targetValue ? (goal.currentValue / goal.targetValue) * 100 : 0))}%` }}></div>
                      </div>
                      <div className="text-xs text-gray-500 mb-1">Time</div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-400 h-2 rounded-full" style={{ width: goal.deadline && goal.createdAt ? `${Math.min(100, 100 - ((new Date(goal.deadline).getTime() - Date.now()) / (new Date(goal.deadline).getTime() - new Date(goal.createdAt).getTime())) * 100)}%` : '0%' }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unrefinedGoals.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <span>Your goal(s) need refinement for better tracking and AI insights.</span>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {unrefinedGoals.map(goal => (
                  <div key={goal._id} className="bg-white rounded-2xl shadow border border-gray-100 p-6 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-gray-900">{goal.goal}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => { setGoalToEdit(goal); setShowGoalModal(true); }} className="text-gray-400 hover:text-gray-700"><Edit3 className="h-5 w-5" /></button>
                      <button onClick={() => { setGoalToEdit(goal); setShowGoalModal(true); }} className="ml-2 px-3 py-1 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 transition-colors text-xs">Refine Goal</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={() => { setGoalToEdit(null); setShowGoalModal(true); }} className="inline-flex items-center px-4 py-2 bg-[#FF385C] text-white rounded-xl hover:bg-[#E31C5F] transition-colors">
              <Plus className="h-5 w-5 mr-2" />
              Add a New Goal
            </button>
          </div>

          {/* AI Insights Section */}
          <div className="mt-10">
            {/* Score Card */}
            <div className="bg-white rounded-2xl shadow border border-gray-100 p-6 flex items-center justify-between mb-6">
              <div>
                <div className="text-lg font-semibold text-gray-900 mb-1">AI Score</div>
                <div className="text-5xl font-bold text-gray-800">
                  {analysis ? `${analysis.overallScore}/10` : "?/10"}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <button onClick={fetchAnalysis} className="inline-flex items-center px-4 py-2 bg-[#FF385C] text-white rounded-xl hover:bg-[#E31C5F] transition-colors mb-2">
                  <Brain className="h-5 w-5 mr-2" />
                  {analyzingGoals ? "Loading..." : "Get AI Insights"}
                </button>
                <span className="text-gray-400 text-sm" title="AI analysis is based on your goals and tracked activities.">?</span>
              </div>
            </div>

            {/* Insights Sections */}
            {(!analysis || analyzingGoals) ? (
              <div className="space-y-8">
                {/* Section titles and skeletons only */}
                <div>
                  <div className="text-2xl font-semibold text-[#222222] flex items-center mb-2">
                    <BarChart3 className="h-6 w-6 mr-3 text-[#FF385C]" />
                    Goal-by-Goal Analysis
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-100 rounded-2xl h-40 animate-pulse"></div>
                    <div className="bg-gray-100 rounded-2xl h-40 animate-pulse"></div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-green-50 rounded-2xl border border-green-200 p-6">
                    <div className="font-semibold text-green-900 mb-2 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />What's Working Well
                    </div>
                    <div className="h-4 bg-green-100 rounded w-1/2 animate-pulse mb-2"></div>
                    <div className="h-4 bg-green-100 rounded w-1/3 animate-pulse"></div>
                  </div>
                  <div className="bg-orange-50 rounded-2xl border border-orange-200 p-6">
                    <div className="font-semibold text-orange-900 mb-2 flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2" />Areas for Improvement
                    </div>
                    <div className="h-4 bg-orange-100 rounded w-1/2 animate-pulse mb-2"></div>
                    <div className="h-4 bg-orange-100 rounded w-1/3 animate-pulse"></div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
                  <div className="font-semibold text-blue-900 mb-2 flex items-center">
                    <Brain className="h-5 w-5 mr-2" />Top AI Recommendations
                  </div>
                  <div className="h-4 bg-blue-100 rounded w-1/2 animate-pulse mb-2"></div>
                  <div className="h-4 bg-blue-100 rounded w-1/3 animate-pulse"></div>
                </div>
                <div className="bg-purple-50 rounded-2xl border border-purple-200 p-6">
                  <div className="font-semibold text-purple-900 mb-2 flex items-center">
                    <Edit3 className="h-5 w-5 mr-2" />Suggested Goal Adjustments
                  </div>
                  <div className="h-4 bg-purple-100 rounded w-1/2 animate-pulse mb-2"></div>
                  <div className="h-4 bg-purple-100 rounded w-1/3 animate-pulse"></div>
                </div>
                <div className="bg-gradient-to-r from-[#FF385C] to-[#E31C5F] rounded-2xl p-6 text-white">
                  <div className="font-semibold mb-2 flex items-center">
                    <Sparkles className="h-5 w-5 mr-2" />Your Next Steps
                  </div>
                  <div className="h-4 bg-white/20 rounded w-1/2 animate-pulse mb-2"></div>
                  <div className="h-4 bg-white/20 rounded w-1/3 animate-pulse"></div>
                </div>
              </div>
            ) : (
              <>
                {/* Goal-by-Goal Analysis */}
                <div>
                  <div className="text-2xl font-semibold text-[#222222] flex items-center mb-2">
                    <BarChart3 className="h-6 w-6 mr-3 text-[#FF385C]" />
                    Goal-by-Goal Analysis
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    {analysis.insights.map((insight, idx) => (
                      <div key={idx} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-gray-900 text-lg flex items-center">
                            {insight.goalName}
                            <span className={`ml-3 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(insight.status)}`}>{insight.status.replace('-', ' ')}</span>
                          </div>
                          <div className="flex flex-col items-end text-xs text-gray-500">
                            <div>Time Allocated <span className="font-semibold text-gray-900">{insight.timeAllocated ? `${Math.floor(insight.timeAllocated / 60)}h ${insight.timeAllocated % 60}m` : '--'}</span></div>
                            <div>Alignment <span className="font-semibold text-gray-900 capitalize">{insight.alignment || '--'}</span></div>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="font-semibold text-gray-900 mb-1 flex items-center"><Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />Key Insights</div>
                          <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                            {insight.insights.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        </div>
                        <div className="mb-2">
                          <div className="font-semibold text-gray-900 mb-1 flex items-center"><Zap className="h-4 w-4 mr-2 text-blue-500" />Recommendations</div>
                          <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                            {insight.recommendations.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        </div>
                        <div className="mt-auto pt-2">
                          <div className="text-xs text-gray-500 mb-1">Progress</div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-[#FF385C] h-2 rounded-full" style={{ width: `${insight.progressPercentage}%` }}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* What's Working Well & Areas for Improvement */}
                <div className="grid md:grid-cols-2 gap-6 mt-8">
                  <div className="bg-green-50 rounded-2xl border border-green-200 p-6">
                    <div className="font-semibold text-green-900 mb-4 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />What's Working Well
                    </div>
                    <ul className="space-y-2">
                      {analysis.whatIsWorking.map((item, index) => (
                        <li key={index} className="text-green-800 flex items-start">
                          <ChevronRight className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-orange-50 rounded-2xl border border-orange-200 p-6">
                    <div className="font-semibold text-orange-900 mb-4 flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2" />Areas for Improvement
                    </div>
                    <ul className="space-y-2">
                      {analysis.whatNeedsWork.map((item, index) => (
                        <li key={index} className="text-orange-800 flex items-start">
                          <ChevronRight className="h-4 w-4 mr-2 mt-0.5 text-orange-600" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {/* Top AI Recommendations */}
                <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6 mt-8">
                  <div className="font-semibold text-blue-900 mb-4 flex items-center">
                    <Brain className="h-5 w-5 mr-2" />Top AI Recommendations
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {analysis.keyRecommendations.map((recommendation, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-blue-100">
                        <div className="flex items-start">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 mt-0.5">
                            {index + 1}
                          </div>
                          <p className="text-blue-800">{recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Suggested Goal Adjustments */}
                {analysis.adjustmentSuggestions && analysis.adjustmentSuggestions.length > 0 && (
                  <div className="bg-purple-50 rounded-2xl border border-purple-200 p-6 mt-8">
                    <div className="font-semibold text-purple-900 mb-4 flex items-center">
                      <Edit3 className="h-5 w-5 mr-2" />Suggested Goal Adjustments
                    </div>
                    <div className="space-y-4">
                      {analysis.adjustmentSuggestions.map((suggestion, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-4 border border-purple-100">
                          <h4 className="font-medium text-purple-900 mb-1">{suggestion.goalName}</h4>
                          <p className="text-purple-800 mb-2">{suggestion.suggestion}</p>
                          <p className="text-sm text-purple-600 italic">{suggestion.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Your Next Steps */}
                <div className="bg-gradient-to-r from-[#FF385C] to-[#E31C5F] rounded-2xl p-6 text-white mt-8">
                  <div className="font-semibold mb-4 flex items-center">
                    <Sparkles className="h-5 w-5 mr-2" />Your Next Steps
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {analysis.nextSteps.map((step, index) => (
                      <div key={index} className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                        <div className="flex items-start">
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[#FF385C] text-xs font-bold mr-3 mt-0.5">
                            {index + 1}
                          </div>
                          <p className="text-white">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {showGoalModal && (
            <GoalEditModal
              goal={goalToEdit}
              onClose={() => setShowGoalModal(false)}
              onSaved={fetchGoals}
            />
          )}
        </div>
      </main>
      <MobileNavigation />
    </div>
  )
}
