// Контроллер для работы с профилем пользователя.
// Позволяет получить и обновить данные профиля.
// Доступен только авторизованным пользователям через JWT.

import {
  Controller,
  Get,
  Put,
  Body,
  ValidationPipe,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { JwtUser } from '../auth/types/user.types';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@GetUser() user: JwtUser) {
    try {
      // Получаем полную информацию о пользователе из базы данных
      const fullUser = await this.usersService.getUserById(user.id);

      const profile = {
        id: user.id,
        email: user.email,
        fullName: fullUser?.fullName || '',
        groupNumber: fullUser?.groupNumber || '',
        role: fullUser?.role || 'student',
      };
      return profile;
    } catch (error) {
      this.logger.error('Error getting profile:', error);
      throw error;
    }
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @GetUser() user: JwtUser,
    @Body(ValidationPipe) updateProfileDto: UpdateProfileDto,
  ) {
    try {
      const updatedProfile = await this.usersService.updateProfile(
        user.id,
        updateProfileDto,
      );

      return updatedProfile;
    } catch (error) {
      this.logger.error('Error updating profile:', error);
      throw error;
    }
  }
}
