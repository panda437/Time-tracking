const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const sessionUserId = 'cmcd0vdqi0000ochdatc12aj8';

async function main() {
  try {
    console.log('Checking database users...');

    // Check if the session user exists
    const sessionUser = await prisma.user.findUnique({
      where: { id: sessionUserId }
    });
    
    if (!sessionUser) {
      console.log('Creating session user...');
      const hashedPassword = await bcrypt.hash('password123', 12);
      const newUser = await prisma.user.create({
        data: {
          id: sessionUserId,
          email: 'test@example.com',
          name: 'Test User',
          password: hashedPassword
        }
      });
      console.log('Created session user:', { id: newUser.id, email: newUser.email, name: newUser.name });
    } else {
      console.log('Session user exists:', { id: sessionUser.id, email: sessionUser.email, name: sessionUser.name });
    }
    
    // Check existing users
    const users = await prisma.user.findMany();
    console.log('Existing users:', users.map(u => ({ id: u.id, email: u.email, name: u.name })));
    
    // Check if test@example.com exists
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });
    
    if (!testUser) {
      console.log('Creating test user...');
      const hashedPassword = await bcrypt.hash('password123', 12);
      const newUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test',
          password: hashedPassword
        }
      });
      console.log('Created test user:', { id: newUser.id, email: newUser.email, name: newUser.name });
    } else {
      console.log('Test user exists:', { id: testUser.id, email: testUser.email, name: testUser.name });
    }
    
    // Check feedback table
    const feedback = await prisma.feedback.findMany();
    console.log('Existing feedback entries:', feedback.length);
    
    // Check feedback votes table
    const votes = await prisma.feedbackVote.findMany();
    console.log('Existing feedback votes:', votes.length);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
