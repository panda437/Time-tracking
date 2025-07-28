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
    
    const archivedGoals = await UserGoal.find({
      userId: session.user.id,
      isArchived: true
    }).sort({ archivedAt: -1 })

    return NextResponse.json(archivedGoals)
  } catch (error) {
    console.error("Error fetching archived goals:", error)
    return NextResponse.json({ error: "Failed to fetch archived goals" }, { status: 500 })
  }
} 