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
exports.CheckInsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const check_ins_gateway_1 = require("./check-ins.gateway");
const client_1 = require("@prisma/client");
let CheckInsService = class CheckInsService {
    prisma;
    gateway;
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
    }
    async verifyCheckIn(dto) {
        let memberId = dto.memberId;
        if (!memberId && dto.email) {
            const user = await this.prisma.user.findUnique({
                where: { email: dto.email.toLowerCase() },
            });
            if (user)
                memberId = user.id;
        }
        if (!memberId) {
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
            throw new common_1.NotFoundException('Member not found');
        }
        const member = await this.prisma.user.findUnique({
            where: { id: memberId },
            include: {
                subscriptions: {
                    where: { status: client_1.MemberStatus.ACTIVE },
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
            throw new common_1.NotFoundException('Member not found');
        }
        if (member.status === client_1.MemberStatus.FROZEN) {
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
        if (member.status === client_1.MemberStatus.CANCELLED || member.status === client_1.MemberStatus.EXPIRED) {
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
        const now = new Date();
        if (now > activeSub.endDate) {
            await this.prisma.memberSubscription.update({
                where: { id: activeSub.id },
                data: { status: client_1.MemberStatus.EXPIRED },
            });
            await this.prisma.user.update({
                where: { id: member.id },
                data: { status: client_1.MemberStatus.EXPIRED },
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
        const currentHourString = now.toTimeString().split(' ')[0];
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
        const log = await this.prisma.checkInLog.create({
            data: {
                gymId: dto.gymId,
                memberId: member.id,
                method: dto.method,
                success: true,
                photoUrl: dto.photoUrl,
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
            photoUrl: dto.photoUrl || member.biometrics[0]?.faceThumbnailUrl || null,
        });
        return { authorized: true, memberName: member.name, planName: activeSub.plan.name };
    }
    async manualOverride(gymId, staffId, memberId) {
        const member = await this.prisma.user.findUnique({
            where: { id: memberId },
        });
        if (!member) {
            throw new common_1.NotFoundException('Member not found');
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
    async getLogs(gymId) {
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
};
exports.CheckInsService = CheckInsService;
exports.CheckInsService = CheckInsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        check_ins_gateway_1.CheckInsGateway])
], CheckInsService);
//# sourceMappingURL=check-ins.service.js.map