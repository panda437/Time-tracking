import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/prisma"
import { DayReflection } from "@/lib/models"
import { format } from "date-fns"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get("date")
  
  if (!dateParam) {
    return NextResponse.json({ error: "Date parameter is required" }, { status: 400 })
  }

  try {
    await connectDB()
    
    const reflection = await DayReflection.findOne({
      userId: session.user.id,
      date: new Date(dateParam)
    })

    return NextResponse.json(reflection)
  } catch (error) {
    console.error("Error fetching reflection:", error)
    return NextResponse.json({ error: "Failed to fetch reflection" }, { status: 500 })
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
    const { date, reflection, rating, highlights, improvements, gratitude } = body

    if (!date || !reflection || rating === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Convert date string to Date object
    const reflectionDate = new Date(date)

    // Use upsert to update if exists, create if not
    const savedReflection = await DayReflection.findOneAndUpdate(
      {
        userId: session.user.id,
        date: reflectionDate
      },
      {
        userId: session.user.id,
        date: reflectionDate,
        reflection,
        rating: parseInt(rating),
        highlights: highlights || [],
        improvements: improvements || [],
        gratitude: gratitude || ""
      },
      {
        new: true,
        upsert: true
      }
    )

    return NextResponse.json(savedReflection)
  } catch (error) {
    console.error("Error saving reflection:", error)
    return NextResponse.json({ 
      error: "Failed to save reflection", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
} 