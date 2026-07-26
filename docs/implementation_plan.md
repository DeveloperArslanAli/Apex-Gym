# Implementation Plan: Unified Gym Management & Member Ecosystem (MVP)

This plan outlines the architecture, database schema, user experience, and staging strategies to deliver a production-ready, minimal possible version (MVP) of the gym ecosystem. The MVP bridges operations (management, billing, and access control) with member services (workout/meal logs and basic offline-first kiosk entry) under a robust Role-Based Access Control (RBAC) mechanism.

---

## 1. Product Requirements Document (PRD)

### Product Vision
A unified ecosystem where gym owners can fully manage operations—memberships, fees, and biometric access—while members receive an AI-guided training and nutrition experience, including real-time posture correction. The platform bridges operational efficiency with personalised coaching, using computer vision and generative AI to improve safety and results.

### User Roles & Personas (RBAC Matrix)

The system enforces strict Role-Based Access Control (RBAC) across the Web Admin, Member Mobile, and Kiosk endpoints.

| Feature Module | Super Admin | Staff / Receptionist | Gym Member | Kiosk (Device Client) |
| :--- | :--- | :--- | :--- | :--- |
| **User & Staff Management** | Full CRUD | View Trainers / Staff Shift | Read self profile | Read-only verification |
| **Member Management** | Full CRUD | CRUD members, view histories | Read/Edit self profile | Read-only lookup |
| **Plan & Fee Management** | CRUD Plans, pricing, rules | View plans, register payments | View own plan, pay due fees | No Access |
| **Access Control (Kiosk)** | Live log view, override | Live log view, manual override | View own check-ins, show QR | Scan, verify, trigger gate |
| **Class & Equipment Booking** | Full CRUD | CRUD bookings, view lists | Book class, view schedule | No Access |
| **Reports & Analytics** | Full access to financial/churn | No Access | No Access | No Access |
| **Workout & Meal Log** | View stats (aggregated) | No Access | Full CRUD (own data) | No Access |
| **AI Suggestions & Coach** | Configure system prompts | No Access | Request plans, Q&A chat | No Access |

### Functional Requirements

#### A. Web Admin Portal
1. **Authentication**: Email/Password login. JWT session management. Session timeout.
2. **Dashboard**: Show real-time occupancy, active members count, daily check-ins, monthly revenue, and unpaid invoices. Attendance heatmaps.
3. **Member Management**: CRUD member profiles (name, phone, photo, subscription status). Register biometric templates (Face embed vectors and fingerprint indices). Freeze/cancel membership options.
4. **Plans & Billing**: Set up membership tiers (duration, cost, allowed hours, freeze rules). Auto-generate monthly invoice. Record payments (cash, card, online).
5. **Real-time Live Entry Feed**: Live log of check-ins displaying member profile picture, timestamp, method (fingerprint, face, or manual), and status. Manual check-in button for receptionist override.
6. **Class Scheduling**: Create group classes with capacity caps, assign trainers, manage member bookings.

#### B. Mobile Application (Gym Member)
1. **Onboarding & Profile Setup**: Sign up/in. Upload face photo (processed into local vectors and uploaded encrypted). Goals setup (weight loss, muscle gain).
2. **Workout Logging**: Browse exercise database. Create and log workouts (sets, weight, reps, RIR). Set timer notifications.
3. **AI Posture Tracking (MVP Scope)**: Camera framework initialization. Face-forward calibration overlay. Real-time joint angle calculations (e.g., knee flexion angle for Squats) using MoveNet/TF Lite on-device. Audio cues for form correction.
4. **Meal Logger**: Log food intake via text. Macro-nutrient progress dashboard (Carbs, Protein, Fats, Calories).
5. **AI Coach suggestions**: Periodized weekly workout suggestions based on logged sets and goals.
6. **Backup Check-in**: High-entropy dynamic QR code generator synced with server timestamp for backup entry.

