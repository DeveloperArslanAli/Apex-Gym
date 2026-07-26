"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberFeaturesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MemberFeaturesService = class MemberFeaturesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createWorkoutSession(memberId, dto) {
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
    async getWorkoutHistory(memberId) {
        return this.prisma.workoutSession.findMany({
            where: { memberId },
            include: { sets: true },
            orderBy: { date: 'desc' },
        });
    }
    async createMealLog(memberId, dto) {
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
    async getMealLogs(memberId) {
        return this.prisma.mealLog.findMany({
            where: { memberId },
            orderBy: { timestamp: 'desc' },
        });
    }
    async getCoachAdvice(memberId) {
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
            throw new common_1.NotFoundException('Member profile not found');
        }
        const totalWorkouts = await this.prisma.workoutSession.count({ where: { memberId } });
        const lastSession = member.sessions[0];
        const avgPostureScore = lastSession && lastSession.sets.length > 0
            ? Math.round(lastSession.sets.reduce((sum, s) => sum + (s.postureScore ?? 100), 0) / lastSession.sets.length)
            : 95;
        let recommendation = '';
        let dietSplit = '';
        if (totalWorkouts < 2) {
            recommendation = `Welcome ${member.name}! Let's start this week with a Full-Body conditioning split. Focus on learning compound shapes.`;
            dietSplit = 'Maintenance Macros: 40% Carbs, 30% Protein, 30% Fats. Aim for 2200 kcal/day.';
        }
        else {
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
};
exports.MemberFeaturesService = MemberFeaturesService;
exports.MemberFeaturesService = MemberFeaturesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MemberFeaturesService);
//# sourceMappingURL=member-features.service.js.map