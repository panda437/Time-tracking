import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { GET, POST, PATCH } from '@/app/api/feedback/route'
import { POST as VotePOST } from '@/app/api/feedback/vote/route'
import connectDB from '@/lib/prisma'
import { Feedback, User } from '@/lib/models'

// Mock the dependencies
jest.mock('next-auth')
jest.mock('@/lib/prisma')
jest.mock('@/lib/models')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>
const mockFeedback = Feedback as jest.Mocked<typeof Feedback>
const mockUser = User as jest.Mocked<typeof User>

describe('/api/feedback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockConnectDB.mockResolvedValue({} as any)
  })

  describe('GET', () => {
    it('should return all feedback with user data', async () => {
      const mockFeedbackData = [
        {
          _id: '1',
          title: 'Test Feature',
          description: 'Test description',
          userId: 'user1',
          upVotes: 5,
          downVotes: 1,
          createdAt: new Date(),
          toObject: () => ({
            _id: '1',
            title: 'Test Feature',
            description: 'Test description',
            userId: 'user1',
            upVotes: 5,
            downVotes: 1,
            createdAt: new Date()
          })
        }
      ]

      mockFeedback.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockFeedbackData)
        })
      } as any)

      mockUser.findById.mockResolvedValue({
        _id: 'user1',
        email: 'test@example.com',
        name: 'Test User'
      } as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('POST', () => {
    it('should require authentication', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/feedback', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test', description: 'Test desc' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should create feedback for authenticated user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user1' }
      } as any)

      const mockCreatedFeedback = {
        _id: '1',
        title: 'Test Feature',
        description: 'Test description',
        userId: 'user1',
        upVotes: 0,
        downVotes: 0
      }

      mockFeedback.create.mockResolvedValue(mockCreatedFeedback as any)

      const request = new NextRequest('http://localhost/api/feedback', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test Feature', description: 'Test description' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(mockCreatedFeedback)
    })
  })

  describe('PATCH /api/feedback (voting)', () => {
    const mockSession = {
      user: { id: 'user1', email: 'test@example.com' }
    }

    beforeEach(() => {
      mockGetServerSession.mockResolvedValue(mockSession as any)
    })

    it('should create new upvote when no existing vote', async () => {
      mockFeedback.findById.mockResolvedValue({
        _id: 'feedback1',
        upVotes: 0,
        downVotes: 0
      } as any)
      mockFeedback.updateOne.mockResolvedValue({
        _id: 'feedback1',
        upVotes: 1,
        downVotes: 0
      } as any)

      const request = new NextRequest('http://localhost:3000/api/feedback', {
        method: 'PATCH',
        body: JSON.stringify({
          feedbackId: 'feedback1',
          isUpvote: true
        })
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.action).toBe('added')
      expect(data.voteType).toBe('upvote')
    })

    it('should create new downvote when no existing vote', async () => {
      mockFeedback.findById.mockResolvedValue({
        _id: 'feedback1',
        upVotes: 0,
        downVotes: 0
      } as any)
      mockFeedback.updateOne.mockResolvedValue({
        _id: 'feedback1',
        upVotes: 0,
        downVotes: 1
      } as any)

      const request = new NextRequest('http://localhost:3000/api/feedback', {
        method: 'PATCH',
        body: JSON.stringify({
          feedbackId: 'feedback1',
          isUpvote: false
        })
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.action).toBe('added')
      expect(data.voteType).toBe('downvote')
    })

    it('should remove vote when same vote type exists', async () => {
      const existingVote = {
        _id: 'vote1',
        userId: 'user1',
        feedbackId: 'feedback1',
        isUpvote: true
      }

      mockFeedback.findById.mockResolvedValue({
        _id: 'feedback1',
        upVotes: 1,
        downVotes: 0
      } as any)
      mockFeedback.updateOne.mockResolvedValue({
        _id: 'feedback1',
        upVotes: 0,
        downVotes: 0
      } as any)

      const request = new NextRequest('http://localhost:3000/api/feedback', {
        method: 'PATCH',
        body: JSON.stringify({
          feedbackId: 'feedback1',
          isUpvote: true
        })
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.action).toBe('removed')
      expect(data.voteType).toBe('upvote')
    })

    it('should update vote when different vote type exists', async () => {
      const existingVote = {
        _id: 'vote1',
        userId: 'user1',
        feedbackId: 'feedback1',
        isUpvote: false
      }

      mockFeedback.findById.mockResolvedValue({
        _id: 'feedback1',
        upVotes: 1,
        downVotes: 0
      } as any)
      mockFeedback.updateOne.mockResolvedValue({
        _id: 'feedback1',
        upVotes: 0,
        downVotes: 1
      } as any)

      const request = new NextRequest('http://localhost:3000/api/feedback', {
        method: 'PATCH',
        body: JSON.stringify({
          feedbackId: 'feedback1',
          isUpvote: true
        })
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.action).toBe('updated')
      expect(data.voteType).toBe('upvote')
    })

    it('should return 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/feedback', {
        method: 'PATCH',
        body: JSON.stringify({
          feedbackId: 'feedback1',
          isUpvote: true
        })
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 when feedbackId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/feedback', {
        method: 'PATCH',
        body: JSON.stringify({
          isUpvote: true
        })
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Feedback ID required')
    })

    it('should return 400 when isUpvote is not boolean', async () => {
      const request = new NextRequest('http://localhost:3000/api/feedback', {
        method: 'PATCH',
        body: JSON.stringify({
          feedbackId: 'feedback1',
          isUpvote: 'true' // string instead of boolean
        })
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('isUpvote must be boolean')
    })
  })

  describe('POST /api/feedback/vote', () => {
    const mockSession = {
      user: { id: 'user1', email: 'test@example.com' }
    }

    beforeEach(() => {
      mockGetServerSession.mockResolvedValue(mockSession as any)
    })

    it('should handle voting with error handling', async () => {
      mockFeedback.findById.mockResolvedValue({
        _id: 'feedback1',
        upVotes: 0,
        downVotes: 0
      } as any)
      mockFeedback.updateOne.mockResolvedValue({
        _id: 'feedback1',
        upVotes: 1,
        downVotes: 0
      } as any)

      const request = new NextRequest('http://localhost:3000/api/feedback/vote', {
        method: 'POST',
        body: JSON.stringify({
          feedbackId: 'feedback1',
          isUpvote: true
        })
      })

      const response = await VotePOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.action).toBe('added')
      expect(data.voteType).toBe('upvote')
    })

    it('should handle database errors in vote route', async () => {
      mockFeedback.findById.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/feedback/vote', {
        method: 'POST',
        body: JSON.stringify({
          feedbackId: 'feedback1',
          isUpvote: true
        })
      })

      const response = await VotePOST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to process vote')
    })
  })
})
