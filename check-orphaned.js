const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('=== Checking for orphaned data ===');
    
    // Get all userIds that exist
    const users = await prisma.user.findMany();
    const validUserIds = users.map(u => u.id);
    console.log('Valid user IDs:', validUserIds);
    
    // Check time entries with raw query to see all userIds
    const timeEntries = await prisma.$queryRaw`SELECT id, "userId", activity, "startTime" FROM time_entries LIMIT 10`;
    console.log('Time entries (raw):', timeEntries);
    
    // Check goals with raw query
    const goals = await prisma.$queryRaw`SELECT id, "userId", goal FROM user_goals LIMIT 10`;
    console.log('Goals (raw):', goals);
    
    // Check feedback with raw query
    const feedback = await prisma.$queryRaw`SELECT id, "userId", title FROM feedback LIMIT 10`;
    console.log('Feedback (raw):', feedback);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
