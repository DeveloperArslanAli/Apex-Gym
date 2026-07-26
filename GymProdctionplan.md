

## Product Vision
A unified ecosystem where gym owners can fully manage operations—memberships, fees, and biometric access—while members receive an AI-guided training and nutrition experience, including real-time posture correction. The platform bridges operational efficiency with personalised coaching, using computer vision and generative AI to improve safety and results.

---

## User Roles & Personas

1. **Super Admin (Gym Owner / Manager)**
   - Full access via web dashboard.
   - Manages staff, members, plans, payments, and gym access rules.
   - Views real-time occupancy and entry logs.

2. **Staff / Receptionist**
   - Limited web/app access.
   - Checks in members manually if biometrics fail.
   - Handles walk-in registrations and payment collection.

3. **Gym Member (User)**
   - Uses hybrid mobile app (iOS/Android).
   - Logs workouts & meals, receives AI suggestions.
   - Uses phone camera for posture analysis during exercises.
   - Gains entry via fingerprint or facial recognition at the gym kiosk.

---

## Feature Set

### A. Web Application (Admin & Management Portal)
Built as a responsive SPA, also works on tablets at reception.

| Module | Features |
|--------|----------|
| **Dashboard** | Key metrics: active members, today’s check-ins, revenue, occupancy, overdue fees. Graphs for attendance trends. |
| **Member Management** | Register/edit members. Capture biometrics (fingerprint, face). Assign membership plans. View attendance history, payment logs. Freeze/cancel memberships. |
| **Plan & Fee Management** | Create/edit plans (duration, price, freeze rules). Automated invoicing. Payment tracking (cash, card, online). Overdue alerts. POS integration for supplements/services. |
| **Entry & Access Control** | Live entry log with timestamp, photo, method (fingerprint/face). Manual override. Set allowed entry hours per plan. Trigger alerts for invalid attempts. |
| **Staff Management** | Role-based access (owner, receptionist, trainer). Shift scheduling. |
| **Equipment & Class Scheduling** | Inventory of machines. Schedule group classes, cap attendees. Booking management. |
| **Reports & Analytics** | Revenue reports, attendance heatmaps, membership churn, device (fingerprint scanner) status. |
| **Communication** | Push/email notifications for fee reminders, announcements. |

### B. Hybrid Mobile App (Members)
Built with cross-platform framework for iOS and Android.

| Module | Features |
|--------|----------|
| **Onboarding & Profile** | Sign up / login. Upload photos for face recognition (encrypted). Register fingerprint (via gym kiosk). Set goals (weight loss, muscle gain), fitness level, health info. |
| **Workout Logging** | Start a workout session. Add exercises from library (600+ exercises with GIFs). Log sets, reps, weight, RIR. Timer between sets. Notes. Full history with calendar view. |
| **AI Posture Tracking (Real-time)** | During exercise, open camera. Pose estimation model runs on-device (TensorFlow Lite). Compares user’s pose with reference. Real-time audio/visual cues (“Straighten back”, “Knees out”). Post-workout report with snapshots and tips. |
| **Meal Logging** | Log meals via text, barcode scan, or photo. Food database with macros. AI can analyse meal photo to estimate calories (computer vision). Daily macro/micro tracker. Water intake. |
| **AI Coach Suggestions** | Based on goals, workout history, and meal logs, AI generates next week’s workout split and meal plan. Offers exercise substitutions if equipment is busy or injury flagged. Chatbot for Q&A (GPT-4 with fine-tuned context). |
| **Gym Access** | See check-in history. Receive a dynamic QR code for backup entry (if biometrics unavailable). |
| **Social & Gamification** | Challenges, leaderboards, badges for streak, PRs, body measurements progress photos. |
| **Notifications** | Plan expiry, payment due, class reminders, new suggestions ready. |

