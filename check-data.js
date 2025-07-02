const { PrismaClient } = require('@prisma/client');

async function checkData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== DATABASE STATE CHECK ===');
    
    const userCount = await prisma.user.count();
    console.log(`Total users: ${userCount}`);
    
    const entryCount = await prisma.timeEntry.count();
    console.log(`Total time entries: ${entryCount}`);
    
    const goalCount = await prisma.userGoal.count();
    console.log(`Total user goals: ${goalCount}`);
    
    const feedbackCount = await prisma.feedback.count();
    console.log(`Total feedback: ${feedbackCount}`);
    
    console.log('\n=== RECENT USERS ===');
    const recentUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            entries: true,
            goals: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    recentUsers.forEach(user => {
      console.log(`User: ${user.email} (${user.name}) - ${user._count.entries} entries, ${user._count.goals} goals - Created: ${user.createdAt}`);
    });
    
    console.log('\n=== USERS WITH MOST DATA ===');
    const usersWithMostData = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            entries: true,
            goals: true
          }
        }
      },
      orderBy: {
        entries: {
          _count: 'desc'
        }
      },
      take: 10
    });
    
    usersWithMostData.forEach(user => {
      console.log(`User: ${user.email} (${user.name}) - ${user._count.entries} entries, ${user._count.goals} goals - Created: ${user.createdAt}`);
    });
    
  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
