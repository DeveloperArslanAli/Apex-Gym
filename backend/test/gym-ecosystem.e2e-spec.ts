import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { io, Socket } from 'socket.io-client';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role, MemberStatus } from '@prisma/client';

describe('Gym Ecosystem (E2E Integration Test)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let socket: Socket;
  let socketEvents: any[] = [];

  let adminToken: string;
  let staffToken: string;
  let memberToken: string;
  const gymId = '99e843c0-3079-4d64-8845-a7b3e10fa53f';

  let testMemberId: string;
  let testPlanId: string;
  let testSubId: string;

  beforeAll(async () => {
    // Bootstrap NestJS App
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    
    await app.init();
    await app.listen(3333); // Run on port 3333 for WebSocket client connection

    prisma = app.get<PrismaService>(PrismaService);

    // Connect WebSocket Client
    socket = io('http://localhost:3333', {
      transports: ['websocket'],
    });

    socket.on('newCheckIn', (data) => {
      socketEvents.push(data);
    });

    await new Promise<void>((resolve) => {
      socket.on('connect', () => {
        resolve();
      });
    });

    // Obtain JWT authorization tokens
    const adminRes = await request(app.getHttpServer())
      .post('/api/auth/signin')
      .send({ email: 'admin@gym.com', password: 'Admin@123' });
    adminToken = adminRes.body.access_token;

    const staffRes = await request(app.getHttpServer())
      .post('/api/auth/signin')
      .send({ email: 'staff@gym.com', password: 'Staff@123' });
    staffToken = staffRes.body.access_token;

    const memberRes = await request(app.getHttpServer())
      .post('/api/auth/signin')
      .send({ email: 'member@gym.com', password: 'Member@123' });
    memberToken = memberRes.body.access_token;
  });

  afterAll(async () => {
    // Cleanup Socket
    if (socket) {
      socket.disconnect();
    }
    // Delete test specific records
    if (testMemberId) {
      await prisma.checkInLog.deleteMany({ where: { memberId: testMemberId } });
      await prisma.payment.deleteMany({ where: { memberId: testMemberId } });
      await prisma.memberSubscription.deleteMany({ where: { memberId: testMemberId } });
      await prisma.user.delete({ where: { id: testMemberId } });
    }
    if (testPlanId) {
      await prisma.membershipPlan.delete({ where: { id: testPlanId } });
    }

    await app.close();
  });

  describe('1. Role-Based Access Control (RBAC) Assertions', () => {
    it('Should DENY Staff trying to create a membership plan (403)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/plans')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          name: 'Staff Unauthorized Plan',
          durationDays: 30,
          price: 50.0,
        });

      expect(response.status).toBe(403);
    });

    it('Should ALLOW Admin to create a membership plan (201)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'E2E Testing Plan',
          durationDays: 30,
          price: 80.0,
          allowedEntryHoursStart: '00:00:00',
          allowedEntryHoursEnd: '23:59:59',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      testPlanId = response.body.id;
    });

    it('Should DENY Gym Member trying to view administrative entry logs (403)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/checkins/logs')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('2. Member Profile CRUD & Invoicing', () => {
    it('Should ALLOW Staff to register a member and assign active plan', async () => {
      // Create Member
      const memberResponse = await request(app.getHttpServer())
        .post('/api/members')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          email: 'qa_tester@gym.com',
          name: 'QA Automation Bot',
          phone: '+188899988',
          planId: testPlanId,
        });

      expect(memberResponse.status).toBe(201);
      expect(memberResponse.body).toHaveProperty('id');
      testMemberId = memberResponse.body.id;
      
      const activeSub = memberResponse.body.subscriptions[0];
      expect(activeSub).toBeDefined();
      expect(activeSub.plan.id).toBe(testPlanId);
      testSubId = activeSub.id;
    });
  });

  describe('3. Check-In Verification & Live Stream (WebSocket)', () => {
    beforeEach(() => {
      socketEvents = []; // Reset WebSocket buffer
    });

    it('TC-01: Valid Check-In should Grant Access and broadcast WebSocket event', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/checkins/verify')
        .set('Authorization', `Bearer ${staffToken}`) // Kiosk logs in as Staff
        .send({
          memberId: testMemberId,
          method: 'FACE',
        });

      console.log('TC-01 verify response:', response.body);

      expect(response.status).toBe(201);
      expect(response.body.authorized).toBe(true);
      expect(response.body.memberName).toBe('QA Automation Bot');

      // Wait for WS propagation
      await new Promise((r) => setTimeout(r, 100));

      expect(socketEvents.length).toBe(1);
      expect(socketEvents[0].memberName).toBe('QA Automation Bot');
      expect(socketEvents[0].success).toBe(true);
    });

    it('TC-02: Frozen Member should Deny Access and broadcast false log', async () => {
      // Freeze Member Account
      await request(app.getHttpServer())
        .post(`/api/members/${testMemberId}/freeze`)
        .set('Authorization', `Bearer ${staffToken}`);

      // Verify Checkin
      const response = await request(app.getHttpServer())
        .post('/api/checkins/verify')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          memberId: testMemberId,
          method: 'FINGERPRINT',
        });

      expect(response.status).toBe(201);
      expect(response.body.authorized).toBe(false);
      expect(response.body.reason).toContain('frozen');

      await new Promise((r) => setTimeout(r, 100));
      expect(socketEvents.length).toBe(1);
      expect(socketEvents[0].success).toBe(false);
      expect(socketEvents[0].errorMessage).toContain('frozen');

      // Unfreeze for remaining tests
      await request(app.getHttpServer())
        .post(`/api/members/${testMemberId}/freeze`)
        .set('Authorization', `Bearer ${staffToken}`);
    });

    it('TC-03: Expired Subscription should Deny Access and auto-expire account status', async () => {
      // Set subscription endDate to yesterday in DB
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await prisma.memberSubscription.update({
        where: { id: testSubId },
        data: { endDate: pastDate },
      });

      // Verify check-in
      const response = await request(app.getHttpServer())
        .post('/api/checkins/verify')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          memberId: testMemberId,
          method: 'QR',
        });

      expect(response.status).toBe(201);
      expect(response.body.authorized).toBe(false);
      expect(response.body.reason).toContain('expired');

      // Verify status auto-update
      const member = await prisma.user.findUnique({ where: { id: testMemberId } });
      expect(member?.status).toBe('EXPIRED');

      // Reset subscription validity to tomorrow
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      await prisma.memberSubscription.update({
        where: { id: testSubId },
        data: { endDate: futureDate, status: MemberStatus.ACTIVE },
      });
      await prisma.user.update({
        where: { id: testMemberId },
        data: { status: MemberStatus.ACTIVE },
      });
    });

    it('TC-04: Off-Peak Hours violation should Deny Access', async () => {
      // Calculate a time range that dynamically excludes the current hour
      const currentHour = new Date().getHours();
      const excludedStart = `${(currentHour + 2) % 24}:00:00`.padStart(8, '0');
      const excludedEnd = `${(currentHour + 3) % 24}:00:00`.padStart(8, '0');

      // Configure plan allowed hours outside current time
      await prisma.membershipPlan.update({
        where: { id: testPlanId },
        data: {
          allowedEntryHoursStart: excludedStart,
          allowedEntryHoursEnd: excludedEnd,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/api/checkins/verify')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          memberId: testMemberId,
          method: 'FACE',
        });

      expect(response.status).toBe(201);
      expect(response.body.authorized).toBe(false);
      expect(response.body.reason).toContain('hours');

      // Reset allowed hours
      await prisma.membershipPlan.update({
        where: { id: testPlanId },
        data: {
          allowedEntryHoursStart: '00:00:00',
          allowedEntryHoursEnd: '23:59:59',
        },
      });
    });

    it('TC-05: Non-existent member ID should yield 404 NotFound', async () => {
      const fakeUuid = 'b50fa712-40f4-44cc-8187-88cc99ddaaee';
      const response = await request(app.getHttpServer())
        .post('/api/checkins/verify')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          memberId: fakeUuid,
          method: 'FACE',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('4. Member Logging & AI Coach Advisor', () => {
    it('Should ALLOW member to log workouts and meals', async () => {
      // Log Workout
      const workoutRes = await request(app.getHttpServer())
        .post('/api/member/workout')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          date: new Date(),
          durationMinutes: 45,
          notes: 'Leg day integration check',
          sets: [
            { exerciseName: 'Squat', setNumber: 1, weight: 100, reps: 10, rir: 2, postureScore: 94, feedbackSummary: 'Form bracing stable' }
          ]
        });

      expect(workoutRes.status).toBe(201);
      expect(workoutRes.body).toHaveProperty('id');

      // Log Meal
      const mealRes = await request(app.getHttpServer())
        .post('/api/member/meal')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          textDescription: 'Chicken breast and jasmine rice bowl',
          loggedMethod: 'TEXT'
        });

      expect(mealRes.status).toBe(201);
      expect(mealRes.body).toHaveProperty('estimatedCalories');
    });

    it('Should ALLOW member to retrieve AI Coach advice tailored to metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/member/coach/advice')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('advice');
      expect(response.body).toHaveProperty('postureAudit');
      expect(response.body.postureAudit).toHaveProperty('averageScore');
    });
  });
});
