import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/prisma"
import { TimeEntry, User, UserGoal } from "@/lib/models"
import { trackUserTaskMilestone } from "@/lib/analytics"
import { subMinutes, startOfWeek, endOfWeek } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log("No session or user ID found in entries GET request")
      return NextResponse.json({ error: "Unauthorized - No valid session" }, { status: 401 })
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
    } else if (period === "all") {
      // Fetch all entries for the user (no date filter)
      startDate = new Date(0) // Beginning of time
      endDate = new Date(8640000000000000) // End of time (max safe date)
    } else {
      // Default to last 7 days
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      endDate = now
    }

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
    return NextResponse.json({ 
      error: "Failed to fetch entries", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log("No session or user ID found in entries POST request")
      return NextResponse.json({ error: "Unauthorized - No valid session" }, { status: 401 })
    }

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

    // Update default time entry goal (async, don't wait)
    try {
      const existingGoal = await UserGoal.findOne({
        userId: session.user.id,
        goal: "Make Time Entries",
        isActive: true
      })

      if (existingGoal) {
        const totalEntries = await TimeEntry.countDocuments({ userId: session.user.id })
        
        // Update current value
        await UserGoal.findByIdAndUpdate(existingGoal._id, {
          currentValue: totalEntries,
          isCompleted: totalEntries >= existingGoal.targetValue,
          completedAt: totalEntries >= existingGoal.targetValue ? new Date() : undefined
        })

        // If goal is completed, archive it and create new one
        if (totalEntries >= existingGoal.targetValue && !existingGoal.isCompleted) {
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
            currentValue: totalEntries,
            unit: "entries",
            isActive: true,
            isRefined: true,
            goalType: "habit"
          })
        }
      }
    } catch (error) {
      console.error('Error updating default time entry goal:', error)
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
