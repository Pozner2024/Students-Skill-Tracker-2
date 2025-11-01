import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private isConnected = false;

  async onModuleInit() {
    if (this.isConnected) {
      return; // Уже подключен, не подключаемся повторно
    }

    try {
      await this.$connect();
      this.isConnected = true;
      console.log('✅ Database connected successfully');
    } catch (error) {
      if (error instanceof Error) {
        console.error('❌ Database connection failed:', error.message);
      } else {
        console.error(
          '❌ Database connection failed with unknown error:',
          error,
        );
      }

      console.log('💡 Make sure to:');
      console.log('   1. Create .env file with DATABASE_URL');
      console.log('   2. Start PostgreSQL database');
      console.log('   3. Run: npx prisma db push');
    }
  }
}
