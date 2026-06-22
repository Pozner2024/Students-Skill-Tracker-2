// Сервис для работы с профилем пользователя.
// Позволяет получить и обновить данные профиля.
// Использует Prisma для работы с базой данных.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user;
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: updateProfileDto.fullName,
        groupNumber: updateProfileDto.groupNumber,
      },
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      groupNumber: updatedUser.groupNumber,
    };
  }
}
