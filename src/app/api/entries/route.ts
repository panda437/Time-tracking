import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/prisma"
import { TimeEntry, User } from "@/lib/models"
import { trackUserTaskMilestone } from "@/lib/analytics"
import { subMinutes, startOfWeek, endOfWeek } from "date-fns"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const period = searchParams.get("period") || "week"
  const dateParam = searchParams.get("date")
  const startParam = searchParams.get("start")
  const endParam = searchParams.get("end")
  
  let startDate: Date
  let endDate: Date
  
  const now = new Date()
  
  // Date range override via ?start=YYYY-MM-DD&end=YYYY-MM-DD
  if (startParam) {
    const start = new Date(startParam)
    if (isNaN(start.getTime())) {
      return NextResponse.json({ error: "Invalid start date format" }, { status: 400 })
    }
    const end = endParam ? new Date(endParam) : start
    if (isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid end date format" }, { status: 400 })
    }
    startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    // include the full end day by adding 1 day
    endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1)

  // If specific date is provided, fetch entries for that day
  } else if (dateParam) {
    const targetDate = new Date(dateParam)
    startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
    endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1)
  } else if (period === "today") {
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
    await connectDB()
    
    const entries = await TimeEntry.find({
      userId: session.user.id,
      startTime: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ startTime: -1 })

    // Transform MongoDB documents to have 'id' instead of '_id'
    const transformedEntries = entries.map(entry => ({
      id: entry._id.toString(),
      activity: entry.activity,
      description: entry.description,
      duration: entry.duration,
      startTime: entry.startTime.toISOString(),
      endTime: entry.endTime.toISOString(),
      category: entry.category,
      mood: entry.mood,
      tags: entry.tags ? JSON.parse(entry.tags) : []
    }))

    return NextResponse.json(transformedEntries)
  } catch (error) {
    console.error("Error fetching entries:", error)
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 })
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
    console.log("Request body:", body)
    console.log("Session user ID:", session.user.id)
    
    // Check if user exists in database, create if not
    let user = await User.findOne({ _id: session.user.id })
    
    if (!user) {
      console.log("User doesn't exist, creating...")
      // Create user record if it doesn't exist
      user = await User.create({
        _id: session.user.id,
        email: session.user.email || '',
        name: session.user.name || '',
        password: '' // Empty since this is OAuth/session based
      })
      console.log("User created successfully")
    }
    console.log("User exists in DB:", !!user)
    
    const { activity, description, duration, startTime, category, mood, tags } = body

    if (!activity || !duration || !startTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const start = new Date(startTime)
    const end = new Date(start.getTime() + duration * 60 * 1000)
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate())

    const entry = await TimeEntry.create({
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
    })

    // Transform MongoDB document to have 'id' instead of '_id'
    const transformedEntry = {
      id: entry._id.toString(),
      activity: entry.activity,
      description: entry.description,
      duration: entry.duration,
      startTime: entry.startTime.toISOString(),
      endTime: entry.endTime.toISOString(),
      category: entry.category,
      mood: entry.mood,
      tags: entry.tags ? JSON.parse(entry.tags) : []
    }

    // Track task milestone for analytics (async, don't wait)
    try {
      const totalTaskCount = await TimeEntry.countDocuments({ userId: session.user.id })
      trackUserTaskMilestone(session.user.id, totalTaskCount).catch(console.error)
    } catch (error) {
      console.error('Error tracking task milestone:', error)
    }

    return NextResponse.json(transformedEntry)
  } catch (error) {
    console.error("Error creating entry:", error)
    return NextResponse.json({ 
      error: "Failed to create entry", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}
