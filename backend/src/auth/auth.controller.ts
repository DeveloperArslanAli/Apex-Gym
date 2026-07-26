import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Role } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signUp(
    @Body()
    body: {
      email: string;
      password?: string;
      name: string;
      phone?: string;
      role?: Role;
      gymId: string;
    },
  ) {
    return this.authService.signUp(body);
  }

  @Post('signin')
  async signIn(@Body() body: { email: string; password?: string }) {
    return this.authService.signIn(body);
  }
}
