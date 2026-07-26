"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
let MembersService = class MembersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const passwordHash = await bcrypt.hash('Welcome@123', 10);
        const member = await this.prisma.user.create({
            data: {
                email: dto.email.toLowerCase(),
                passwordHash,
                name: dto.name,
                phone: dto.phone,
                role: client_1.Role.MEMBER,
                status: client_1.MemberStatus.ACTIVE,
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
                        status: client_1.MemberStatus.ACTIVE,
                        startDate,
                        endDate,
                    },
                });
            }
        }
        return this.findOne(member.id);
    }
    async findAll(gymId, search) {
        return this.prisma.user.findMany({
            where: {
                gymId,
                role: client_1.Role.MEMBER,
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
    async findOne(id) {
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
        if (!member || member.role !== client_1.Role.MEMBER) {
            throw new common_1.NotFoundException('Member not found');
        }
        return member;
    }
    async update(id, dto) {
        await this.findOne(id);
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
    async registerBiometrics(memberId, dto) {
        await this.findOne(memberId);
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
    async toggleFreeze(memberId) {
        const member = await this.findOne(memberId);
        const currentStatus = member.status;
        let nextStatus = client_1.MemberStatus.ACTIVE;
        let freezeStart = null;
        let freezeEnd = null;
        if (currentStatus === client_1.MemberStatus.ACTIVE) {
            nextStatus = client_1.MemberStatus.FROZEN;
            freezeStart = new Date();
            freezeEnd = new Date();
            freezeEnd.setDate(freezeEnd.getDate() + 30);
        }
        await this.prisma.user.update({
            where: { id: memberId },
            data: { status: nextStatus },
        });
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
};
exports.MembersService = MembersService;
exports.MembersService = MembersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MembersService);
//# sourceMappingURL=members.service.js.map