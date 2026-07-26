import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, MemberStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: {
    email: string;
    name: string;
    phone?: string;
    gymId: string;
    planId?: string;
  }) {
    // Generate default password
    const passwordHash = await bcrypt.hash('Welcome@123', 10);

    const member = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        phone: dto.phone,
        role: Role.MEMBER,
        status: MemberStatus.ACTIVE,
        gymId: dto.gymId,
      },
    });

    if (dto.planId) {
      const plan = await this.prisma.membershipPlan.findUnique({
        where: { id: dto.planId },
      });
      if (plan) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + plan.durationDays);

        await this.prisma.memberSubscription.create({
          data: {
            memberId: member.id,
            planId: plan.id,
            status: MemberStatus.ACTIVE,
            startDate,
            endDate,
          },
        });
      }
    }

    return this.findOne(member.id);
  }

  async findAll(gymId: string, search?: string) {
    return this.prisma.user.findMany({
      where: {
        gymId,
        role: Role.MEMBER,
        OR: search
          ? [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        status: true,
        createdAt: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            plan: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const member = await this.prisma.user.findUnique({
      where: { id },
      include: {
        subscriptions: {
          include: {
            plan: true,
            payments: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        biometrics: {
          select: {
            id: true,
            type: true,
            faceThumbnailUrl: true,
            createdAt: true,
          },
        },
        checkIns: {
          take: 10,
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!member || member.role !== Role.MEMBER) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  async update(id: string, dto: { name?: string; phone?: string; status?: MemberStatus }) {
    await this.findOne(id); // Ensure exists

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        status: true,
      },
    });
  }

  async registerBiometrics(
    memberId: string,
    dto: { type: 'FACE' | 'FINGERPRINT'; templateVector?: number[]; fingerprintIndex?: number; faceThumbnailUrl?: string },
  ) {
    await this.findOne(memberId); // Ensure exists

    return this.prisma.biometricCredential.create({
      data: {
        userId: memberId,
        type: dto.type,
        templateVector: dto.templateVector || [],
        fingerprintIndex: dto.fingerprintIndex,
        faceThumbnailUrl: dto.faceThumbnailUrl,
      },
    });
  }

  async toggleFreeze(memberId: string) {
    const member = await this.findOne(memberId);
    const currentStatus = member.status;

    let nextStatus: MemberStatus = MemberStatus.ACTIVE;
    let freezeStart: Date | null = null;
    let freezeEnd: Date | null = null;

    if (currentStatus === MemberStatus.ACTIVE) {
      nextStatus = MemberStatus.FROZEN;
      freezeStart = new Date();
      // Freeze for 30 days default
      freezeEnd = new Date();
      freezeEnd.setDate(freezeEnd.getDate() + 30);
    }

    // Update user status
    await this.prisma.user.update({
      where: { id: memberId },
      data: { status: nextStatus },
    });

    // Update active subscriptions
    const activeSub = member.subscriptions.find((s) => s.status === currentStatus);
    if (activeSub) {
      await this.prisma.memberSubscription.update({
        where: { id: activeSub.id },
        data: {
          status: nextStatus,
          freezeStart,
          freezeEnd,
        },
      });
    }

    return { id: memberId, status: nextStatus };
  }
}
