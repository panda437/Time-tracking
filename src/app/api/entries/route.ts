import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { subMinutes, startOfWeek, endOfWeek } from "date-fns"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const period = searchParams.get("period") || "week"
  
  let startDate: Date
  let endDate: Date
  
  const now = new Date()
  
  if (period === "today") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  } else if (period === "week") {
    startDate = startOfWeek(now, { weekStartsOn: 1 })
    endDate = endOfWeek(now, { weekStartsOn: 1 })
  } else {
    // Default to last 7 days
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    endDate = now
  }

  try {
    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: session.user.id,
        startTime: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        startTime: "desc"
      }
    })

    return NextResponse.json(entries)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { activity, description, duration, startTime, category, mood, tags } = body

    if (!activity || !duration || !startTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const start = new Date(startTime)
    const end = new Date(start.getTime() + duration * 60 * 1000)
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate())

    const entry = await prisma.timeEntry.create({
      data: {
        userId: session.user.id,
        activity,
        description: description || "",
        duration: parseInt(duration),
        startTime: start,
        endTime: end,
        date: date,
        category: category || "general",
        mood: mood || null,
        tags: JSON.stringify(tags || [])
      }
    })

    return NextResponse.json(entry)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 })
  }
}
