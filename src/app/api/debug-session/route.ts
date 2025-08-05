import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/prisma"
import { User } from "@/lib/models"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log("🔍 Debug Session - Full session object:", JSON.stringify(session, null, 2))
    
    if (!session?.user) {
      return NextResponse.json({ 
        error: "No session found",
        session: null 
      })
    }

    console.log("🔍 Debug Session - User object:", JSON.stringify(session.user, null, 2))

    await connectDB()

    // Try to find user by email
    const userByEmail = await User.findOne({ email: session.user.email })
    console.log("🔍 Debug Session - User by email:", userByEmail ? {
      _id: userByEmail._id,
      email: userByEmail.email,
      timeCategories: userByEmail.timeCategories
    } : "Not found")

    // Try to find user by ID
    const userById = session.user.id ? await User.findById(session.user.id) : null
    console.log("🔍 Debug Session - User by ID:", userById ? {
      _id: userById._id,
      email: userById.email,
      timeCategories: userById.timeCategories
    } : "Not found")

    return NextResponse.json({
      session: {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name
        }
      },
      database: {
        userByEmail: userByEmail ? {
          _id: userByEmail._id,
          email: userByEmail.email,
          timeCategories: userByEmail.timeCategories
        } : null,
        userById: userById ? {
          _id: userById._id,
          email: userById.email,
          timeCategories: userById.timeCategories
        } : null
      }
    })
  } catch (error) {
    console.error("Error in debug session:", error)
    return NextResponse.json({ error: "Failed to debug session" }, { status: 500 })
  }
} 