import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/prisma"
import { TimeEntry } from "@/lib/models"

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
    
    const { activity, description, duration, startTime, endTime, category, mood, tags } = body

    if (!activity || !duration || !startTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date(start.getTime() + duration * 60 * 1000)
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate())

    const updatedEntry = await TimeEntry.findOneAndUpdate(
      { 
        _id: id, 
        userId: session.user.id 
      },
      {
        activity,
        description: description || "",
        duration: parseInt(duration),
        startTime: start,
        endTime: end,
        date: date,
        category: category || "general",
        mood: mood || null,
        tags: JSON.stringify(tags || [])
      },
      {
        new: true
      }
    )

    if (!updatedEntry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    // Transform MongoDB document to have 'id' instead of '_id'
    const transformedEntry = {
      id: updatedEntry._id.toString(),
      activity: updatedEntry.activity,
      description: updatedEntry.description,
      duration: updatedEntry.duration,
      startTime: updatedEntry.startTime.toISOString(),
      endTime: updatedEntry.endTime.toISOString(),
      category: updatedEntry.category,
      mood: updatedEntry.mood,
      tags: updatedEntry.tags ? JSON.parse(updatedEntry.tags) : []
    }

    return NextResponse.json(transformedEntry)
  } catch (error) {
    console.error("Error updating entry:", error)
    return NextResponse.json({ 
      error: "Failed to update entry", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const resolvedParams = await params
  const { id } = resolvedParams

  try {
    await connectDB()

    // Validate ID
    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json({ 
        error: "Invalid entry ID", 
        details: `Received ID: ${id}` 
      }, { status: 400 })
    }

    const deletedEntry = await TimeEntry.findOneAndDelete({
      _id: id,
      userId: session.user.id
    })

    if (!deletedEntry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Entry deleted successfully" })
  } catch (error) {
    console.error("Error deleting entry:", error)
    return NextResponse.json({ 
      error: "Failed to delete entry", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}
