const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Скрипт для восстановления данных в таблице test_images
 * Создает записи для всех существующих тестов с соответствующими topic_id
 */

async function restoreTestImages() {
  try {
    console.log('Начинаем восстановление данных в таблице test_images...');
    
    // Получаем все существующие тесты
    const tests = await prisma.tests.findMany({
      select: {
        test_code: true,
        variant: true
      }
    });
    
    console.log(`Найдено ${tests.length} тестов`);
    
    // Очищаем существующие данные в test_images
    await prisma.testImages.deleteMany({});
    console.log('Существующие данные в test_images удалены');
    
    let totalInserted = 0;
    
    // Создаем записи для каждого теста
    for (const test of tests) {
      // Извлекаем topic_id из test_code (например, test1_1 -> 1)
      const topicId = parseInt(test.test_code.replace('test', '').split('_')[0], 10);
      
      if (isNaN(topicId)) {
        console.warn(`Не удалось извлечь topic_id из test_code: ${test.test_code}`);
        continue;
      }
      
      // Создаем запись в test_images
      // image_url будет null, так как URL генерируется динамически в ImagesService
      await prisma.testImages.create({
        data: {
          test_code: test.test_code,
          variant: test.variant,
          topic_id: topicId,
          image_url: null // URL генерируется динамически
        }
      });
      
      totalInserted++;
      console.log(`Добавлена запись: ${test.test_code}, variant: ${test.variant}, topic_id: ${topicId}`);
    }
    
    console.log(`\nУспешно восстановлено ${totalInserted} записей в test_images!`);
    
    // Проверяем результат
    const count = await prisma.testImages.count();
    console.log(`Всего записей в test_images: ${count}`);
    
  } catch (error) {
    console.error('Ошибка при восстановлении данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем восстановление
restoreTestImages();
