const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    console.log('🔍 Checking User table structure...');
    const users = await prisma.user.findMany({
      take: 1
    });
    console.log('✅ User table exists and accessible');
    
    console.log('🔍 Checking if email column exists...');
    try {
      const testUser = await prisma.user.findFirst({
        where: {
          email: {
            not: null
          }
        }
      });
      console.log('✅ Email column exists');
    } catch (error) {
      console.log('❌ Email column might not exist:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.log('💡 Try running: npx prisma db push');
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
