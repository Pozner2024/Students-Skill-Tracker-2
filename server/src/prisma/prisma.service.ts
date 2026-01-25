//Сервис для подключения к базе данных через Prisma.
// При запуске приложения автоматически вызывается метод onModuleInit(),
//который подключается к PostgreSQL. Используется async/await, потому что
//подключение выполняется асинхронно (занимает время).

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  async onModuleInit() {
    if (this.isConnected) {
      return; // Уже подключен, не подключаемся повторно
    }

    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Database connected successfully');
    } catch (error) {
      if (error instanceof Error) {
        this.logger.warn('Database connection failed:', error.message);
      } else {
        this.logger.warn(
          'Database connection failed with unknown error:',
          error,
        );
      }

      this.logger.warn('Make sure to:');
      this.logger.warn('   1. Create .env file with DATABASE_URL');
      this.logger.warn('   2. Start PostgreSQL database');
      this.logger.warn('   3. Run: npx prisma db push');
    }
  }
}
