import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/prisma"
import { User } from "@/lib/models"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { categories } = await request.json()
    
    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json({ error: "Invalid categories data" }, { status: 400 })
    }

    console.log(`Saving categories for user ID ${session.user.id}:`, categories)

    await connectDB()

    // Save user categories using user ID
    const result = await User.findByIdAndUpdate(
      session.user.id,
      { 
        timeCategories: categories,
        hasCompletedOnboarding: true
      },
      { new: true }
    )

    if (!result) {
      console.error(`User with ID ${session.user.id} not found`)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log(`Categories saved successfully for user ID ${session.user.id}:`, result.timeCategories)

    return NextResponse.json({ success: true, categories })
  } catch (error) {
    console.error("Error saving user categories:", error)
    return NextResponse.json({ error: "Failed to save categories" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`Fetching categories for user ID ${session.user.id}`)

    await connectDB()

    const user = await User.findById(session.user.id, { timeCategories: 1 })

    if (!user) {
      console.error(`User with ID ${session.user.id} not found`)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const categories = user.timeCategories || [
      "Work", "Personal", "Health", "Education", "Social", "Fun", "Side Project", "Other"
    ]

    console.log(`Categories fetched for user ID ${session.user.id}:`, categories)

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Error fetching user categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
} 