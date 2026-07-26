import { PrismaService } from '../prisma/prisma.service';
import { MemberStatus } from '@prisma/client';
export declare class MembersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: {
        email: string;
        name: string;
        phone?: string;
        gymId: string;
        planId?: string;
    }): Promise<{
        biometrics: {
            id: string;
            createdAt: Date;
            type: string;
            faceThumbnailUrl: string | null;
        }[];
        subscriptions: ({
            payments: {
                id: string;
                status: import("@prisma/client").$Enums.PaymentStatus;
                createdAt: Date;
                memberId: string;
                amount: import("@prisma/client-runtime-utils").Decimal;
                paymentMethod: string | null;
                transactionId: string | null;
                dueDate: Date;
                paidAt: Date | null;
                subscriptionId: string;
            }[];
            plan: {
                id: string;
                name: string;
                gymId: string;
                createdAt: Date;
                durationDays: number;
                price: import("@prisma/client-runtime-utils").Decimal;
                freezeLimitDays: number;
                allowedEntryHoursStart: string;
                allowedEntryHoursEnd: string;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.MemberStatus;
            createdAt: Date;
            startDate: Date;
            endDate: Date;
            freezeStart: Date | null;
            freezeEnd: Date | null;
            memberId: string;
            planId: string;
        })[];
        checkIns: {
            id: string;
            gymId: string;
            memberId: string | null;
            timestamp: Date;
            method: string;
            photoUrl: string | null;
            success: boolean;
            errorMessage: string | null;
            verifiedByStaffId: string | null;
        }[];
    } & {
        id: string;
        email: string;
        passwordHash: string;
        name: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.MemberStatus;
        gymId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(gymId: string, search?: string): Promise<{
        id: string;
        email: string;
        name: string;
        phone: string | null;
        status: import("@prisma/client").$Enums.MemberStatus;
        createdAt: Date;
        subscriptions: ({
            plan: {
                id: string;
                name: string;
                gymId: string;
                createdAt: Date;
                durationDays: number;
                price: import("@prisma/client-runtime-utils").Decimal;
                freezeLimitDays: number;
                allowedEntryHoursStart: string;
                allowedEntryHoursEnd: string;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.MemberStatus;
            createdAt: Date;
            startDate: Date;
            endDate: Date;
            freezeStart: Date | null;
            freezeEnd: Date | null;
            memberId: string;
            planId: string;
        })[];
    }[]>;
    findOne(id: string): Promise<{
        biometrics: {
            id: string;
            createdAt: Date;
            type: string;
            faceThumbnailUrl: string | null;
        }[];
        subscriptions: ({
            payments: {
                id: string;
                status: import("@prisma/client").$Enums.PaymentStatus;
                createdAt: Date;
                memberId: string;
                amount: import("@prisma/client-runtime-utils").Decimal;
                paymentMethod: string | null;
                transactionId: string | null;
                dueDate: Date;
                paidAt: Date | null;
                subscriptionId: string;
            }[];
            plan: {
                id: string;
                name: string;
                gymId: string;
                createdAt: Date;
                durationDays: number;
                price: import("@prisma/client-runtime-utils").Decimal;
                freezeLimitDays: number;
                allowedEntryHoursStart: string;
                allowedEntryHoursEnd: string;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.MemberStatus;
            createdAt: Date;
            startDate: Date;
            endDate: Date;
            freezeStart: Date | null;
            freezeEnd: Date | null;
            memberId: string;
            planId: string;
        })[];
        checkIns: {
            id: string;
            gymId: string;
            memberId: string | null;
            timestamp: Date;
            method: string;
            photoUrl: string | null;
            success: boolean;
            errorMessage: string | null;
            verifiedByStaffId: string | null;
        }[];
    } & {
        id: string;
        email: string;
        passwordHash: string;
        name: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.MemberStatus;
        gymId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: {
        name?: string;
        phone?: string;
        status?: MemberStatus;
    }): Promise<{
        id: string;
        email: string;
        name: string;
        phone: string | null;
        status: import("@prisma/client").$Enums.MemberStatus;
    }>;
    registerBiometrics(memberId: string, dto: {
        type: 'FACE' | 'FINGERPRINT';
        templateVector?: number[];
        fingerprintIndex?: number;
        faceThumbnailUrl?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        type: string;
        templateVector: number[];
        fingerprintIndex: number | null;
        encryptedVector: string | null;
        faceThumbnailUrl: string | null;
        userId: string;
    }>;
    toggleFreeze(memberId: string): Promise<{
        id: string;
        status: "ACTIVE" | "FROZEN";
    }>;
}
