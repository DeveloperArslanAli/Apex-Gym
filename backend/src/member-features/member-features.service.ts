import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MemberFeaturesService {
  constructor(private prisma: PrismaService) {}

  async createWorkoutSession(memberId: string, dto: {
    date: Date;
    durationMinutes?: number;
    notes?: string;
    sets: { exerciseName: string; setNumber: number; weight: number; reps: number; rir?: number; postureScore?: number; feedbackSummary?: string }[];
  }) {
    return this.prisma.workoutSession.create({
      data: {
        memberId,
        date: new Date(dto.date),
        durationMinutes: dto.durationMinutes,
        notes: dto.notes,
        sets: {
          create: dto.sets.map((s) => ({
            exerciseName: s.exerciseName,
            setNumber: s.setNumber,
            weight: s.weight,
            reps: s.reps,
            rir: s.rir,
            postureScore: s.postureScore,
            feedbackSummary: s.feedbackSummary,
          })),
        },
      },
      include: {
        sets: true,
      },
    });
  }

  async getWorkoutHistory(memberId: string) {
    return this.prisma.workoutSession.findMany({
      where: { memberId },
      include: { sets: true },
      orderBy: { date: 'desc' },
    });
  }

  async createMealLog(memberId: string, dto: {
    textDescription: string;
    photoUrl?: string;
    estimatedCalories?: number;
    estimatedProtein?: number;
    estimatedCarbs?: number;
    estimatedFat?: number;
    loggedMethod: 'TEXT' | 'BARCODE' | 'PHOTO';
  }) {
    // Simple mock calorie estimation if not provided
    const calories = dto.estimatedCalories ?? Math.floor(Math.random() * 400) + 200;
    const protein = dto.estimatedProtein ?? Math.floor(calories * 0.025);
    const carbs = dto.estimatedCarbs ?? Math.floor(calories * 0.1);
    const fat = dto.estimatedFat ?? Math.floor(calories * 0.04);

    return this.prisma.mealLog.create({
      data: {
        memberId,
        textDescription: dto.textDescription,
        photoUrl: dto.photoUrl,
        estimatedCalories: calories,
        estimatedProtein: protein,
        estimatedCarbs: carbs,
        estimatedFat: fat,
        loggedMethod: dto.loggedMethod,
      },
    });
  }

  async getMealLogs(memberId: string) {
    return this.prisma.mealLog.findMany({
      where: { memberId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getCoachAdvice(memberId: string) {
    const member = await this.prisma.user.findUnique({
      where: { id: memberId },
      include: {
        sessions: {
          take: 3,
          orderBy: { date: 'desc' },
          include: { sets: true },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member profile not found');
    }

    const totalWorkouts = await this.prisma.workoutSession.count({ where: { memberId } });
    const lastSession = member.sessions[0];
    const avgPostureScore = lastSession && lastSession.sets.length > 0
      ? Math.round(lastSession.sets.reduce((sum, s) => sum + (s.postureScore ?? 100), 0) / lastSession.sets.length)
      : 95;

    // AI Coach recommendation generation
    let recommendation = '';
    let dietSplit = '';

    if (totalWorkouts < 2) {
      recommendation = `Welcome ${member.name}! Let's start this week with a Full-Body conditioning split. Focus on learning compound shapes.`;
      dietSplit = 'Maintenance Macros: 40% Carbs, 30% Protein, 30% Fats. Aim for 2200 kcal/day.';
    } else {
      recommendation = `Great progress Arnold! Your last set had an average posture score of ${avgPostureScore}%. We detected slight back extension fatigue on the final sets of squats. Focus on bracing your core prior to descending.`;
      dietSplit = 'Hypertrophy Phase: High Protein (160g/day), Moderate Carbs (250g/day), Low Fats (60g/day). Aim for 2600 kcal/day.';
    }

    return {
      success: true,
      coachName: 'Coach Arnold (AI)',
      advice: recommendation,
      dietGuideline: dietSplit,
      postureAudit: {
        averageScore: avgPostureScore,
        alertExercises: avgPostureScore < 85 ? ['Squat'] : [],
        tips: 'Keep your chest up and push outward through your heels on squats. Engage your lats during deadlifts.',
      },
      nextWeekWorkoutSplit: [
        { day: 'Monday', split: 'Push Day (Chest, Shoulders, Triceps)' },
        { day: 'Wednesday', split: 'Pull Day (Back, Biceps, Core)' },
        { day: 'Friday', split: 'Leg Day (Squats, RDLs, Calves)' },
      ],
    };
  }
}
