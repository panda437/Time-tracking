import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/prisma"
import { User } from "@/lib/models"

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await connectDB()
    
    // Try a simple query
    const userCount = await User.countDocuments()
    
    return NextResponse.json({ 
      status: "success", 
      message: "Database connected successfully",
      userCount,
      environment: {
        hasMongodbUri: !!process.env.MONGODB_URI,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nodeEnv: process.env.NODE_ENV
      }
    })
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json({ 
      status: "error", 
      message: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
