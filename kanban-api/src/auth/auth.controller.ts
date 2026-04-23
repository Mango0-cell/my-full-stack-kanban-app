import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { ttl: 15 * 60 * 1000, limit: 10 } })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(
      dto.email,
      dto.password,
      dto.display_name,
    );
    return {
      data: result,
      message: 'Registration successful',
      error: null,
    };
  }

  @Public()
  @Throttle({ default: { ttl: 15 * 60 * 1000, limit: 10 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto.email, dto.password);
    return {
      data: result,
      message: 'Login successful',
      error: null,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout() {
    return { data: null, message: 'Logged out successfully', error: null };
  }

  @Get('me')
  async me(@CurrentUser() user: JwtPayload) {
    const profile = await this.authService.getCurrentUser(user.userId, user.email);
    if (!profile) throw new UnauthorizedException('Invalid token user context');
    return { data: profile, message: 'OK', error: null };
  }
}
