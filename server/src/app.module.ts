//Главный модуль приложения (AppModule)
//Объединяет все модули, контроллеры и сервисы приложения NestJS.
//- Подключает ConfigModule для работы с переменными окружения.
//  Переменные загружаются через встроенный флаг Node.js --env-file (Node.js 20.6+).
//- Делает PrismaService глобальным для удобного доступа к базе данных.
// Является точкой входа для сборки и запуска всего приложения.

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestsModule } from './tests/tests.module';
import { ImagesModule } from './images/images.module';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { UsersModule } from './users/users.module';
import { TopicsModule } from './topics/topics.module';
import { UploadModule } from './upload/upload.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Отключаем автоматическую загрузку .env через dotenv,
      // так как переменные загружаются через --env-file флаг Node.js
      ignoreEnvFile: true,
    }),
    TestsModule,
    ImagesModule,
    AuthModule,
    AdminModule,
    UsersModule,
    TopicsModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
