/**
 * Integration tests for API endpoints
 * Tests actual API behavior including authentication and database interactions
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { GET as FeedbackGET, POST as FeedbackPOST, PATCH as FeedbackPATCH } from '@/app/api/feedback/route'
import { POST as FeedbackVotePOST } from '@/app/api/feedback/vote/route'
import { GET as EntriesGET, POST as EntriesePOST } from '@/app/api/entries/route'
import { GET as AnalyticsGET } from '@/app/api/analytics/route'

// Mock external dependencies
jest.mock('next-auth')
jest.mock('@/lib/prisma')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Feedback API Integration', () => {
    describe('GET /api/feedback', () => {
      it('should return 200 and empty array when no feedback exists', async () => {
        const { prisma } = require('@/lib/prisma')
        prisma.feedback.findMany.mockResolvedValue([])

        const response = await FeedbackGET()
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBe(0)
      })

      it('should return 200 and feedback data when feedback exists', async () => {
        const mockFeedback = [
          {
            id: 'test-id',
            title: 'Test Feedback',
            description: 'Test Description',
            upVotes: 0,
            downVotes: 0,
            createdAt: new Date(),
            user: { id: 'user1', name: 'Test User' },
            votes: []
          }
        ]

        const { prisma } = require('@/lib/prisma')
        prisma.feedback.findMany.mockResolvedValue(mockFeedback)

        const response = await FeedbackGET()
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toEqual(mockFeedback)
      })
    })

    describe('POST /api/feedback', () => {
      it('should create feedback with valid session and data', async () => {
        const mockSession = { user: { id: 'user1' } }
        const mockCreatedFeedback = {
          id: 'new-feedback-id',
          userId: 'user1',
          title: 'New Feedback',
          description: 'New Description'
        }

        mockGetServerSession.mockResolvedValue(mockSession as any)
        
        const { prisma } = require('@/lib/prisma')
        prisma.feedback.create.mockResolvedValue(mockCreatedFeedback)

        const request = new NextRequest('http://localhost:3002/api/feedback', {
          method: 'POST',
          body: JSON.stringify({
            title: 'New Feedback',
            description: 'New Description'
          })
        })

        const response = await FeedbackPOST(request)
        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data).toEqual(mockCreatedFeedback)
      })

      it('should return 401 without valid session', async () => {
        mockGetServerSession.mockResolvedValue(null)

        const request = new NextRequest('http://localhost:3002/api/feedback', {
          method: 'POST',
          body: JSON.stringify({
            title: 'New Feedback',
            description: 'New Description'
          })
        })

        const response = await FeedbackPOST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Unauthorized')
      })
    })

    describe('Feedback Voting', () => {
      it('should handle upvote with valid session', async () => {
        const mockSession = { user: { id: 'user1' } }
        mockGetServerSession.mockResolvedValue(mockSession as any)

        const { prisma } = require('@/lib/prisma')
        prisma.feedbackVote.findUnique.mockResolvedValue(null)
        prisma.$transaction.mockResolvedValue([{}, {}])

        const request = new NextRequest('http://localhost:3002/api/feedback', {
          method: 'PATCH',
          body: JSON.stringify({
            feedbackId: 'feedback-id',
            isUpvote: true
          })
        })

        const response = await FeedbackPATCH(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.action).toBe('added')
        expect(data.voteType).toBe('upvote')
      })

      it('should handle voting via vote endpoint', async () => {
        const mockSession = { user: { id: 'user1' } }
        mockGetServerSession.mockResolvedValue(mockSession as any)

        const { prisma } = require('@/lib/prisma')
        prisma.feedbackVote.findUnique.mockResolvedValue(null)
        prisma.$transaction.mockResolvedValue([{}, {}])

        const request = new NextRequest('http://localhost:3002/api/feedback/vote', {
          method: 'POST',
          body: JSON.stringify({
            feedbackId: 'feedback-id',
            isUpvote: false
          })
        })

        const response = await FeedbackVotePOST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.action).toBe('added')
        expect(data.voteType).toBe('downvote')
      })
    })
  })

  describe('Entries API Integration', () => {
    describe('GET /api/entries', () => {
      it('should return 200 with valid session', async () => {
        const mockSession = { user: { id: 'user1' } }
        mockGetServerSession.mockResolvedValue(mockSession as any)

        const { prisma } = require('@/lib/prisma')
        prisma.timeEntry.findMany.mockResolvedValue([])

        const request = new NextRequest('http://localhost:3002/api/entries')
        const response = await EntriesGET(request)

        expect(response.status).toBe(200)
      })

      it('should return 401 without valid session', async () => {
        mockGetServerSession.mockResolvedValue(null)

        const request = new NextRequest('http://localhost:3002/api/entries')
        const response = await EntriesGET(request)

        expect(response.status).toBe(401)
      })
    })

    describe('POST /api/entries', () => {
      it('should create entry with valid session and data', async () => {
        const mockSession = { user: { id: 'user1', email: 'test@example.com' } }
        const mockUser = { id: 'user1', email: 'test@example.com' }
        const mockEntry = {
          id: 'entry1',
          userId: 'user1',
          activity: 'Test Activity',
          duration: 60,
          startTime: new Date(),
          endTime: new Date()
        }

        mockGetServerSession.mockResolvedValue(mockSession as any)

        const { prisma } = require('@/lib/prisma')
        prisma.user.findUnique.mockResolvedValue(mockUser)
        prisma.timeEntry.create.mockResolvedValue(mockEntry)

        const request = new NextRequest('http://localhost:3002/api/entries', {
          method: 'POST',
          body: JSON.stringify({
            activity: 'Test Activity',
            duration: 60,
            startTime: new Date().toISOString(),
            category: 'work'
          })
        })

        const response = await EntriesePOST(request)

        expect(response.status).toBe(200)
      })
    })
  })

  describe('Analytics API Integration', () => {
    describe('GET /api/analytics', () => {
      it('should return 200 with valid session', async () => {
        const mockSession = { user: { id: 'user1' } }
        mockGetServerSession.mockResolvedValue(mockSession as any)

        const { prisma } = require('@/lib/prisma')
        prisma.timeEntry.findMany.mockResolvedValue([])

        const request = new NextRequest('http://localhost:3002/api/analytics?period=30d')
        const response = await AnalyticsGET(request)

        expect(response.status).toBe(200)
      })

      it('should return 401 without valid session', async () => {
        mockGetServerSession.mockResolvedValue(null)

        const request = new NextRequest('http://localhost:3002/api/analytics')
        const response = await AnalyticsGET(request)

        expect(response.status).toBe(401)
      })

      it('should return analytics data structure with valid session', async () => {
        const mockSession = { user: { id: 'user1' } }
        const mockEntries = [
          {
            id: 'entry1',
            userId: 'user1',
            activity: 'Work',
            duration: 120,
            startTime: new Date(),
            category: 'work',
            mood: 'productive'
          }
        ]

        mockGetServerSession.mockResolvedValue(mockSession as any)

        const { prisma } = require('@/lib/prisma')
        prisma.timeEntry.findMany.mockResolvedValue(mockEntries)

        const request = new NextRequest('http://localhost:3002/api/analytics?period=30d')
        const response = await AnalyticsGET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toHaveProperty('totalTimeTracked')
        expect(data).toHaveProperty('totalEntries')
        expect(data).toHaveProperty('categoryByDate')
        expect(data).toHaveProperty('moodTrends')
        expect(data).toHaveProperty('peakHours')
        expect(data).toHaveProperty('weeklyComparison')
        expect(data).toHaveProperty('categoryBreakdown')
        expect(typeof data.totalTimeTracked).toBe('number')
        expect(typeof data.totalEntries).toBe('number')
      })
    })
  })
})
