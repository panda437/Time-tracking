import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/prisma"
import { UserGoal } from "@/lib/models"

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
    
    const { action } = body

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    const updates: any = {}
    const now = new Date()

    switch (action) {
      case 'mark_done':
        updates.isCompleted = true
        updates.completedAt = now
        updates.isActive = false
        break
        
      case 'archive':
        updates.isArchived = true
        updates.archivedAt = now
        updates.isActive = false
        break
        
      case 'unarchive':
        updates.isArchived = false
        updates.archivedAt = undefined
        updates.isActive = true
        break
        
      case 'reactivate':
        updates.isCompleted = false
        updates.completedAt = undefined
        updates.isActive = true
        break
        
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const updatedGoal = await UserGoal.findOneAndUpdate(
      { 
        _id: id, 
        userId: session.user.id 
      },
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
    console.error("Error updating goal:", error)
    return NextResponse.json({ 
      error: "Failed to update goal", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
} 