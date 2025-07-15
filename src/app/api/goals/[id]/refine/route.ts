import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/prisma"
import { UserGoal } from "@/lib/models"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await connectDB()
    
    const resolvedParams = await params
    const { id } = resolvedParams
    const body = await request.json()
    
    const {
      specificGoal,
      measurableOutcome,
      targetValue,
      currentValue,
      unit,
      deadline,
      relatedCategories,
      specificActivities,
      excludedActivities,
      goalType,
      milestones,
      isRefined
    } = body

    // Update the goal with SMART goal fields
    const updatedGoal = await UserGoal.findOneAndUpdate(
      { 
        _id: id, 
        userId: session.user.id 
      },
      {
        specificGoal,
        measurableOutcome,
        targetValue: parseFloat(targetValue) || 0,
        currentValue: parseFloat(currentValue) || 0,
        unit,
        deadline: deadline ? new Date(deadline) : null,
        relatedCategories: Array.isArray(relatedCategories) ? relatedCategories : [],
        specificActivities: Array.isArray(specificActivities) ? specificActivities.filter(a => a.trim()) : [],
        excludedActivities: Array.isArray(excludedActivities) ? excludedActivities.filter(a => a.trim()) : [],
        goalType: goalType || 'other',
        milestones: Array.isArray(milestones) ? milestones.map(m => ({
          description: m.description,
          targetValue: parseFloat(m.targetValue) || 0,
          targetDate: new Date(m.targetDate),
          completed: Boolean(m.completed),
          completedDate: m.completedDate ? new Date(m.completedDate) : undefined
        })) : [],
        isRefined: Boolean(isRefined)
      },
      {
        new: true
      }
    )

    if (!updatedGoal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      goal: updatedGoal
    })
    
  } catch (error) {
    console.error("Error refining goal:", error)
    return NextResponse.json({ 
      error: "Failed to refine goal", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

// Update goal progress
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await connectDB()
    
    const resolvedParams = await params
    const { id } = resolvedParams
    const body = await request.json()
    
    const { currentValue, milestoneUpdates } = body

    const updates: any = {}
    
    if (typeof currentValue === 'number') {
      updates.currentValue = currentValue
    }

    if (Array.isArray(milestoneUpdates)) {
      const goal = await UserGoal.findOne({ _id: id, userId: session.user.id })
      if (goal && goal.milestones) {
        const updatedMilestones = goal.milestones.map((milestone: any, index: number) => {
          const update = milestoneUpdates.find((u: any) => u.index === index)
          if (update) {
            return {
              ...milestone,
              completed: update.completed,
              completedDate: update.completed ? new Date() : undefined
            }
          }
          return milestone
        })
        updates.milestones = updatedMilestones
      }
    }

    const updatedGoal = await UserGoal.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      updates,
      { new: true }
    )

    if (!updatedGoal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      goal: updatedGoal
    })
    
  } catch (error) {
    console.error("Error updating goal progress:", error)
    return NextResponse.json({ 
      error: "Failed to update goal progress", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
} 