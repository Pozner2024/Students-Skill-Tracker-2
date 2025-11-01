const { PrismaClient } = require('@prisma/client');

async function checkDatabaseStructure() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking database structure...');
    
    // Проверяем подключение
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Проверяем структуру таблицы users
    console.log('\n📋 Checking users table structure...');
    
    try {
      // Пытаемся получить одного пользователя для проверки структуры
      const user = await prisma.user.findFirst();
      
      if (user) {
        console.log('✅ Users table exists and accessible');
        console.log('📊 Sample user structure:', {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          groupNumber: user.groupNumber,
          hasFullName: 'fullName' in user,
          hasGroupNumber: 'groupNumber' in user
        });
      } else {
        console.log('⚠️ Users table exists but is empty');
      }
      
      // Проверяем, можем ли мы создать пользователя с новыми полями
      console.log('\n🧪 Testing user creation with new fields...');
      const testUser = await prisma.user.create({
        data: {
          email: `test${Date.now()}@example.com`,
          password: 'hashed_password',
          fullName: 'Тестовый Пользователь',
          groupNumber: 'ГР-2024-01'
        }
      });
      
      console.log('✅ User created successfully with new fields:', {
        id: testUser.id,
        email: testUser.email,
        fullName: testUser.fullName,
        groupNumber: testUser.groupNumber
      });
      
      // Удаляем тестового пользователя
      await prisma.user.delete({
        where: { id: testUser.id }
      });
      console.log('🗑️ Test user deleted');
      
    } catch (error) {
      if (error.message.includes('Unknown column') || error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('❌ Database structure is outdated. New columns are missing.');
        console.log('💡 Run: npx prisma db push');
      } else {
        console.error('❌ Error checking database structure:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('💡 Make sure:');
    console.log('   1. PostgreSQL is running');
    console.log('   2. DATABASE_URL is set correctly');
    console.log('   3. Database exists');
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStructure();
