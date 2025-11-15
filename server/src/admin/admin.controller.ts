// Контроллер администратора: проверяет роль пользователя и возвращает результаты тестов по группам.

import { Controller, Get, Delete, UseGuards, Param, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private adminService: AdminService,
    private prisma: PrismaService,
  ) {}

  @Get('results')
  @UseGuards(JwtAuthGuard)
  async getGroupedResults(@GetUser() user: { id: number; email: string }) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    if (!dbUser || dbUser.role !== 'admin') {
      throw new ForbiddenException('Доступ только для администраторов');
    }

    return this.adminService.getResultsGroupedByGroup();
  }

  /**
   * Получает список файлов студента (для админа)
   * GET /admin/students/:studentId/files
   */
  @Get('students/:studentId/files')
  @UseGuards(JwtAuthGuard)
  async getStudentFiles(
    @GetUser() user: { id: number; email: string },
    @Param('studentId') studentId: string,
  ) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    if (!dbUser || dbUser.role !== 'admin') {
      throw new ForbiddenException('Доступ только для администраторов');
    }

    const files = await this.adminService.getStudentFiles(
      parseInt(studentId, 10),
    );
    return {
      success: true,
      files,
      count: files.length,
    };
  }

  /**
   * Удаляет файл студента (для админа)
   * DELETE /admin/files/:key
   */
  @Delete('files/:key')
  @UseGuards(JwtAuthGuard)
  async deleteStudentFile(
    @GetUser() user: { id: number; email: string },
    @Param('key') key: string,
  ) {
    try {
      this.logger.debug(`Delete request for key: ${key}, user: ${user.id}`);
      
      const dbUser = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });
      if (!dbUser || dbUser.role !== 'admin') {
        this.logger.warn(`Access denied for user ${user.id}, role: ${dbUser?.role}`);
        throw new ForbiddenException('Доступ только для администраторов');
      }

      const decodedKey = decodeURIComponent(key);
      this.logger.debug(`Decoded key: ${decodedKey}`);
      
      const deleted = await this.adminService.deleteStudentFile(decodedKey);

      if (deleted) {
        this.logger.log(`File deleted successfully: ${decodedKey}`);
        return {
          success: true,
          message: 'Файл успешно удален',
        };
      } else {
        this.logger.error(`Failed to delete file: ${decodedKey}`);
        throw new BadRequestException('Не удалось удалить файл');
      }
    } catch (error) {
      this.logger.error('Error in deleteStudentFile:', error);
      if (error instanceof Error) {
        this.logger.error(`Error message: ${error.message}`);
        this.logger.error(`Error stack: ${error.stack}`);
      }
      throw error;
    }
  }

  /**
   * Получает URL для скачивания файла студента (для админа)
   * GET /admin/files/:key/download
   */
  @Get('files/:key/download')
  @UseGuards(JwtAuthGuard)
  async getStudentFileDownloadUrl(
    @GetUser() user: { id: number; email: string },
    @Param('key') key: string,
  ) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    if (!dbUser || dbUser.role !== 'admin') {
      throw new ForbiddenException('Доступ только для администраторов');
    }

    const decodedKey = decodeURIComponent(key);
    // Используем adminService для получения URL
    const url = await this.adminService.getStudentFileDownloadUrl(decodedKey);

    return {
      success: true,
      url,
    };
  }

  /**
   * Удаляет пользователя (для админа)
   * DELETE /admin/users/:userId
   */
  @Delete('users/:userId')
  @UseGuards(JwtAuthGuard)
  async deleteUser(
    @GetUser() user: { id: number; email: string },
    @Param('userId') userId: string,
  ) {
    try {
      this.logger.debug(`Delete user request: userId=${userId}, admin=${user.id}`);

      const dbUser = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });
      if (!dbUser || dbUser.role !== 'admin') {
        this.logger.warn(`Access denied for user ${user.id}, role: ${dbUser?.role}`);
        throw new ForbiddenException('Доступ только для администраторов');
      }

      const userIdNum = parseInt(userId, 10);
      if (Number.isNaN(userIdNum)) {
        throw new BadRequestException('Некорректный ID пользователя');
      }

      const deleted = await this.adminService.deleteUser(userIdNum);

      if (deleted) {
        this.logger.log(`User ${userIdNum} deleted successfully by admin ${user.id}`);
        return {
          success: true,
          message: 'Пользователь успешно удален',
        };
      } else {
        throw new BadRequestException('Не удалось удалить пользователя');
      }
    } catch (error) {
      this.logger.error('Error in deleteUser:', error);
      if (error instanceof Error) {
        this.logger.error(`Error message: ${error.message}`);
        this.logger.error(`Error stack: ${error.stack}`);
      }
      throw error;
    }
  }
}
