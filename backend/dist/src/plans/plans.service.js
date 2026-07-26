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
exports.PlansService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let PlansService = class PlansService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPlan(gymId, dto) {
        return this.prisma.membershipPlan.create({
            data: {
                gymId,
                name: dto.name,
                durationDays: dto.durationDays,
                price: dto.price,
                freezeLimitDays: dto.freezeLimitDays ?? 30,
                allowedEntryHoursStart: dto.allowedEntryHoursStart ?? '05:00:00',
                allowedEntryHoursEnd: dto.allowedEntryHoursEnd ?? '23:00:00',
            },
        });
    }
    async findAllPlans(gymId) {
        return this.prisma.membershipPlan.findMany({
            where: { gymId },
            orderBy: { price: 'asc' },
        });
    }
    async findPlanById(id) {
        const plan = await this.prisma.membershipPlan.findUnique({
            where: { id },
        });
        if (!plan) {
            throw new common_1.NotFoundException('Plan not found');
        }
        return plan;
    }
    async subscribeMember(dto) {
        const member = await this.prisma.user.findUnique({
            where: { id: dto.memberId },
        });
        if (!member) {
            throw new common_1.NotFoundException('Member not found');
        }
        const plan = await this.findPlanById(dto.planId);
        const start = dto.startDate ? new Date(dto.startDate) : new Date();
        const end = new Date(start);
        end.setDate(start.getDate() + plan.durationDays);
        await this.prisma.memberSubscription.updateMany({
            where: {
                memberId: dto.memberId,
                status: client_1.MemberStatus.ACTIVE,
            },
            data: {
                status: client_1.MemberStatus.EXPIRED,
            },
        });
        const subscription = await this.prisma.memberSubscription.create({
            data: {
                memberId: dto.memberId,
                planId: plan.id,
                status: client_1.MemberStatus.ACTIVE,
                startDate: start,
                endDate: end,
            },
        });
        const payment = await this.prisma.payment.create({
            data: {
                subscriptionId: subscription.id,
                memberId: dto.memberId,
                amount: plan.price,
                status: client_1.PaymentStatus.UNPAID,
                dueDate: start,
            },
        });
        await this.prisma.user.update({
            where: { id: dto.memberId },
            data: { status: client_1.MemberStatus.ACTIVE },
        });
        return { subscription, payment };
    }
    async recordPayment(paymentId, dto) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment record not found');
        }
        const updatedPayment = await this.prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: client_1.PaymentStatus.PAID,
                paymentMethod: dto.paymentMethod,
                transactionId: dto.transactionId,
                paidAt: new Date(),
            },
        });
        return updatedPayment;
    }
    async getPayments(gymId) {
        return this.prisma.payment.findMany({
            where: {
                member: { gymId },
            },
            include: {
                member: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                subscription: {
                    include: {
                        plan: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.PlansService = PlansService;
exports.PlansService = PlansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PlansService);
//# sourceMappingURL=plans.service.js.map