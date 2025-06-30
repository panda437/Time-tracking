import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/prisma"
import { Feedback, FeedbackVote } from "@/lib/models"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const resolvedParams = await params
    const feedbackId = resolvedParams.id
    const userId = session.user.id
    const body = await request.json()
    const { isUpvote } = body

    if (typeof isUpvote !== "boolean") {
      return NextResponse.json({ error: "isUpvote must be boolean" }, { status: 400 })
    }

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
        
        return NextResponse.json({ action: "unvoted" })
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
        
        return NextResponse.json({ action: "vote_changed" })
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
      
      return NextResponse.json({ action: "voted" })
    }
  } catch (error) {
    console.error('Error voting on feedback:', error)
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 })
  }
}
