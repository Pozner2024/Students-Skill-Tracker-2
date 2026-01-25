// Контроллер для загрузки файлов пользователями на Yandex Cloud
// Предоставляет защищенные эндпоинты для загрузки файлов с валидацией

import {
  Controller,
  Post,
  Delete,
  Get,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Logger,
  BadRequestException,
  Param,
  Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { JwtUser } from '../auth/types/user.types';
import type { MulterFile } from './types';

@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly uploadService: UploadService) {}

  // Загружает один файл
  // POST /upload
  // Требует аутентификации через JWT
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: MulterFile, @GetUser() user: JwtUser) {
    if (!file) {
      throw new BadRequestException('Файл не был загружен');
    }

    // Логируем информацию о загружаемом файле
    this.logger.log(
      `Upload request: user=${user.id}, filename=${file.originalname}, size=${file.size}, mimetype=${file.mimetype}`,
    );

    try {
      const result = await this.uploadService.uploadFile(file, user.id);
      this.logger.log(`File uploaded successfully: ${result.key}`);
      return {
        success: true,
        message: 'Файл успешно загружен',
        data: result,
      };
    } catch (error) {
      this.logger.error('Error in uploadFile:', error);
      // Логируем детали ошибки
      if (error instanceof Error) {
        this.logger.error(`Error message: ${error.message}`);
        this.logger.error(`Error stack: ${error.stack}`);
      }
      throw error;
    }
  }

  // Загружает несколько файлов
  // POST /upload/multiple
  // Требует аутентификации через JWT
  // Должен быть перед /upload/:folder, чтобы избежать конфликта маршрутов
  @Post('multiple')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10)) // Максимум 10 файлов
  async uploadMultipleFiles(
    @UploadedFiles() files: MulterFile[],
    @GetUser() user: JwtUser,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Файлы не были загружены');
    }

    try {
      const results = await this.uploadService.uploadMultipleFiles(
        files,
        user.id,
      );
      return {
        success: true,
        message: `Загружено ${results.filter((r) => r.success).length} из ${results.length} файлов`,
        data: results,
      };
    } catch (error) {
      this.logger.error('Error in uploadMultipleFiles:', error);
      throw error;
    }
  }

  // Загружает один файл в указанную папку
  // POST /upload/:folder
  // Требует аутентификации через JWT
  @Post(':folder')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFileToFolder(
    @UploadedFile() file: MulterFile,
    @GetUser() user: JwtUser,
    @Param('folder') folder: string,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не был загружен');
    }

    try {
      const result = await this.uploadService.uploadFile(file, user.id, folder);
      return {
        success: true,
        message: 'Файл успешно загружен',
        data: result,
      };
    } catch (error) {
      this.logger.error('Error in uploadFileToFolder:', error);
      throw error;
    }
  }

  // Получает список файлов пользователя
  // GET /upload/files
  // Требует аутентификации через JWT
  // Должен быть перед wildcard маршрутами
  @Get('files')
  @UseGuards(JwtAuthGuard)
  async getUserFiles(
    @GetUser() user: JwtUser,
    @Query('folder') folder?: string,
  ) {
    try {
      const files = await this.uploadService.getUserFiles(user.id, folder);
      return {
        success: true,
        files,
        count: files.length,
      };
    } catch (error) {
      this.logger.error('Error in getUserFiles:', error);
      throw error;
    }
  }

  // Получает подписанный URL для скачивания файла
  // GET /upload/download/:key
  // Требует аутентификации через JWT
  // Используем обычный параметр вместо wildcard для совместимости
  @Get('download/:key')
  @UseGuards(JwtAuthGuard)
  async getDownloadUrl(@Param('key') key: string, @GetUser() user: JwtUser) {
    try {
      this.logger.debug(
        `Getting download URL for key: ${key}, user: ${user.id}`,
      );
      const decodedKey = decodeURIComponent(key);
      const url = await this.uploadService.getDownloadUrl(decodedKey, user.id);

      this.logger.debug(`Successfully generated download URL for key: ${key}`);
      return {
        success: true,
        url,
      };
    } catch (error) {
      this.logger.error('Error in getDownloadUrl:', error);
      if (error instanceof Error) {
        this.logger.error(`Error message: ${error.message}`);
        this.logger.error(`Error stack: ${error.stack}`);
      }
      throw error;
    }
  }

  // Удаляет файл пользователя
  // DELETE /upload/delete/:key
  // Требует аутентификации через JWT
  // Используем обычный параметр вместо wildcard для совместимости
  @Delete('delete/:key')
  @UseGuards(JwtAuthGuard)
  async deleteFile(@Param('key') key: string, @GetUser() user: JwtUser) {
    try {
      // Декодируем ключ из URL
      const decodedKey = decodeURIComponent(key);
      const deleted = await this.uploadService.deleteFile(decodedKey, user.id);

      if (deleted) {
        return {
          success: true,
          message: 'Файл успешно удален',
        };
      } else {
        throw new BadRequestException('Не удалось удалить файл');
      }
    } catch (error) {
      this.logger.error('Error in deleteFile:', error);
      throw error;
    }
  }
}
