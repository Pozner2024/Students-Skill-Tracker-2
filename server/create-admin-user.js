const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/**
 * Скрипт для создания пользователя с ролью админа
 * email: teacher@gmail.com
 * password: 121212
 */

async function createAdminUser() {
  try {
    console.log('Начинаем создание пользователя-админа...');

    const email = 'teacher@gmail.com';
    const password = '121212';
    const role = 'admin';

    // Проверяем, существует ли уже пользователь с таким email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`Пользователь с email ${email} уже существует.`);
      console.log('Обновляем роль на admin...');
      
      // Обновляем роль существующего пользователя
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          role: role,
          password: await bcrypt.hash(password, 10), // Обновляем пароль
        },
      });

      console.log(`\n✅ Пользователь обновлен:`);
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Роль: ${updatedUser.role}`);
      console.log(`   ID: ${updatedUser.id}`);
    } else {
      // Хешируем пароль
      const hashedPassword = await bcrypt.hash(password, 10);

      // Создаем нового пользователя
      const user = await prisma.user.create({
        data: {
          email: email,
          password: hashedPassword,
          role: role,
        },
      });

      console.log(`\n✅ Пользователь-админ успешно создан:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Роль: ${user.role}`);
      console.log(`   ID: ${user.id}`);
    }

    console.log(`\n📧 Данные для входа:`);
    console.log(`   Email: ${email}`);
    console.log(`   Пароль: ${password}`);
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем создание пользователя
createAdminUser();

