import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      console.log('🔐 Register attempt:', { email: registerDto.email });
      const { email, password } = registerDto;

      // Проверяем, существует ли пользователь
      console.log('🔍 Checking if user exists...');
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        console.log('❌ User already exists');
        throw new ConflictException(
          'Пользователь с таким email уже существует',
        );
      }

      // Хешируем пароль
      console.log('🔒 Hashing password...');
      const hashedPassword = await bcrypt.hash(password, 10);

      // Создаем пользователя
      console.log('👤 Creating user...');
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
        },
      });

      console.log('✅ User created successfully:', {
        id: user.id,
        email: user.email,
      });

      // Генерируем JWT токен
      console.log('🎫 Generating JWT token...');
      const payload = { sub: user.id, email: user.email };
      const token = this.jwtService.sign(payload);

      console.log('🎉 Registration completed successfully');
      return {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
        },
      };
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Находим пользователя
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Генерируем JWT токен
    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async validateUser(payload: any) {
    try {
      console.log('🔍 Validating user with payload:', payload);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (user) {
        console.log('✅ User found:', { id: user.id, email: user.email });
        return {
          id: user.id,
          email: user.email,
        };
      }
      console.log('❌ User not found');
      return null;
    } catch (error) {
      console.error('❌ Error validating user:', error);
      return null;
    }
  }

  async getUserById(id: number) {
    try {
      console.log('🔍 Getting user by ID:', id);
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (user) {
        console.log('✅ User found by ID:', { id: user.id, email: user.email });
        return user;
      }
      console.log('❌ User not found by ID');
      return null;
    } catch (error) {
      console.error('❌ Error getting user by ID:', error);
      return null;
    }
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    try {
      console.log('👤 Updating profile for user:', userId, updateProfileDto);

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          fullName: updateProfileDto.fullName,
          groupNumber: updateProfileDto.groupNumber,
        },
      });

      console.log('✅ Profile updated successfully:', {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        groupNumber: updatedUser.groupNumber,
      });

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        groupNumber: updatedUser.groupNumber,
      };
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      throw error;
    }
  }

  async getUserTestResults(userId: number) {
    try {
      console.log('📊 Getting test results for user:', userId);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { testResults: true },
      });

      const results = (user?.testResults as any[]) || [];

      // Sort by completed_at desc if present
      results.sort((a, b) => {
        const aTime = a?.completed_at ? new Date(a.completed_at).getTime() : 0;
        const bTime = b?.completed_at ? new Date(b.completed_at).getTime() : 0;
        return bTime - aTime;
      });

      console.log('✅ Test results retrieved:', results.length, 'results');

      return results;
    } catch (error) {
      console.error('❌ Error getting test results:', error);
      throw error;
    }
  }

  async saveTestResult(userId: number, testResultData: any) {
    try {
      console.log('💾 Saving test result for user:', userId, testResultData);

      const {
        testCode,
        variant,
        score,
        totalQuestions,
        maxPoints,
        percentage,
        grade,
        answersDetails,
      } = testResultData;

      // Read current results
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { testResults: true },
      });

      const currentResults: any[] = (user?.testResults as any[]) || [];

      const newResult = {
        user_id: userId,
        test_code: testCode,
        variant,
        score,
        total_questions: totalQuestions,
        max_points: maxPoints ?? null,
        percentage,
        grade,
        answers_details: answersDetails || [],
        completed_at: new Date().toISOString(),
      };

      const updatedResults = [newResult, ...currentResults];

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          testResults: updatedResults as unknown as any,
        },
        select: { testResults: true },
      });

      console.log('✅ Test result saved successfully');

      return newResult;
    } catch (error) {
      console.error('❌ Error saving test result:', error);
      throw error;
    }
  }
}