#### C. Entry Kiosk App
1. **Scan Screen**: Dynamic screen with "Look at camera" or "Scan Fingerprint" guides.
2. **Local Embedding Matcher**: Caches active member face embeddings and runs local comparison to authenticate offline.
3. **Gate Relay Trigger**: Calls local HTTP bridge relay (`ESP32`) upon successful validation.
4. **Attendance Sync**: Buffers logs during offline periods and syncs up to backend once online.

### Non-Functional Requirements

1. **Security & Data Privacy**: 
   - Biometric data must **never** be stored as raw images on the cloud. Face images must be converted into 128-dimensional embedding vectors locally, encrypted at rest using AES-256.
   - Database passwords hashed using `bcrypt` or `argon2`.
   - SSL/TLS encryption for all HTTP/WebSocket traffic.
2. **Performance & Latency**:
   - Backend API response time < 100ms for common endpoints.
   - Kiosk face recognition match execution < 250ms.
   - Mobile Pose Estimation frame rate > 24 FPS on mid-range devices.
3. **Availability & Resilience**:
   - The Kiosk must remain operational offline for check-ins using SQLite local storage to match embeddings.
   - Real-time live dashboard must handle websocket reconnections seamlessly.
4. **Scalability**:
   - Multi-tenant database schema prepared for scaling from single-gym to multi-franchise operations (gym identifier field on all transactional models).

---

## 2. Technical Requirements Document (TRD)

### High-Level Component Architecture

```mermaid
graph TD
    subgraph Client Tier
        admin[Admin Web - Next.js]
        mobile[Member App - React Native/Expo]
        kiosk[Entry Kiosk - React SPA/Next.js]
        bridge[Hardware Bridge - Node.js Serial]
    end

    subgraph API & Services Tier
        api[NestJS Core API]
        ai[FastAPI ML Service]
    end

    subgraph Storage Tier
        db[(PostgreSQL)]
        cache[(Redis Cache / Presence)]
        s3[(S3/R2 File Storage)]
    end

    admin -->|REST / WebSocket| api
    mobile -->|REST| api
    kiosk -->|REST / Local WS| api
    kiosk -->|Local REST| bridge
    bridge -->|Serial/USB| hardware[Fingerprint Reader / Relay]
    api --> db
    api --> cache
    api --> s3
    api -->|gRPC / REST| ai
```

### Database Schema (PostgreSQL)

Using the required database connection string: `DATABASE_URL=postgresql://postgres:1234@localhost:5432`

