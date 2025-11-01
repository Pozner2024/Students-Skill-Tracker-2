const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTestResult() {
  try {
    console.log('🔍 Adding test result to database...');

    // Сначала найдем пользователя
    const user = await prisma.user.findFirst({
      where: {
        email: {
          not: null,
        },
      },
    });

    if (!user) {
      console.log('❌ No users found in database');
      return;
    }

    console.log('👤 Found user:', user.email);

    // Добавляем тестовый результат
    const testResult = await prisma.testResult.create({
      data: {
        user_id: user.id,
        test_code: 'test1_1',
        variant: 1,
        score: 8,
        total_questions: 10,
        percentage: 80.0,
      },
    });

    console.log('✅ Test result added successfully:', testResult);

    // Проверяем, что результат добавлен
    const allResults = await prisma.testResult.findMany({
      include: {
        user: {
          select: {
            email: true,
            fullName: true,
          },
        },
      },
    });

    console.log(`📊 Total test results in database: ${allResults.length}`);
    allResults.forEach((result, index) => {
      console.log(
        `${index + 1}. ${result.user.email} - ${result.test_code} - ${result.score}/${result.total_questions} (${result.percentage}%)`,
      );
    });
  } catch (error) {
    console.error('❌ Error adding test result:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestResult();

