import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    try {
      console.log('🔐 JWT Strategy - validating payload:', payload);
      const user = await this.authService.validateUser(payload);
      if (!user) {
        console.log('❌ JWT Strategy - user not found');
        throw new UnauthorizedException();
      }
      console.log('✅ JWT Strategy - user validated:', user);
      return user;
    } catch (error) {
      console.error('❌ JWT Strategy - validation error:', error);
      throw error;
    }
  }
}
