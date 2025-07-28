import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/prisma"
import { UserGoal, TimeEntry } from "@/lib/models"

// Create or update default time entry goal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log("No session or user ID found in default-time-entry POST request")
      return NextResponse.json({ error: "Unauthorized - No valid session" }, { status: 401 })
    }

    await connectDB()
    
    // Check if user already has a default time entry goal
    const existingGoal = await UserGoal.findOne({
      userId: session.user.id,
      goal: "Make Time Entries",
      isActive: true
    })

    // Count user's time entries
    const entryCount = await TimeEntry.countDocuments({
      userId: session.user.id
    })

    if (existingGoal) {
      // Update existing goal
      const updatedGoal = await UserGoal.findByIdAndUpdate(
        existingGoal._id,
        {
          currentValue: entryCount,
          isCompleted: entryCount >= existingGoal.targetValue,
          completedAt: entryCount >= existingGoal.targetValue ? new Date() : undefined
        },
        { new: true }
      )

      // If goal is completed, archive it and create new one
      if (entryCount >= existingGoal.targetValue && !existingGoal.isCompleted) {
        await UserGoal.findByIdAndUpdate(existingGoal._id, {
          isArchived: true,
          archivedAt: new Date(),
          isActive: false
        })

        // Create new goal with higher target
        const newTarget = existingGoal.targetValue === 24 ? 100 : existingGoal.targetValue + 100
        await UserGoal.create({
          userId: session.user.id,
          goal: "Make Time Entries",
          targetValue: newTarget,
          currentValue: entryCount,
          unit: "entries",
          isActive: true,
          isRefined: true,
          goalType: "habit"
        })
      }

      return NextResponse.json({ success: true, goal: updatedGoal })
    } else {
      // Create new default goal
      const newGoal = await UserGoal.create({
        userId: session.user.id,
        goal: "Make Time Entries",
        targetValue: 24,
        currentValue: entryCount,
        unit: "entries",
        isActive: true,
        isRefined: true,
        goalType: "habit"
      })

      return NextResponse.json({ success: true, goal: newGoal })
    }
  } catch (error) {
    console.error("Error managing default time entry goal:", error)
    return NextResponse.json({ 
      error: "Failed to manage default time entry goal", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

// Get current default time entry goal status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log("No session or user ID found in default-time-entry GET request")
      return NextResponse.json({ error: "Unauthorized - No valid session" }, { status: 401 })
    }

    await connectDB()
    
    const goal = await UserGoal.findOne({
      userId: session.user.id,
      goal: "Make Time Entries",
      isActive: true
    })

    const entryCount = await TimeEntry.countDocuments({
      userId: session.user.id
    })

    return NextResponse.json({ 
      success: true, 
      goal,
      entryCount
    })
  } catch (error) {
    console.error("Error fetching default time entry goal:", error)
    return NextResponse.json({ 
      error: "Failed to fetch default time entry goal", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
} 