### C. Gym Entry Kiosk (Tablet / Web-based)
- Fixed tablet at entrance running a lightweight web app (or native wrapper) with camera access.
- Screen: “Place finger on scanner” / “Look at camera”.
- Integrates with USB/Bluetooth fingerprint scanner and tablet camera for face recognition.
- On success, gate opens (via relay/API) and log is recorded. Screen shows member photo & name, plus plan validity.
- On failure, prompts staff assistance.

---

## Technical Architecture

### High-Level Diagram
```
[Mobile App (React Native)] <--> [Backend API (NestJS)] <--> [PostgreSQL + Redis]
                                     |
[Admin Web (Next.js)]  <--------------|
                                     |
[Kiosk Web / Tablet]  <--------------|
                                     |
[AI Services (Python/FastAPI)] <------|
                                     |
[Hardware Bridge Service] <----------|
```

### Frontend
- **Admin Web**: Next.js (React) with Tailwind CSS. SSR for initial load, client-side for interactive dashboards. PWA ready.
- **Mobile App**: React Native (Expo for fast iteration) + Native modules for camera/TF Lite.
- **Kiosk App**: Standalone React web app hosted on local tablet, communicates with backend via REST/WebSocket. Uses WebRTC / getUserMedia for camera. Fingerprint SDK integrated at OS level or via a local bridge service.

### Backend
- **Core API**: NestJS (Node.js + TypeScript) – modular, opinionated, good for enterprise.
- **Database**: PostgreSQL (primary store), Redis (caching, real-time occupancy, session store).
- **File/Image Storage**: AWS S3 / Cloudflare R2 (face templates, meal photos, posture snapshots).
- **Real-time**: Socket.io (for live occupancy dashboard, instant entry notifications).
- **Authentication**: JWT + OAuth2 (Google/Apple). Biometric templates stored as encrypted vectors (not raw images).
- **Payment Integration**: Stripe / Razorpay for online payments.

### AI / ML Stack
- **Posture Analysis**: TensorFlow Lite model (MoveNet MultiPose) running on-device in React Native via `react-native-fast-tflite`. Exercise classification and angle calculation (using ML Kit Pose Detection). Reference pose database per exercise. Feedback logic in JS or small native module.
- **AI Suggestions**: OpenAI GPT-4 API (or fine-tuned Llama 3 on-prem) with retrieval-augmented generation over user’s workout/meal history, goals, and gym equipment. Prompt engineering with strict safety and instructional guardrails.
- **Meal Photo Calorie Estimation**: Cloud vision model (e.g., fine-tuned YOLOv8 + nutrition DB) served via a separate Python FastAPI microservice. Can run as serverless function.
- **Face Recognition**: For entry, use a local face matching library (e.g., face-api.js or TensorFlow.js with FaceNet) on the kiosk device itself to avoid latency and bandwidth. Match against downloaded encrypted embeddings of active members (synced nightly). Backup: AWS Rekognition if cloud is acceptable.

### Hardware Integration
- **Fingerprint Scanner**: Support for ZKTeco, SecuGen, or DigitalPersona via their REST/WebSocket SDKs. If no network API, a lightweight Node.js bridge service runs on the kiosk device that communicates with the scanner via USB/Serial and exposes a local HTTP endpoint. The web app calls it.
- **Door Relay**: A smart relay (e.g., ESP32) triggered by an API call from the kiosk backend after successful biometric verification.

---

## AI & Posture Tracking – Detailed Flow
1. Member selects “Squat” exercise and taps “Start Form Check”.
2. Camera opens (back camera), lightweight MoveNet model detects 17 body keypoints at 30 FPS.
3. App calculates joint angles (hip, knee, ankle) in real-time.
4. Angles compared to ideal range for squat (e.g., knee flexion 80-110° at bottom).
5. If deviation exceeds threshold, audio cue “Go deeper” or “Knees caving in – push outward” via text-to-speech.
6. Every rep counted, quality scored (0-100%). Feedback summarised post-set.
7. Process runs completely on-device (no video leaves phone) for privacy and low latency.

