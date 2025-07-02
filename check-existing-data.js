const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('=== Checking all existing data ===');
    
    // Check all users
    const users = await prisma.user.findMany();
    console.log('All users:');
    users.forEach(user => {
      console.log(`  ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Created: ${user.createdAt}`);
    });
    
    // Check all time entries and their user associations
    const timeEntries = await prisma.timeEntry.findMany({
      include: { user: true }
    });
    console.log(`\nTime entries: ${timeEntries.length} total`);
    timeEntries.forEach(entry => {
      console.log(`  Entry ID: ${entry.id}, User: ${entry.user?.email || 'NO USER'}, Activity: ${entry.activity}, Date: ${entry.date}`);
    });
    
    // Check all goals
    const goals = await prisma.userGoal.findMany({
      include: { user: true }
    });
    console.log(`\nUser goals: ${goals.length} total`);
    goals.forEach(goal => {
      console.log(`  Goal: ${goal.goal}, User: ${goal.user?.email || 'NO USER'}`);
    });
    
    // Check feedback
    const feedback = await prisma.feedback.findMany({
      include: { user: true }
    });
    console.log(`\nFeedback: ${feedback.length} total`);
    
    // Find orphaned data (data without valid user references)
    const orphanedEntries = await prisma.timeEntry.findMany({
      where: {
        user: null
      }
    });
    console.log(`\nOrphaned time entries: ${orphanedEntries.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
