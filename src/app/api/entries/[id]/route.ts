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
    
    const { id } = await params
    const body = await request.json()
    const { activity, description, duration, startTime, category, mood, tags } = body

    const start = new Date(startTime)
    const end = new Date(start.getTime() + duration * 60 * 1000)
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate())

    const entry = await TimeEntry.findOneAndUpdate(
      {
        _id: id,
        userId: session.user.id // Ensure user can only update their own entries
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
      { new: true }
    )

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    return NextResponse.json(entry)
  } catch (error) {
    console.error("Error updating entry:", error)
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 })
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

  try {
    await connectDB()
    
    const { id } = await params
    const deletedEntry = await TimeEntry.findOneAndDelete({
      _id: id,
      userId: session.user.id // Ensure user can only delete their own entries
    })

    if (!deletedEntry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Entry deleted" })
  } catch (error) {
    console.error("Error deleting entry:", error)
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 })
  }
}
