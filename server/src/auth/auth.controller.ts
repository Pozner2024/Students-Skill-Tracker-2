import { Controller, Post, Body, ValidationPipe, HttpCode, HttpStatus, Get, UseGuards, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {
    console.log('🔧 AuthController initialized with routes:');
    console.log('   - POST /auth/register');
    console.log('   - POST /auth/login');
    console.log('   - GET /auth/profile');
    console.log('   - PUT /auth/profile');
  }

  @Post('register')
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@GetUser() user: any) {
    try {
      console.log('👤 Getting profile for user:', user);
      
      // Получаем полную информацию о пользователе из базы данных
      const fullUser = await this.authService.getUserById(user.id);
      
      const profile = {
        id: user.id,
        email: user.email,
        fullName: fullUser?.fullName || '',
        groupNumber: fullUser?.groupNumber || '',
        role: fullUser?.role || 'student',
      };
      console.log('✅ Profile data:', profile);
      return profile;
    } catch (error) {
      console.error('❌ Error getting profile:', error);
      throw error;
    }
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@GetUser() user: any, @Body(ValidationPipe) updateProfileDto: UpdateProfileDto) {
    try {
      console.log('👤 PUT /auth/profile - Updating profile for user:', user.id);
      console.log('👤 PUT /auth/profile - Update data:', updateProfileDto);

      const updatedProfile = await this.authService.updateProfile(user.id, updateProfileDto);
      console.log('✅ PUT /auth/profile - Profile updated successfully:', updatedProfile);

      return updatedProfile;
    } catch (error) {
      console.error('❌ PUT /auth/profile - Error updating profile:', error);
      throw error;
    }
  }

  @Get('test-results')
  @UseGuards(JwtAuthGuard)
  async getTestResults(@GetUser() user: any) {
    try {
      console.log('📊 GET /auth/test-results - Getting test results for user:', user.id);

      const testResults = await this.authService.getUserTestResults(user.id);
      console.log('✅ GET /auth/test-results - Test results retrieved:', testResults.length, 'results');

      return {
        success: true,
        results: testResults,
      };
    } catch (error) {
      console.error('❌ GET /auth/test-results - Error getting test results:', error);
      throw error;
    }
  }

  @Post('test-results')
  @UseGuards(JwtAuthGuard)
  async saveTestResult(@GetUser() user: any, @Body() testResultData: any) {
    try {
      console.log('💾 POST /auth/test-results - Saving test result for user:', user.id);
      console.log('💾 POST /auth/test-results - Test result data:', testResultData);

      const savedResult = await this.authService.saveTestResult(user.id, testResultData);
      console.log('✅ POST /auth/test-results - Test result saved successfully:', savedResult);

      return {
        success: true,
        result: savedResult,
      };
    } catch (error) {
      console.error('❌ POST /auth/test-results - Error saving test result:', error);
      throw error;
    }
  }
}
