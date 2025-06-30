import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/prisma"
import { UserGoal } from "@/lib/models"

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await connectDB()
    
    const goals = await UserGoal.find({
      userId: session.user.id,
      isActive: true
    }).sort({ createdAt: 1 })

    return NextResponse.json(goals)
  } catch (error) {
    console.error("Error fetching goals:", error)
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await connectDB()
    
    const body = await request.json()
    const { goals } = body

    if (!Array.isArray(goals)) {
      return NextResponse.json({ error: "Goals must be an array" }, { status: 400 })
    }

    // First, deactivate all existing goals
    await UserGoal.updateMany(
      { userId: session.user.id },
      { isActive: false }
    )

    // Then create new goals
    const createdGoals = await Promise.all(
      goals.map(goal => 
        UserGoal.create({
          userId: session.user.id,
          goal: goal,
          isActive: true
        })
      )
    )

    return NextResponse.json(createdGoals)
  } catch (error) {
    console.error("Error saving goals:", error)
    return NextResponse.json({ error: "Failed to save goals" }, { status: 500 })
  }
}
