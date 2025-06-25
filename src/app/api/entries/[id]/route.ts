import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { activity, description, duration, startTime, category, mood, tags } = body

    const start = new Date(startTime)
    const end = new Date(start.getTime() + duration * 60 * 1000)
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate())

    const entry = await prisma.timeEntry.update({
      where: {
        id: params.id,
        userId: session.user.id // Ensure user can only update their own entries
      },
      data: {
        activity,
        description: description || "",
        duration: parseInt(duration),
        startTime: start,
        endTime: end,
        date: date,
        category: category || "general",
        mood: mood || null,
        tags: tags || []
      }
    })

    return NextResponse.json(entry)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await prisma.timeEntry.delete({
      where: {
        id: params.id,
        userId: session.user.id // Ensure user can only delete their own entries
      }
    })

    return NextResponse.json({ message: "Entry deleted" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 })
  }
}
