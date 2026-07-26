# Tasks Checklist

## Phase 1: Database and Core Backend Setup
- [ ] Initialize NestJS backend project
- [ ] Install Prisma ORM and configure PostgreSQL connection
- [ ] Implement database models and run migrations
- [ ] Implement authentication (JWT-based) and RBAC decorators/guards
- [ ] Seed base roles (Super Admin, Staff, Member) and test data

## Phase 2: Operations & Management APIs
- [ ] Implement Members CRUD endpoints
- [ ] Implement Membership Plan and Subscriptions endpoints
- [ ] Implement Check-in endpoint (face/fingerprint simulation and verification)
- [ ] Add Socket.io for broadcasting live check-ins

## Phase 3: Web Admin Portal (Next.js)
- [ ] Initialize Next.js admin frontend
- [ ] Implement modern, premium Dashboard layout (charts, occupancy metrics)
- [ ] Implement Member Management table & profile enrollment drawer
- [ ] Implement Live Check-In stream widget via WebSocket
- [ ] Implement Manual Override check-in button

## Phase 4: Kiosk Simulation & WebRTC
- [ ] Implement Kiosk layout (tablet scanner simulation view)
- [ ] Integrate mock camera capture and local embedding matching simulation
- [ ] Add trigger gateway simulation to call the smart relay

## Phase 5: Member API & Walkthrough
- [ ] Implement Member dashboard API (workout logs, macros tracking, AI advisor)
- [ ] Verify system integration and permissions
- [ ] Create walkthrough.md documentation
