const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTestsData() {
  try {
    console.log('🔍 Проверяем данные тестов в базе данных...');
    
    // Проверяем общее количество тестов
    const totalTests = await prisma.tests.count();
    console.log(`📊 Общее количество тестов: ${totalTests}`);
    
    // Проверяем тесты для темы 5
    const test5Tests = await prisma.tests.findMany({
      where: {
        test_code: {
          startsWith: 'test5_'
        }
      }
    });
    
    console.log(`📋 Тесты для темы 5:`);
    test5Tests.forEach(test => {
      console.log(`  - ${test.test_code} (вариант ${test.variant}): ${test.test_title}`);
    });
    
    // Проверяем конкретно test5_2
    const test5_2 = await prisma.tests.findFirst({
      where: {
        test_code: 'test5_2',
        variant: 2
      }
    });
    
    if (test5_2) {
      console.log(`✅ Тест test5_2 вариант 2 найден:`);
      console.log(`  - ID: ${test5_2.id}`);
      console.log(`  - Название: ${test5_2.test_title}`);
      console.log(`  - Количество вопросов: ${JSON.parse(test5_2.questions).questions.length}`);
    } else {
      console.log(`❌ Тест test5_2 вариант 2 НЕ найден!`);
    }
    
    // Проверяем все тесты с вариантом 2
    const variant2Tests = await prisma.tests.findMany({
      where: {
        variant: 2
      }
    });
    
    console.log(`📋 Все тесты с вариантом 2:`);
    variant2Tests.forEach(test => {
      console.log(`  - ${test.test_code}: ${test.test_title}`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка при проверке данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTestsData();
