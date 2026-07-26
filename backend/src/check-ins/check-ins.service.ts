import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckInsGateway } from './check-ins.gateway';
import { MemberStatus } from '@prisma/client';

@Injectable()
export class CheckInsService {
  constructor(
    private prisma: PrismaService,
    private gateway: CheckInsGateway,
  ) {}

  async verifyCheckIn(dto: {
    gymId: string;
    memberId?: string;
    email?: string;
    method: 'FACE' | 'FINGERPRINT' | 'QR' | 'MANUAL';
    photoUrl?: string;
  }) {
    let memberId = dto.memberId;

    // Find member by email if ID not provided
    if (!memberId && dto.email) {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (user) memberId = user.id;
    }

    if (!memberId) {
      // Create failure log
      const log = await this.prisma.checkInLog.create({
        data: {
          gymId: dto.gymId,
          method: dto.method,
          success: false,
          errorMessage: 'Member not found',
          photoUrl: dto.photoUrl,
        },
      });
      this.gateway.broadcastCheckIn({ ...log, memberName: 'Unknown Member' });
      throw new NotFoundException('Member not found');
    }

    const member = await this.prisma.user.findUnique({
      where: { id: memberId },
      include: {
        subscriptions: {
          where: { status: MemberStatus.ACTIVE },
          include: { plan: true },
        },
        biometrics: {
          select: { faceThumbnailUrl: true },
          take: 1,
        },
      },
    });

    if (!member) {
      const log = await this.prisma.checkInLog.create({
        data: {
          gymId: dto.gymId,
          method: dto.method,
          success: false,
          errorMessage: 'Member not found',
          photoUrl: dto.photoUrl,
        },
      });
      this.gateway.broadcastCheckIn({ ...log, memberName: 'Unknown Member' });
      throw new NotFoundException('Member not found');
    }

    // Check status
    if (member.status === MemberStatus.FROZEN) {
      const log = await this.prisma.checkInLog.create({
        data: {
          gymId: dto.gymId,
          memberId: member.id,
          method: dto.method,
          success: false,
          errorMessage: 'Membership is frozen',
          photoUrl: dto.photoUrl,
        },
      });
      this.gateway.broadcastCheckIn({ ...log, memberName: member.name });
      return { authorized: false, reason: 'Membership is frozen', memberName: member.name };
    }

    if (member.status === MemberStatus.CANCELLED || member.status === MemberStatus.EXPIRED) {
      const log = await this.prisma.checkInLog.create({
        data: {
          gymId: dto.gymId,
          memberId: member.id,
          method: dto.method,
          success: false,
          errorMessage: `Membership is ${member.status.toLowerCase()}`,
          photoUrl: dto.photoUrl,
        },
      });
      this.gateway.broadcastCheckIn({ ...log, memberName: member.name });
      return { authorized: false, reason: `Membership is ${member.status.toLowerCase()}`, memberName: member.name };
    }

    // Check subscriptions
    const activeSub = member.subscriptions[0];
    if (!activeSub) {
      const log = await this.prisma.checkInLog.create({
        data: {
          gymId: dto.gymId,
          memberId: member.id,
          method: dto.method,
          success: false,
          errorMessage: 'No active subscription plan found',
          photoUrl: dto.photoUrl,
        },
      });
      this.gateway.broadcastCheckIn({ ...log, memberName: member.name });
      return { authorized: false, reason: 'No active subscription', memberName: member.name };
    }

    // Check plan expiration date
    const now = new Date();
    if (now > activeSub.endDate) {
      // Autoexpire subscription
      await this.prisma.memberSubscription.update({
        where: { id: activeSub.id },
        data: { status: MemberStatus.EXPIRED },
      });
      await this.prisma.user.update({
        where: { id: member.id },
        data: { status: MemberStatus.EXPIRED },
      });

      const log = await this.prisma.checkInLog.create({
        data: {
          gymId: dto.gymId,
          memberId: member.id,
          method: dto.method,
          success: false,
          errorMessage: 'Subscription has expired',
          photoUrl: dto.photoUrl,
        },
      });
      this.gateway.broadcastCheckIn({ ...log, memberName: member.name });
      return { authorized: false, reason: 'Subscription has expired', memberName: member.name };
    }

    // Check hours limits
    const currentHourString = now.toTimeString().split(' ')[0]; // "HH:MM:SS"
    const startHour = activeSub.plan.allowedEntryHoursStart;
    const endHour = activeSub.plan.allowedEntryHoursEnd;

    if (currentHourString < startHour || currentHourString > endHour) {
      const log = await this.prisma.checkInLog.create({
        data: {
          gymId: dto.gymId,
          memberId: member.id,
          method: dto.method,
          success: false,
          errorMessage: `Entry outside plan hours (${startHour} - ${endHour})`,
          photoUrl: dto.photoUrl,
        },
      });
      this.gateway.broadcastCheckIn({ ...log, memberName: member.name });
      return { authorized: false, reason: `Allowed hours are: ${startHour} to ${endHour}`, memberName: member.name };
    }

    // Success check-in
    const log = await this.prisma.checkInLog.create({
      data: {
        gymId: dto.gymId,
        memberId: member.id,
        method: dto.method,
        success: true,
        photoUrl: dto.photoUrl,
      },
    });

    // Broadcast success
    this.gateway.broadcastCheckIn({
      id: log.id,
      gymId: log.gymId,
      memberId: log.memberId,
      memberName: member.name,
      method: log.method,
      success: log.success,
      timestamp: log.timestamp,
      photoUrl: dto.photoUrl || member.biometrics[0]?.faceThumbnailUrl || null,
    });

    return { authorized: true, memberName: member.name, planName: activeSub.plan.name };
  }

  async manualOverride(gymId: string, staffId: string, memberId: string) {
    const member = await this.prisma.user.findUnique({
      where: { id: memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const log = await this.prisma.checkInLog.create({
      data: {
        gymId,
        memberId,
        method: 'MANUAL',
        success: true,
        verifiedByStaffId: staffId,
      },
    });

    this.gateway.broadcastCheckIn({
      id: log.id,
      gymId: log.gymId,
      memberId: log.memberId,
      memberName: member.name,
      method: log.method,
      success: log.success,
      timestamp: log.timestamp,
      photoUrl: null,
    });

    return { success: true, memberName: member.name };
  }

  async getLogs(gymId: string) {
    const logs = await this.prisma.checkInLog.findMany({
      where: { gymId },
      include: {
        member: {
          select: {
            name: true,
            email: true,
            biometrics: {
              select: { faceThumbnailUrl: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    return logs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp,
      method: log.method,
      success: log.success,
      errorMessage: log.errorMessage,
      memberName: log.member?.name || 'Unknown/Device Error',
      photoUrl: log.photoUrl || log.member?.biometrics[0]?.faceThumbnailUrl || null,
    }));
  }
}
