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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const bcrypt = __importStar(require("bcrypt"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/gym_db?schema=public',
});
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('Seeding database...');
    const gymId = '99e843c0-3079-4d64-8845-a7b3e10fa53f';
    await prisma.checkInLog.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.memberSubscription.deleteMany();
    await prisma.membershipPlan.deleteMany();
    await prisma.biometricCredential.deleteMany();
    await prisma.workoutSet.deleteMany();
    await prisma.workoutSession.deleteMany();
    await prisma.user.deleteMany();
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const admin = await prisma.user.create({
        data: {
            email: 'admin@gym.com',
            passwordHash: adminPasswordHash,
            name: 'John Doe (Owner)',
            phone: '+1234567890',
            role: client_1.Role.SUPER_ADMIN,
            status: client_1.MemberStatus.ACTIVE,
            gymId,
        },
    });
    const staffPasswordHash = await bcrypt.hash('Staff@123', 10);
    const staff = await prisma.user.create({
        data: {
            email: 'staff@gym.com',
            passwordHash: staffPasswordHash,
            name: 'Sarah Connor (Receptionist)',
            phone: '+1987654321',
            role: client_1.Role.STAFF,
            status: client_1.MemberStatus.ACTIVE,
            gymId,
        },
    });
    const memberPasswordHash = await bcrypt.hash('Member@123', 10);
    const member = await prisma.user.create({
        data: {
            email: 'member@gym.com',
            passwordHash: memberPasswordHash,
            name: 'Arnold Schwarzenegger',
            phone: '+1555999000',
            role: client_1.Role.MEMBER,
            status: client_1.MemberStatus.ACTIVE,
            gymId,
        },
    });
    console.log('Users created successfully.');
    const platinumPlan = await prisma.membershipPlan.create({
        data: {
            gymId,
            name: 'Platinum Annual Membership',
            durationDays: 365,
            price: 999.99,
            freezeLimitDays: 60,
            allowedEntryHoursStart: '05:00:00',
            allowedEntryHoursEnd: '23:30:00',
        },
    });
    const goldPlan = await prisma.membershipPlan.create({
        data: {
            gymId,
            name: 'Gold Monthly Membership',
            durationDays: 30,
            price: 99.99,
            freezeLimitDays: 7,
            allowedEntryHoursStart: '06:00:00',
            allowedEntryHoursEnd: '22:00:00',
        },
    });
    const silverPlan = await prisma.membershipPlan.create({
        data: {
            gymId,
            name: 'Silver Off-Peak Membership',
            durationDays: 30,
            price: 59.99,
            freezeLimitDays: 0,
            allowedEntryHoursStart: '09:00:00',
            allowedEntryHoursEnd: '16:00:00',
        },
    });
    console.log('Membership plans created.');
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30);
    const subscription = await prisma.memberSubscription.create({
        data: {
            memberId: member.id,
            planId: goldPlan.id,
            status: client_1.MemberStatus.ACTIVE,
            startDate,
            endDate,
        },
    });
    console.log('Subscription created.');
    await prisma.payment.create({
        data: {
            subscriptionId: subscription.id,
            memberId: member.id,
            amount: goldPlan.price,
            status: client_1.PaymentStatus.PAID,
            paymentMethod: 'CARD',
            transactionId: 'ch_mock123456789',
            dueDate: startDate,
            paidAt: startDate,
        },
    });
    const pastSubscription = await prisma.memberSubscription.create({
        data: {
            memberId: member.id,
            planId: silverPlan.id,
            status: client_1.MemberStatus.EXPIRED,
            startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
    });
    await prisma.payment.create({
        data: {
            subscriptionId: pastSubscription.id,
            memberId: member.id,
            amount: silverPlan.price,
            status: client_1.PaymentStatus.OVERDUE,
            dueDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        },
    });
    console.log('Payments created.');
    await prisma.biometricCredential.create({
        data: {
            userId: member.id,
            type: 'FACE',
            templateVector: Array.from({ length: 128 }, () => Math.random()),
            faceThumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200',
        },
    });
    await prisma.checkInLog.create({
        data: {
            gymId,
            memberId: member.id,
            method: 'FACE',
            success: true,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
    });
    await prisma.checkInLog.create({
        data: {
            gymId,
            memberId: member.id,
            method: 'QR',
            success: true,
            timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000),
        },
    });
    console.log('Seeding completed successfully.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
});
//# sourceMappingURL=seed.js.map