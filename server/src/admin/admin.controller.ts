import { Controller, Get, UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService, private prisma: PrismaService) {}

  @Get('results')
  @UseGuards(JwtAuthGuard)
  async getGroupedResults(@GetUser() user: any) {
    const dbUser = await this.prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
    if (!dbUser || dbUser.role !== 'admin') {
      throw new ForbiddenException('Доступ только для администраторов');
    }

    return this.adminService.getResultsGroupedByGroup();
  }
}