---

## Fast-Track Development Plan (5 Months to Full Product)

**Team:** 1 PM/Lead, 2 Full-Stack Devs (Node + React/Next + RN), 1 ML Engineer (TF Lite/Pose), 1 QA.  
**Methodology:** Agile, 2-week sprints. MVP first, then enriched AI features.

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: Foundation** | Weeks 1-4 | Admin web: Member CRUD, plan setup, basic dashboard. Mobile: Auth, profile, view plans. Backend: Auth, database schema, API. CI/CD. |
| **Phase 2: Operations** | Weeks 5-8 | Fee/payment tracking, invoicing. Member self-registration portal. Entry kiosk web (manual check-in, QR code). Workout logging (manual, no AI). Meal logging (text). |
| **Phase 3: Biometric Entry** | Weeks 9-12 | Integrate fingerprint scanner (bridge service), face capture & local matching on kiosk. Auto-entry logging, door relay trigger. Admin live entry dashboard. |
| **Phase 4: AI Coach MVP** | Weeks 13-16 | GPT-4 integration for workout/meal plan generation based on goals and history. Chatbot assistant. Meal photo calorie estimation (basic). Push notifications for suggestions. |
| **Phase 5: Posture Tracking** | Weeks 17-19 | Integrate TF Lite pose model on mobile. Build exercise-specific angle rules and audio feedback. Offline processing and post-set report. |
| **Phase 6: Polish & Launch** | Weeks 20-22 | Gamification, social challenges. Admin reports, multi-gym support (if needed). End-to-end testing, security audit, app store submission. |

**MVP (Phase 1+2) could go live in 8 weeks** with manual entry (QR/ID) and basic workout/meal logging, no AI or biometrics. AI and biometrics added incrementally.

---

## Potential Challenges & Mitigations

- **Biometric privacy**: Never send raw fingerprint or face images to cloud. Store templates as irreversible vectors; encrypt at rest. Kiosk performs matching locally.
- **Posture tracking accuracy**: Lighting, angle, clothing can degrade detection. Mitigation: guided calibration step before set, fallback to side-view guidance. Use model robust to occlusions (MoveNet). Offer option to upload video for trainer review.
- **Offline support**: Gym entry must work if internet is down. Kiosk caches member biometric data and logs locally, syncs later. Use local-first storage.
- **Scalability**: Start with single gym, but structure DB for multi-tenancy. Use row-level security or separate schemas.
- **Fast-track risk**: Scope creep. Prioritise based on “must-have” for MVP – fee/entry management and basic logging; AI features can launch as beta.

---

## Recommended Tech Stack Summary

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Admin Web | Next.js (React), Tailwind | SEO-friendly, fast DX, rich ecosystem |
| Mobile App | React Native (Expo) | Single codebase for iOS/Android, large community, easy TF Lite integration |
| Kiosk App | Next.js (PWA) on tablet | Reuse web components, camera access via browser API |
| Backend API | NestJS (Node.js) | Structured, scalable, WebSocket support out-of-box |
| Database | PostgreSQL + Redis | Robust relational store + caching/presence |
| Real-time | Socket.io | Live dashboard, entry events |
| AI Inference (on-device) | TensorFlow Lite, MoveNet | Low latency, privacy-preserving posture tracking |
| AI Cloud API | OpenAI GPT-4 / Llama 3 | Personalised plans, Q&A |
| Vision (Cloud) | Python FastAPI, YOLOv8 | Meal photo estimation |
| Hardware Bridge | Node.js local service + REST API | Abstracts scanner communication |
| DevOps | Docker, GitHub Actions, Vercel (Web), ECS (backend) | Fast deployment |

---

This plan delivers a feature-rich, AI-driven gym ecosystem that can be built incrementally, with a clear path from MVP to full launch. The hybrid mobile app ensures wide reach, while the web dashboard gives owners complete control. Biometric entry and real-time posture feedback differentiate the product and directly address the original request.