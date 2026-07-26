import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemberStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async createPlan(gymId: string, dto: {
    name: string;
    durationDays: number;
    price: number;
    freezeLimitDays?: number;
    allowedEntryHoursStart?: string;
    allowedEntryHoursEnd?: string;
  }) {
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

  async findAllPlans(gymId: string) {
    return this.prisma.membershipPlan.findMany({
      where: { gymId },
      orderBy: { price: 'asc' },
    });
  }

  async findPlanById(id: string) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id },
    });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    return plan;
  }

  async subscribeMember(dto: {
    memberId: string;
    planId: string;
    startDate?: Date;
  }) {
    const member = await this.prisma.user.findUnique({
      where: { id: dto.memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const plan = await this.findPlanById(dto.planId);

    const start = dto.startDate ? new Date(dto.startDate) : new Date();
    const end = new Date(start);
    end.setDate(start.getDate() + plan.durationDays);

    // Deactivate previous active subscriptions
    await this.prisma.memberSubscription.updateMany({
      where: {
        memberId: dto.memberId,
        status: MemberStatus.ACTIVE,
      },
      data: {
        status: MemberStatus.EXPIRED,
      },
    });

    const subscription = await this.prisma.memberSubscription.create({
      data: {
        memberId: dto.memberId,
        planId: plan.id,
        status: MemberStatus.ACTIVE,
        startDate: start,
        endDate: end,
      },
    });

    // Create corresponding unpaid payment record
    const payment = await this.prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        memberId: dto.memberId,
        amount: plan.price,
        status: PaymentStatus.UNPAID,
        dueDate: start,
      },
    });

    // Update user status
    await this.prisma.user.update({
      where: { id: dto.memberId },
      data: { status: MemberStatus.ACTIVE },
    });

    return { subscription, payment };
  }

  async recordPayment(paymentId: string, dto: { paymentMethod: string; transactionId?: string }) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.PAID,
        paymentMethod: dto.paymentMethod,
        transactionId: dto.transactionId,
        paidAt: new Date(),
      },
    });

    return updatedPayment;
  }

  async getPayments(gymId: string) {
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
}
