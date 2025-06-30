import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/prisma"
import { Feedback, FeedbackVote, User } from "@/lib/models"

export async function GET() {
  try {
    await connectDB()
    
    const feedback = await Feedback.find({})
      .sort({ createdAt: -1 })

    // Manually populate user data and votes since we need to fetch from separate collections
    const feedbackWithUsers = await Promise.all(
      feedback.map(async (item) => {
        const user = await User.findById(item.userId).select('_id email name')
        const votes = await FeedbackVote.find({ feedbackId: item._id })
        
        // Get user details for each vote
        const votesWithUsers = await Promise.all(
          votes.map(async (vote) => {
            const voteUser = await User.findById(vote.userId).select('email')
            return {
              user_email: voteUser?.email,
              is_upvote: vote.isUpvote
            }
          })
        )
        
        return {
          id: item._id.toString(), // Transform _id to id
          title: item.title,
          description: item.description,
          upvotes: item.upVotes || 0, // Transform upVotes to upvotes
          downvotes: item.downVotes || 0,
          created_at: item.createdAt,
          user_email: user?.email,
          feedback_votes: votesWithUsers
        }
      })
    )

    return NextResponse.json(feedbackWithUsers)
  } catch (error) {
    console.error("Error fetching feedback:", error)
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    await connectDB()
    
    const { title, description } = await req.json()
    if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 })

    const item = await Feedback.create({
      userId: session.user.id,
      title,
      description
    })
    
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error("Error creating feedback:", error)
    return NextResponse.json({ error: "Failed to create feedback" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    await connectDB()
    
    const { feedbackId, isUpvote } = await req.json()
    if (!feedbackId) return NextResponse.json({ error: "Feedback ID required" }, { status: 400 })
    if (typeof isUpvote !== "boolean") return NextResponse.json({ error: "isUpvote must be boolean" }, { status: 400 })

    const userId = session.user.id

    // Check if user already voted on this feedback
    const existingVote = await FeedbackVote.findOne({
      userId,
      feedbackId
    })

    if (existingVote) {
      if (existingVote.isUpvote === isUpvote) {
        // Same vote type - remove the vote (toggle off)
        await FeedbackVote.deleteOne({ _id: existingVote._id })
        
        const updateField = existingVote.isUpvote ? { upVotes: -1 } : { downVotes: -1 }
        await Feedback.updateOne(
          { _id: feedbackId },
          { $inc: updateField }
        )
        
        return NextResponse.json({ action: "removed", voteType: isUpvote ? "upvote" : "downvote" })
      } else {
        // Different vote type - update the vote
        await FeedbackVote.updateOne(
          { _id: existingVote._id },
          { isUpvote }
        )
        
        const updateField = isUpvote 
          ? { upVotes: 1, downVotes: -1 }
          : { upVotes: -1, downVotes: 1 }
        await Feedback.updateOne(
          { _id: feedbackId },
          { $inc: updateField }
        )
        
        return NextResponse.json({ action: "updated", voteType: isUpvote ? "upvote" : "downvote" })
      }
    } else {
      // No existing vote - create new vote
      await FeedbackVote.create({
        userId,
        feedbackId,
        isUpvote
      })
      
      const updateField = isUpvote ? { upVotes: 1 } : { downVotes: 1 }
      await Feedback.updateOne(
        { _id: feedbackId },
        { $inc: updateField }
      )
      
      return NextResponse.json({ action: "added", voteType: isUpvote ? "upvote" : "downvote" })
    }
  } catch (error) {
    console.error("Error updating feedback vote:", error)
    return NextResponse.json({ error: "Failed to update vote" }, { status: 500 })
  }
}
