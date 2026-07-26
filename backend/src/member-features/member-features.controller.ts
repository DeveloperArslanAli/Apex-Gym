import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { MemberFeaturesService } from './member-features.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('member')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MemberFeaturesController {
  constructor(private memberFeaturesService: MemberFeaturesService) {}

  @Post('workout')
  @Roles(Role.MEMBER, Role.SUPER_ADMIN)
  async logWorkout(
    @Request() req: any,
    @Body()
    dto: {
      date: Date;
      durationMinutes?: number;
      notes?: string;
      sets: { exerciseName: string; setNumber: number; weight: number; reps: number; rir?: number; postureScore?: number; feedbackSummary?: string }[];
    },
  ) {
    return this.memberFeaturesService.createWorkoutSession(req.user.id, dto);
  }

  @Get('workout/history')
  @Roles(Role.MEMBER, Role.SUPER_ADMIN)
  async getWorkoutHistory(@Request() req: any) {
    return this.memberFeaturesService.getWorkoutHistory(req.user.id);
  }

  @Post('meal')
  @Roles(Role.MEMBER, Role.SUPER_ADMIN)
  async logMeal(
    @Request() req: any,
    @Body()
    dto: {
      textDescription: string;
      photoUrl?: string;
      estimatedCalories?: number;
      estimatedProtein?: number;
      estimatedCarbs?: number;
      estimatedFat?: number;
      loggedMethod: 'TEXT' | 'BARCODE' | 'PHOTO';
    },
  ) {
    return this.memberFeaturesService.createMealLog(req.user.id, dto);
  }

  @Get('meals')
  @Roles(Role.MEMBER, Role.SUPER_ADMIN)
  async getMealLogs(@Request() req: any) {
    return this.memberFeaturesService.getMealLogs(req.user.id);
  }

  @Get('coach/advice')
  @Roles(Role.MEMBER, Role.SUPER_ADMIN)
  async getCoachAdvice(@Request() req: any) {
    return this.memberFeaturesService.getCoachAdvice(req.user.id);
  }
}
