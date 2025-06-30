// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    timeEntry: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    feedback: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    feedbackVote: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}))

// Mock auth options
jest.mock('@/lib/auth', () => ({
  authOptions: {
    providers: [],
    session: { strategy: 'jwt' },
  },
}))

// Set up environment variables for tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NODE_ENV = 'test'
