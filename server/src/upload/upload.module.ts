// UploadModule - Модуль для загрузки файлов пользователями на Yandex Cloud
// Инкапсулирует функциональность загрузки файлов с валидацией и сохранением в облачное хранилище

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma/prisma.service';
import yandexCloudConfig from '../config/yandex-cloud.config';

@Module({
  imports: [
    ConfigModule.forFeature(yandexCloudConfig),
    AuthModule, // Импортируем AuthModule для использования JwtAuthGuard
  ],
  controllers: [UploadController],
  providers: [UploadService, PrismaService],
  exports: [UploadService],
})
export class UploadModule {}
