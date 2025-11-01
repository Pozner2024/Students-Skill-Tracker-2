const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Проверяем подключение к базе данных
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Проверяем структуру таблицы test_results
    const testResults = await prisma.testResult.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            groupNumber: true
          }
        }
      },
      orderBy: {
        completed_at: 'desc'
      }
    });

    console.log(`📊 Found ${testResults.length} test results:`);
    
    if (testResults.length === 0) {
      console.log('❌ No test results found in database');
      console.log('💡 This means either:');
      console.log('   1. No tests have been completed yet');
      console.log('   2. The saveTestResult function is not working');
      console.log('   3. There is an issue with the database connection');
    } else {
      testResults.forEach((result, index) => {
        console.log(`\n${index + 1}. Test Result:`);
        console.log(`   ID: ${result.id}`);
        console.log(`   User: ${result.user.email} (${result.user.fullName || 'No name'})`);
        console.log(`   Test Code: ${result.test_code}`);
        console.log(`   Variant: ${result.variant}`);
        console.log(`   Score: ${result.score}/${result.total_questions}`);
        console.log(`   Percentage: ${result.percentage}%`);
        console.log(`   Completed: ${result.completed_at}`);
      });
    }

    // Проверяем пользователей
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        groupNumber: true,
        _count: {
          select: {
            testResults: true
          }
        }
      }
    });

    console.log(`\n👥 Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.fullName || 'Not set'}`);
      console.log(`   Group: ${user.groupNumber || 'Not set'}`);
      console.log(`   Test Results: ${user._count.testResults}`);
    });

  } catch (error) {
    console.error('❌ Error checking test results:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
