import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlansController {
  constructor(private plansService: PlansService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  async createPlan(
    @Request() req: any,
    @Body()
    dto: {
      name: string;
      durationDays: number;
      price: number;
      freezeLimitDays?: number;
      allowedEntryHoursStart?: string;
      allowedEntryHoursEnd?: string;
    },
  ) {
    return this.plansService.createPlan(req.user.gymId, dto);
  }

  @Get()
  async findAllPlans(@Request() req: any) {
    return this.plansService.findAllPlans(req.user.gymId);
  }

  @Post('subscribe')
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  async subscribeMember(
    @Body() dto: { memberId: string; planId: string; startDate?: Date },
  ) {
    return this.plansService.subscribeMember(dto);
  }

  @Post('payments/:id/pay')
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  async recordPayment(
    @Param('id') paymentId: string,
    @Body() dto: { paymentMethod: string; transactionId?: string },
  ) {
    return this.plansService.recordPayment(paymentId, dto);
  }

  @Get('payments')
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  async getPayments(@Request() req: any) {
    return this.plansService.getPayments(req.user.gymId);
  }
}
