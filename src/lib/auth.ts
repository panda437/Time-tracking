import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import connectDB from "./prisma"
import { User } from "./models"
import bcrypt from "bcryptjs"
import { sendNewUserNotification } from "./email"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          await connectDB()

          const user = await User.findOne({
            email: credentials.email
          })

          if (!user || !user.password) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
          }
        } catch (error) {
          console.error("Error in authorize callback:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin"
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          await connectDB()
          
          // Check if user exists in database
          const existingUser = await User.findOne({ email: user.email! })
          
          if (!existingUser) {
            // Create new user for Google OAuth - don't include password field
            await User.create({
              email: user.email!,
              name: user.name || "",
              // No password field for OAuth users
            })
            
            // Send new user notification to admin
            try {
              await sendNewUserNotification(user.email!, user.name || null, 'google')
              console.log('✅ New user notification sent for Google OAuth signup:', user.email)
            } catch (error) {
              console.error('❌ Failed to send new user notification:', error)
            }
          }
          return true
        } catch (error) {
          console.error("Error creating user:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      // When user signs in, get their database ID
      if (account && user) {
        try {
          await connectDB()
          
          const dbUser = await User.findOne({ email: user.email! })
          if (dbUser) {
            token.sub = dbUser._id.toString() // Set the database user ID as the token subject
          }
        } catch (error) {
          console.error("Error fetching user from database:", error)
        }
      }
      
      // Ensure token.sub exists for session callback
      if (!token.sub && token.email) {
        try {
          await connectDB()
          const dbUser = await User.findOne({ email: token.email })
          if (dbUser) {
            token.sub = dbUser._id.toString()
          }
        } catch (error) {
          console.error("Error fetching user ID for token:", error)
        }
      }
      
      return token
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/dashboard`
    },
    session: ({ session, token }) => {
      if (!token.sub) {
        console.error("No user ID found in token:", token)
        return session
      }
      
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub, // This will now be the database user ID
        },
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
}
