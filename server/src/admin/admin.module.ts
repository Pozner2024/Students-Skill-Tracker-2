// AdminModule — модуль администратора.
// Объединяет контроллер (AdminController) и сервис (AdminService).
// Нужен для организации кода: все функции, связанные с админом, собраны в одном месте.
// NestJS подключает этот модуль, чтобы активировать маршруты и логику администратора.

import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
