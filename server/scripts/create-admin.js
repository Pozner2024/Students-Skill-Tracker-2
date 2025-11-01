#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  const email = 'teacher@gmail.com';
  const password = '121212';
  const role = 'admin';

  try {
    console.log('🔧 Creating/updating admin user...');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        role,
      },
      create: {
        email,
        password: hashedPassword,
        role,
      },
      select: { id: true, email: true, role: true },
    });

    console.log('✅ Admin ensured:', user);
  } catch (error) {
    console.error('❌ Failed to create admin:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();


