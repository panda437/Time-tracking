import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { GET as EntriesGET } from "@/app/api/entries/route";
import { GET as AnalyticsGET } from "@/app/api/analytics/route";
import { GET } from '@/app/api/test/route';
import { jest } from '@jest/globals';
import connectDB from '@/lib/prisma';
import { User, TimeEntry } from '@/lib/models';

jest.mock('next-auth')
jest.mock('@/lib/prisma')
jest.mock('@/lib/models')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>
const mockUser = User as jest.Mocked<typeof User>
const mockTimeEntry = TimeEntry as jest.Mocked<typeof TimeEntry>

describe("API Route Authentication & Response", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/entries", () => {
    it("should return 200 for entries with a valid session", async () => {
      const mockSession = {
        user: { id: "user1" }
      }
      const mockEntries = []

      mockGetServerSession.mockResolvedValue(mockSession as any)
      mockPrisma.timeEntry.findMany.mockResolvedValue(mockEntries as any)

      const request = new NextRequest("http://localhost:3000/api/entries")
      const response = await EntriesGET(request)

      expect(response.status).toBe(200)
    });
  });

  describe("Analytics Route", () => {
    const mockUser = {
      id: "test-user-id",
      email: "test@example.com",
      name: "Test User"
    }

    const mockEntries: any[] = [
      {
        id: "1",
        userId: "test-user-id",
        activity: "Work",
        duration: 60,
        startTime: new Date('2023-01-01T09:00:00Z'),
        endTime: new Date('2023-01-01T10:00:00Z'),
        category: "work",
        mood: "good"
      }
    ]

    it("should return 401 for unauthenticated requests", async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/analytics')
      const response = await AnalyticsGET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it("should return analytics data for authenticated users", async () => {
      mockGetServerSession.mockResolvedValue({ user: mockUser })
      
      mockConnectDB.mockResolvedValue({} as any)
      mockTimeEntry.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockEntries)
      } as any)

      const request = new NextRequest('http://localhost:3000/api/analytics')
      const response = await AnalyticsGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('totalTimeTracked')
      expect(data).toHaveProperty('totalEntries')
      expect(data).toHaveProperty('streakDays')
      expect(data).toHaveProperty('productivityScore')
    });
  });
});

describe('/api/test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return success when database connection works', async () => {
    mockConnectDB.mockResolvedValue({} as any);
    mockUser.countDocuments.mockResolvedValue(5);

    const request = new NextRequest('http://localhost:3000/api/test');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.userCount).toBe(5);
    expect(mockConnectDB).toHaveBeenCalled();
    expect(mockUser.countDocuments).toHaveBeenCalled();
  });

  it('should return error when database connection fails', async () => {
    mockConnectDB.mockRejectedValue(new Error('Connection failed'));

    const request = new NextRequest('http://localhost:3000/api/test');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.status).toBe('error');
    expect(data.message).toBe('Database connection failed');
  });
});

