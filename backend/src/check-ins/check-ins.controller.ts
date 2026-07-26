import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { CheckInsService } from './check-ins.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('checkins')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CheckInsController {
  constructor(private checkInsService: CheckInsService) {}

  @Post('verify')
  @Roles(Role.SUPER_ADMIN, Role.STAFF) // Kiosk logs in as Staff or Admin
  async verifyCheckIn(
    @Request() req: any,
    @Body() dto: { memberId?: string; email?: string; method: 'FACE' | 'FINGERPRINT' | 'QR' | 'MANUAL'; photoUrl?: string },
  ) {
    return this.checkInsService.verifyCheckIn({
      ...dto,
      gymId: req.user.gymId,
    });
  }

  @Post('manual')
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  async manualOverride(
    @Request() req: any,
    @Body() dto: { memberId: string },
  ) {
    return this.checkInsService.manualOverride(
      req.user.gymId,
      req.user.id,
      dto.memberId,
    );
  }

  @Get('logs')
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  async getLogs(@Request() req: any) {
    return this.checkInsService.getLogs(req.user.gymId);
  }
}
