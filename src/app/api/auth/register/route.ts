import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/prisma"
import { User } from "@/lib/models"
import bcrypt from "bcryptjs"
import { sendNewUserNotification } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name: name || null
    })

    // Send new user notification to admin
    try {
      await sendNewUserNotification(email, name || null, 'credentials')
      console.log('✅ New user notification sent for credentials signup:', email)
    } catch (error) {
      console.error('❌ Failed to send new user notification:', error)
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.toObject()

    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
