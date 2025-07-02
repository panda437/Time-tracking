const { PrismaClient } = require('@prisma/client');

async function emergencyRecoveryCheck() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== EMERGENCY RECOVERY CHECK ===');
    
    // Check all tables for any data
    const tables = ['user', 'timeEntry', 'userGoal', 'feedback', 'feedbackVote'];
    
    for (const table of tables) {
      try {
        const count = await prisma[table].count();
        console.log(`${table}: ${count} records`);
        
        if (count > 0) {
          const sample = await prisma[table].findMany({ take: 3 });
          console.log(`Sample ${table} data:`, JSON.stringify(sample, null, 2));
        }
      } catch (error) {
        console.log(`Error checking ${table}:`, error.message);
      }
    }
    
    // Check for any orphaned data or inconsistencies
    console.log('\n=== CHECKING FOR ORPHANED DATA ===');
    
    // Raw SQL queries to check for any hidden data
    const rawQueries = [
      'SELECT tablename FROM pg_tables WHERE schemaname = \'public\'',
      'SELECT * FROM users LIMIT 5',
      'SELECT * FROM time_entries LIMIT 5', 
      'SELECT * FROM user_goals LIMIT 5',
      'SELECT COUNT(*) as total FROM users',
      'SELECT COUNT(*) as total FROM time_entries',
      'SELECT COUNT(*) as total FROM user_goals'
    ];
    
    for (const query of rawQueries) {
      try {
        console.log(`\n--- Query: ${query} ---`);
        const result = await prisma.$queryRawUnsafe(query);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.log(`Error with query "${query}":`, error.message);
      }
    }
    
    // Check database logs/history if accessible
    console.log('\n=== CHECKING FOR RECENT MODIFICATIONS ===');
    try {
      const recentUsers = await prisma.$queryRawUnsafe(`
        SELECT * FROM users 
        ORDER BY "updatedAt" DESC, "createdAt" DESC 
        LIMIT 10
      `);
      console.log('Recent user modifications:', JSON.stringify(recentUsers, null, 2));
    } catch (error) {
      console.log('Error checking recent modifications:', error.message);
    }
    
  } catch (error) {
    console.error('Critical error during recovery check:', error);
  } finally {
    await prisma.$disconnect();
  }
}

emergencyRecoveryCheck();
