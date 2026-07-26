import { PrismaClient, Role, MemberStatus, PaymentStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/gym_db?schema=public',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  const gymId = '99e843c0-3079-4d64-8845-a7b3e10fa53f';

  // Cleanup existing data
  await prisma.checkInLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.memberSubscription.deleteMany();
  await prisma.membershipPlan.deleteMany();
  await prisma.biometricCredential.deleteMany();
  await prisma.workoutSet.deleteMany();
  await prisma.workoutSession.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@gym.com',
      passwordHash: adminPasswordHash,
      name: 'John Doe (Owner)',
      phone: '+1234567890',
      role: Role.SUPER_ADMIN,
      status: MemberStatus.ACTIVE,
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
      role: Role.STAFF,
      status: MemberStatus.ACTIVE,
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
      role: Role.MEMBER,
      status: MemberStatus.ACTIVE,
      gymId,
    },
  });

  console.log('Users created successfully.');

  // Create Membership Plans
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

  // Create Subscription for Member
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 30);

  const subscription = await prisma.memberSubscription.create({
    data: {
      memberId: member.id,
      planId: goldPlan.id,
      status: MemberStatus.ACTIVE,
      startDate,
      endDate,
    },
  });

  console.log('Subscription created.');

  // Create Payments
  await prisma.payment.create({
    data: {
      subscriptionId: subscription.id,
      memberId: member.id,
      amount: goldPlan.price,
      status: PaymentStatus.PAID,
      paymentMethod: 'CARD',
      transactionId: 'ch_mock123456789',
      dueDate: startDate,
      paidAt: startDate,
    },
  });

  // Overdue payment example
  const pastSubscription = await prisma.memberSubscription.create({
    data: {
      memberId: member.id,
      planId: silverPlan.id,
      status: MemberStatus.EXPIRED,
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.payment.create({
    data: {
      subscriptionId: pastSubscription.id,
      memberId: member.id,
      amount: silverPlan.price,
      status: PaymentStatus.OVERDUE,
      dueDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('Payments created.');

  // Create Mock Biometric Data for local kiosk testing
  await prisma.biometricCredential.create({
    data: {
      userId: member.id,
      type: 'FACE',
      templateVector: Array.from({ length: 128 }, () => Math.random()),
      faceThumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200',
    },
  });

  // Create Mock Check-In Logs
  await prisma.checkInLog.create({
    data: {
      gymId,
      memberId: member.id,
      method: 'FACE',
      success: true,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
  });

  await prisma.checkInLog.create({
    data: {
      gymId,
      memberId: member.id,
      method: 'QR',
      success: true,
      timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000), // 26 hours ago
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
