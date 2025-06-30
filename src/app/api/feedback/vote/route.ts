import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/prisma"
import { Feedback, FeedbackVote } from "@/lib/models"

export async function POST(req: NextRequest) {
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
    console.error("Error voting on feedback:", error)
    return NextResponse.json({ error: "Failed to process vote" }, { status: 500 })
  }
}
