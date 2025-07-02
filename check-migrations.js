const { PrismaClient } = require('@prisma/client');

async function checkMigrations() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== MIGRATION HISTORY ===');
    const migrations = await prisma.$queryRawUnsafe(`
      SELECT * FROM _prisma_migrations 
      ORDER BY finished_at DESC 
      LIMIT 10
    `);
    console.log('Recent migrations:', JSON.stringify(migrations, null, 2));
    
    // Check if there are any system tables with historical data
    console.log('\n=== CHECKING SYSTEM TABLES ===');
    try {
      const systemTables = await prisma.$queryRawUnsafe(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `);
      console.log('All tables:', JSON.stringify(systemTables, null, 2));
    } catch (error) {
      console.log('Error checking system tables:', error.message);
    }
    
  } catch (error) {
    console.error('Error checking migrations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrations();