```sql
-- Role Enum
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'STAFF', 'MEMBER');

-- Member Status Enum
CREATE TYPE member_status AS ENUM ('ACTIVE', 'FROZEN', 'CANCELLED', 'EXPIRED');

-- Payment Status Enum
CREATE TYPE payment_status AS ENUM ('PAID', 'UNPAID', 'OVERDUE');

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role user_role NOT NULL DEFAULT 'MEMBER',
    status member_status NOT NULL DEFAULT 'ACTIVE',
    gym_id UUID NOT NULL, -- Supporting multi-tenancy from start
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_gym_id ON users(gym_id);

-- 2. Biometric Credentials Table
CREATE TABLE biometric_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'FACE' or 'FINGERPRINT'
    template_vector REAL[], -- Face embedding 128-dim float vector
    fingerprint_index INT, -- Finger ID relative to ZKTeco sensor memory
    encrypted_vector TEXT, -- Encrypted backup representation
    face_thumbnail_url VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_biometrics_user ON biometric_credentials(user_id);

-- 3. Membership Plans Table
CREATE TABLE membership_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    duration_days INT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    freeze_limit_days INT DEFAULT 30,
    allowed_entry_hours_start TIME NOT NULL DEFAULT '05:00:00',
    allowed_entry_hours_end TIME NOT NULL DEFAULT '23:00:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Member Subscriptions Table
CREATE TABLE member_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES membership_plans(id),
    status member_status NOT NULL DEFAULT 'ACTIVE',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    freeze_start DATE,
    freeze_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sub_member ON member_subscriptions(member_id);

-- 5. Check-In Logs Table
CREATE TABLE check_in_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL,
    member_id UUID REFERENCES users(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    method VARCHAR(50) NOT NULL, -- 'FACE', 'FINGERPRINT', 'QR', 'MANUAL'
    verified_by_staff_id UUID REFERENCES users(id),
    photo_url VARCHAR(512), -- Kiosk snapshot for audit
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message VARCHAR(255)
);

CREATE INDEX idx_checkin_gym_time ON check_in_logs(gym_id, timestamp DESC);

-- 6. Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES member_subscriptions(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES users(id),
    amount NUMERIC(10, 2) NOT NULL,
    status payment_status NOT NULL DEFAULT 'UNPAID',
    payment_method VARCHAR(50), -- 'CASH', 'CARD', 'ONLINE'
    transaction_id VARCHAR(255),
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Workout Sessions & Details
CREATE TABLE workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    duration_minutes INT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workout_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_name VARCHAR(150) NOT NULL,
    set_number INT NOT NULL,
    weight NUMERIC(6, 2) NOT NULL,
    reps INT NOT NULL,
    rir INT, -- Reps in Reserve
    posture_score INT, -- 0-100 score from mobile TF Lite feedback
    feedback_summary TEXT
);

-- 8. Meal Logs Table
CREATE TABLE meal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    text_description TEXT NOT NULL,
    photo_url VARCHAR(512),
    estimated_calories INT,
    estimated_protein INT,
    estimated_carbs INT,
    estimated_fat INT,
    logged_method VARCHAR(50) NOT NULL -- 'TEXT', 'BARCODE', 'PHOTO'
);
```

### Core Workflows & Logic

#### 1. Biometric Check-In Verification Pipeline
```mermaid
sequenceDiagram
    participant Member as Gym Member
    participant Kiosk as Kiosk Device/App
    participant LocalCache as Local SQLite/IndexedDB
    participant API as Core Backend API
    participant Relay as Smart Relay / ESP32

    Member->>Kiosk: Step in front of Camera / Scan Fingerprint
    alt Face recognition (Local execution)
        Kiosk->>Kiosk: Capture video frame
        Kiosk->>Kiosk: Detect facial landmarks + extract 128-dim vector
        Kiosk->>LocalCache: Search vector space (Cosine Similarity / Euclidean Dist)
        LocalCache-->>Kiosk: Match found (User ID, Active Plan check)
    else Fingerprint recognition (Hardware bridge)
        Kiosk->>Kiosk: Scan thumbprint
        Kiosk-->>Kiosk: Fetch matching index ID
    end
    
    Kiosk->>API: POST /access/verify {userId, scanType, snapshotBase64}
    Note over API: Validates active status,<br/>verify allowed entrance hours
    API-->>Kiosk: Response { authorized: true, name, planStatus }
    
    par
        Kiosk->>Relay: POST http://localhost:8080/relay/trigger (Open Door)
    and
        API->>WebSocket: Broadcast Live Checkin Event (Web Dashboard Updates)
    end
```

#### 2. Mobile On-Device Posture Tracking Flow
1. Member loads exercise screen -> Selects **Form Check**.
2. React Native initializes the device back-camera feed using `react-native-vision-camera`.
3. Frame processor runs `MoveNet` (TF Lite model via `react-native-fast-tflite`) over frame tensors.
4. Tensors yield 17 2D-coordinate coordinates (Joint keypoints).
5. Angle calculation formula:
   $$\theta = \arccos\left(\frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\| \|\vec{v}\|}\right)$$
   Where vectors represent connecting limbs (e.g., Femur: Hip-to-Knee, Tibia: Knee-to-Ankle).
6. Compare $\theta$ range with reference metrics:
   - *Squat Bottom*: Hip angle < 75°, Knee angle 80-110°. If knee angle > 120° but hip is low, cue: "Go deeper".
   - *Back Posture*: Angle of spine vector against vertical plane. If angle dev > 20°, cue: "Straighten back".
