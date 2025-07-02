const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const sessionUserId = 'cmcd0vdqi0000ochdatc12aj8';
    
    // Find the existing user and update their ID
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });
    
    if (existingUser) {
      console.log('Found existing user:', { id: existingUser.id, email: existingUser.email });
      
      // Delete the existing user and create with correct ID
      await prisma.user.delete({
        where: { id: existingUser.id }
      });
      
      // Create with correct session ID
      const newUser = await prisma.user.create({
        data: {
          id: sessionUserId,
          email: 'test@example.com',
          name: 'Test User',
          password: existingUser.password
        }
      });
      
      console.log('Updated user with session ID:', { id: newUser.id, email: newUser.email });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
