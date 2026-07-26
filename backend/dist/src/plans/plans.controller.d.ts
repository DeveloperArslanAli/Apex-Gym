import { PlansService } from './plans.service';
export declare class PlansController {
    private plansService;
    constructor(plansService: PlansService);
    createPlan(req: any, dto: {
        name: string;
        durationDays: number;
        price: number;
        freezeLimitDays?: number;
        allowedEntryHoursStart?: string;
        allowedEntryHoursEnd?: string;
    }): Promise<{
        id: string;
        name: string;
        gymId: string;
        createdAt: Date;
        durationDays: number;
        price: import("@prisma/client-runtime-utils").Decimal;
        freezeLimitDays: number;
        allowedEntryHoursStart: string;
        allowedEntryHoursEnd: string;
    }>;
    findAllPlans(req: any): Promise<{
        id: string;
        name: string;
        gymId: string;
        createdAt: Date;
        durationDays: number;
        price: import("@prisma/client-runtime-utils").Decimal;
        freezeLimitDays: number;
        allowedEntryHoursStart: string;
        allowedEntryHoursEnd: string;
    }[]>;
    subscribeMember(dto: {
        memberId: string;
        planId: string;
        startDate?: Date;
    }): Promise<{
        subscription: {
            id: string;
            status: import("@prisma/client").$Enums.MemberStatus;
            createdAt: Date;
            startDate: Date;
            endDate: Date;
            freezeStart: Date | null;
            freezeEnd: Date | null;
            memberId: string;
            planId: string;
        };
        payment: {
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
        };
    }>;
    recordPayment(paymentId: string, dto: {
        paymentMethod: string;
        transactionId?: string;
    }): Promise<{
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
    }>;
    getPayments(req: any): Promise<({
        member: {
            id: string;
            email: string;
            name: string;
        };
        subscription: {
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
        };
    } & {
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
    })[]>;
}
