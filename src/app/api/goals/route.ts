import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const goals = await prisma.userGoal.findMany({
      where: {
        userId: session.user.id,
        isActive: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json(goals)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { goals } = body

    if (!Array.isArray(goals)) {
      return NextResponse.json({ error: "Goals must be an array" }, { status: 400 })
    }

    // First, deactivate all existing goals
    await prisma.userGoal.updateMany({
      where: {
        userId: session.user.id
      },
      data: {
        isActive: false
      }
    })

    // Then create new goals
    const createdGoals = await Promise.all(
      goals.map(goal => 
        prisma.userGoal.create({
          data: {
            userId: session.user.id,
            goal: goal,
            isActive: true
          }
        })
      )
    )

    return NextResponse.json(createdGoals)
  } catch (error) {
    return NextResponse.json({ error: "Failed to save goals" }, { status: 500 })
  }
}
