import { MemberFeaturesService } from './member-features.service';
export declare class MemberFeaturesController {
    private memberFeaturesService;
    constructor(memberFeaturesService: MemberFeaturesService);
    logWorkout(req: any, dto: {
        date: Date;
        durationMinutes?: number;
        notes?: string;
        sets: {
            exerciseName: string;
            setNumber: number;
            weight: number;
            reps: number;
            rir?: number;
            postureScore?: number;
            feedbackSummary?: string;
        }[];
    }): Promise<{
        sets: {
            id: string;
            exerciseName: string;
            setNumber: number;
            weight: import("@prisma/client-runtime-utils").Decimal;
            reps: number;
            rir: number | null;
            postureScore: number | null;
            feedbackSummary: string | null;
            sessionId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        memberId: string;
        date: Date;
        durationMinutes: number | null;
        notes: string | null;
    }>;
    getWorkoutHistory(req: any): Promise<({
        sets: {
            id: string;
            exerciseName: string;
            setNumber: number;
            weight: import("@prisma/client-runtime-utils").Decimal;
            reps: number;
            rir: number | null;
            postureScore: number | null;
            feedbackSummary: string | null;
            sessionId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        memberId: string;
        date: Date;
        durationMinutes: number | null;
        notes: string | null;
    })[]>;
    logMeal(req: any, dto: {
        textDescription: string;
        photoUrl?: string;
        estimatedCalories?: number;
        estimatedProtein?: number;
        estimatedCarbs?: number;
        estimatedFat?: number;
        loggedMethod: 'TEXT' | 'BARCODE' | 'PHOTO';
    }): Promise<{
        id: string;
        memberId: string;
        timestamp: Date;
        photoUrl: string | null;
        textDescription: string;
        estimatedCalories: number | null;
        estimatedProtein: number | null;
        estimatedCarbs: number | null;
        estimatedFat: number | null;
        loggedMethod: string;
    }>;
    getMealLogs(req: any): Promise<{
        id: string;
        memberId: string;
        timestamp: Date;
        photoUrl: string | null;
        textDescription: string;
        estimatedCalories: number | null;
        estimatedProtein: number | null;
        estimatedCarbs: number | null;
        estimatedFat: number | null;
        loggedMethod: string;
    }[]>;
    getCoachAdvice(req: any): Promise<{
        success: boolean;
        coachName: string;
        advice: string;
        dietGuideline: string;
        postureAudit: {
            averageScore: number;
            alertExercises: string[];
            tips: string;
        };
        nextWeekWorkoutSplit: {
            day: string;
            split: string;
        }[];
    }>;
}