7. Display green/red indicators on-screen and trigger speech output.
8. Output: log results under `workout_sets` (posture score, feedback summary).

---

## 3. UI/UX Structure

### Admin Web Portal (Single Page Application)
- **Global Layout**: Left sidebar navigation (collapsible), Header with notification center, Profile controls, and Global Search.
- **Views**:
  - **Dashboard**: Real-time ticker. CSS grid cards displaying metrics. Interactive line charts for hourly occupancy.
  - **Member Desk**: Datagrid showing membership lists, search filter, and quick tags (`[ACTIVE]`, `[OVERDUE]`). A detail drawer pops up for register scans and biometrics enrolling.
  - **Plan Configurator**: Table layout displaying active plans. Modern cards UI to modify constraints (price, entry hours bounds).
  - **Log Hub**: Dedicated live stream card feed showing check-ins. Alerts highlight failed access codes or expired plans in deep red.

### Member Mobile App
- **Bottom Navigation Tabs**: `Home (Dashboard)`, `Workouts`, `Nutrition`, `Kiosk Pass (QR Code)`.
- **Key Flows**:
  - **Workout Tracker**: Chronological list of past sets. Large "+" button to log live reps, weights, and activate Camera-Form check.
  - **Camera Screen**: Split-pane view. Top half overlays skeletal wireframes; bottom shows live cue alerts ("Knees caving, push outward!").
  - **Meals Section**: Dynamic log list showing macros progress ring (Goal vs Current progress).

### Kiosk Interface
- **Default View**: Minimalist dark background, large clock, greeting message. Circular camera viewport representing face capture range.
- **Success View**: Green screen flash, user's avatar, name, and "Access Granted" text.
- **Error View**: Orange/Red flash warning, "Please Scan QR Code or Ask Receptionist" prompt.

---

## 4. MVP Implementation Checklist (task.md draft)

We will build the MVP focusing on Backend API, Admin Web (reception dashboard), and basic Kiosk simulation in Phase 1 & 2.

### Phase 1: Core API & DB Layer
- [ ] Initialize NestJS Backend with TypeScript.
- [ ] Connect database using standard client configuration and verify migration schema.
- [ ] Implement JWT Authentication & RBAC Guards (decorators: `@Roles(Role.SUPER_ADMIN)`).
- [ ] Build Members CRUD REST controllers.
- [ ] Build Plans and Subscriptions management routes.

### Phase 2: Web Admin Dashboard
- [ ] Set up Next.js SPA with Tailwind CSS.
- [ ] Build login page and dashboard layout shell.
- [ ] Implement member database grid with sorting and status actions.
- [ ] Integrate WebSockets client to listen for check-in events.
- [ ] Implement Manual Override check-in button in reception console.

### Phase 3: Access Control & Kiosk Simulation
- [ ] Create kiosk dashboard routing.
- [ ] Implement WebRTC camera capture logic on kiosk frontend.
- [ ] Code QR-code generator in Member section / scan reader on kiosk side.
- [ ] Mock Hardware Bridge HTTP endpoint (ESP32 trigger gate response) for hardware readiness.

### Phase 4: Mobile Logging & AI Coach MVP
- [ ] Mock workout logs endpoints.
- [ ] Add basic GPT-4 OpenAI API Integration for weekly advice prompt.

---

## 5. Continuity Handoff & Staging Strategy

To ensure seamless handoff, we maintain two environment configurations:
1. **Draft Stage (Local/Dev)**: Codebases run on developer workstations with mock data.
2. **Staging Environment**: Unified Docker-compose configuration mapping backend, frontend, PostgreSQL, and Redis.

### Verification Plan

#### Automated Tests
- Integration tests: `npm run test:e2e` for NestJS API role permissions check.
- DB seed checks verifying user roles are properly partitioned.

#### Manual Verification
- Log in as Receptionist and verify that editing plans is blocked (returns 403 Forbidden).
- Simulate live WebSocket events and confirm that reception dashboard populates check-ins without full-page refresh.
