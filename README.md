<div align="center">

# ⚡ BlinkTalks
### Next-Generation Real-Time Communication & Collaborative Workspace Platform

**"Connect. Talk. Stay in Sync."**

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io)
[![WebSocket](https://img.shields.io/badge/WebSocket-Native-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
[![Express](https://img.shields.io/badge/Express-Server-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](#)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen?style=flat-square)]()
[![Encryption](https://img.shields.io/badge/Security-AES--256--GCM-red?style=flat-square)]()
[![Auth](https://img.shields.io/badge/Auth-JWT%20%2B%20Email%20Verified-blue?style=flat-square)]()
[![Architecture](https://img.shields.io/badge/Architecture-Full--Stack%20Real--Time-purple?style=flat-square)]()

</div>

---

BlinkTalks is a production-grade, portfolio-defining real-time communication platform and unified team workspace. Built with Node.js, Express, native WebSockets, React 18, and Prisma ORM, BlinkTalks unites high-speed encrypted messaging, voice/meeting synchronization, Kanban sprint boards, task workflows, team directories, and real-time governance into one cohesive, motion-driven experience.

```
CONNECT • COMMUNICATE • COLLABORATE • ORGANIZE • GET WORK DONE
```

---

## 📑 Table of Contents

- [Core Value Proposition](#-core-value-proposition)
- [System Architecture](#-system-architecture)
- [Feature Matrix](#-feature-matrix)
  - [1. Authentication & Onboarding Suite](#1-authentication--onboarding-suite-redesigned)
  - [2. Real-Time Chat & Messaging Gateway](#2-real-time-chat--messaging-gateway)
  - [3. Collaborative Workspace & Project Management](#3-collaborative-workspace--project-management)
  - [4. Team Directory & Member Governance](#4-team-directory--member-governance)
  - [5. System Administration & Maintenance Mode](#5-system-administration--maintenance-mode)
- [Data Security & Encryption Ledger](#-data-security--encryption-ledger)
- [Motion, Transitions & Design Tokens](#-motion-transitions--design-tokens)
- [Complete API Reference](#-complete-api-reference)
- [Database Schema Blueprint](#-database-schema-blueprint)
- [Project Directory Structure](#️-project-directory-structure)
- [Step-by-Step Local Setup](#️-step-by-step-local-setup)
- [Production Deployment & Containerization](#-production-deployment--containerization)
- [Testing & Quality Verification](#-testing--quality-verification)

---

## 💡 Core Value Proposition

BlinkTalks bridges the traditional gap between **instant messaging** (Discord, Telegram, Slack) and **structured project execution** (Linear, Asana, Trello). Teams no longer need to context-switch across disconnected tools:

1. **Synchronized Channels**: Every task, sprint item, and project has instant chat threads attached directly to its context.
2. **Zero Phone Number Identity**: Strict `@username` and verified email identity model, preserving privacy while ensuring enterprise-grade auditability.
3. **Sub-Second Real-Time Response**: Native full-duplex WebSockets with optimistic client updates and automatic reconciliation.
4. **Restrained Futuristic Aesthetic**: Custom dark palette (`#070b14` / `#0d1527`), fine borders, ambient blue/indigo gradients, and accessible WCAG-compliant contrast.

---

## 🏗️ System Architecture

```
                       ┌─────────────────────────────────────────┐
                       │          Client Browser (SPA)           │
                       │     React 18 • Zustand • Tailwind       │
                       └──────────────┬──────────────────────────┘
                                      │
                         HTTPS / REST │ WebSocket (WSS)
                                      ▼
                       ┌─────────────────────────────────────────┐
                       │         Express Gateway (Node.js)       │
                       │  • Rate Limiting (Token Bucket)         │
                       │  • JWT Auth & Refresh Tokens            │
                       │  • Native WebSocket Server              │
                       │  • Broadcast & Presence Engine          │
                       └──────────────┬──────────────────────────┘
                                      │
                     Prisma ORM Client│ (Parameterized Queries)
                                      ▼
                       ┌─────────────────────────────────────────┐
                       │      Database Layer (SQLite / PG)       │
                       │  Users • Conversations • Messages       │
                       │  Workspaces • Tasks • Projects • Logs   │
                       └─────────────────────────────────────────┘
```

### Key Architectural Strengths:
- **WebSocket Gateway**: Native `ws` implementation handling connection lifecycles, ping/pong heartbeats, typing indicators, and message broadcasts bounded by room membership ($O(N)$).
- **Optimistic Reconciliation**: The frontend creates immediate transient messages and updates Kanban drag states, reconciling timestamps and IDs seamlessly once the server confirms.
- **Resilient Reconnection**: Exponential backoff with jitter on socket disconnects, accompanied by unobtrusive UI status banners.

---

## 🌟 Feature Matrix

### 1. Authentication & Onboarding Suite (Redesigned)

- **Two-Column Responsive Experience**:
  - **Left Branding & Capabilities Column (~45%)**: High-contrast BlinkTalks logo, platform tagline, authentic capability indicators (Real-time communication, Team collaboration, Tasks & projects, Secure workspaces), interactive **Capability Strip** (CHAT, WORK, KANBAN, TEAMS, PROJECTS), and an ambient **Miniature Workspace Preview** showcasing live sprint progress (Website Redesign at 72%) and synced status tags.
  - **Right Authentication Card (~55%)**: Elevated dark navy card (`#0d1527`) with soft ambient lighting and smooth mode switching between Sign Up and Sign In.
- **Strict Signup Field Hierarchy**:
  1. **Display Name**: Native name input with auto-derived username suggestions.
  2. **Username (@)**: Real-time debounced availability check against the database (`/api/users/check-username`) with live visual states (*Checking...*, *✓ @username is available*, *✕ That username is already taken*).
  3. **Email Address**: Format regex validation and instant uniqueness check (`/api/users/check-email`).
  4. **Password**: Show/hide toggle with smooth icon transition and an integrated **Password Strength Indicator** evaluating length, numbers, and symbols (**Weak**, **Fair**, **Strong**).
  5. **Confirm Password**: Isolated match detection (*✓ Passwords match* / *✕ Passwords don't match*) without full-page shaking.
- **Workspace Invitation Awareness**:
  - Automatically parses invitation URLs (`/join/{workspace}/{invite}` or `?invite=CODE`).
  - Fetches and renders a verified **Joining Workspace** context card with the workspace name, category, and assigned role before registration.
- **Email Verification View**:
  - Clean checkmark badge transition displaying target email, *Open Login* or *Continue to Workspace* actions, a countdown resend cooldown timer (*Resend available in Xs*), and *Change email* navigation.
- **First-Time Onboarding Choice**:
  - Prompts new non-invited users with purpose selection: **Personal Communication**, **Team Collaboration**, or **Both**, guiding users into the workspace without forcing corporate lock-in.
- **Production-Safe Demo Access**:
  - Demo administrator shortcuts (`@admin`) are strictly isolated to development/demo environments and never exposed on public production signup forms.

---

### 2. Real-Time Chat & Messaging Gateway

- **Conversation Types**:
  - **Direct Messages (1-on-1)**: Private, end-to-end synchronized direct conversations.
  - **Group Channels**: Public and private workspace channels with configurable access and member lists.
- **Rich Message Interactions**:
  - **Quoted Replies**: Slide-up quote preview with direct scroll-to-original on click.
  - **Quick Emoji Reactions**: Spring-animated reaction bar (❤️ 👍 🔥 😂 🚀 👏) with live count aggregations.
  - **Inline Editing & Recall**: Press `↑` in the composer to edit the last sent message.
  - **Clipboard Copying**: One-click copy with an animated checkmark morph feedback.
  - **Group Mentions**: Autocomplete member picker triggering upon typing `@`.
- **In-Conversation Search**:
  - Live query highlighting, result counter (*X of Y*), jump-to-result buttons, and smooth auto-scrolling.
- **Per-Channel Draft Preservation**:
  - Unsent message composer state persists across channel navigation and tab reloads via local state caching.
- **Presence & Activity Engine**:
  - Live typing indicators with debounced timeouts.
  - User status badges: **Online**, **Away**, **Busy**, **Offline** with color-fade transitions.

---

### 3. Collaborative Workspace & Project Management

- **Interactive Kanban Sprint Board**:
  - Standardized agile columns: **To Do**, **In Progress**, **In Review**, **Blocked**, and **Completed**.
  - Smooth card dragging with elevated shadow states and snap-to-place settlement.
  - Real-time priority tags (Urgent, High, Medium, Low), task checklist counts, assignee avatars, and overdue date alerts.
- **Task Management Drawer**:
  - Comprehensive slide-in drawer for task details: markdown description, subtask checklists with strike-through completions, assignee assignment, tags, comments, and audit timeline.
- **Projects & Roadmaps**:
  - Project cards featuring calculated percentage meters, milestone dates, and one-click filtering directly to linked Kanban board tasks.
- **Calendar & Video Syncs**:
  - Meeting scheduling engine with direct Google Meet / Zoom integration links and upcoming schedule badges.
- **Personal "My Work" Dashboard**:
  - Consolidated view aggregating tasks assigned to the logged-in user across all workspaces, filtered into **Overdue**, **Due Today**, **Upcoming**, and **Completed**.
- **File Repository**:
  - Simulated drag-and-drop file vault with category filters, file-type icons, and interactive storage quota gauges.

---

### 4. Team Directory & Member Governance

- **Member Cards & Scoped Controls**:
  - Grid and list views of all workspace members displaying display names, `@usernames`, department, job titles, and status messages.
  - **Scoped Settings Dropdown**: Isolated per-member settings menus ensuring actions (edit role, remove member, send direct message) are strictly targeted to the selected user.
- **Role-Based Access Control (RBAC)**:
  - **Owner**: Full workspace governance and administrative destruction rights.
  - **Admin**: Channel creation, role modification, member invitations, and team audits.
  - **Manager**: Project roadmaps, task assignments, and calendar scheduling.
  - **Member**: Standard messaging, task execution, and subtask collaboration.
  - **Guest**: Read-only or channel-restricted participation.

---

### 5. System Administration & Maintenance Mode

- **Administrative Console**:
  - Centralized dashboard for platform metrics, active user audits, and direct moderation.
  - User suspension / ban controls with soft-delete anonymization (`deleted_<hash>`) protecting referential integrity.
- **Scheduled Maintenance System**:
  - Real-time maintenance toggle with customizable scheduled completion time (`maintenance.json`).
  - Displays non-blocking countdown warning banners to active users and temporarily halts new registrations while allowing administrator bypass.

---

## 🔒 Data Security & Encryption Ledger

| Security Layer | Implementation Mechanism | Purpose |
|---|---|---|
| **At-Rest Payload Encryption** | `AES-256-GCM` via Node.js crypto | Message content stored as `iv:tag:ciphertext`. Protects sensitive conversations against raw database compromises. |
| **In-Transit Protection** | `TLS / WSS` (HTTPS & WSS) | Plaintext is decrypted only in memory for authorized connections over authenticated WebSocket frames. |
| **Authentication Standard** | `HS256` JWT + Refresh Token Rotation | Short-lived 15-minute access tokens coupled with 7-day refresh tokens stored securely in client state. |
| **Password Hashing** | `bcrypt` (10 rounds) | Secure one-way hashing with unique salt generation on account creation and password updates. |
| **Rate Limiting** | Token Bucket Algorithm | Tight search throttling (preventing directory scraping) alongside comfortable burst limits for typing. |
| **SQL Injection Defense** | Prisma Client Parameterization | All queries strictly executed through parameterized Prisma statements, preventing SQL injection vectors. |

---

## 🎨 Motion, Transitions & Design Tokens

BlinkTalks strictly adheres to the principle that **motion communicates state**:

```
Design System Colors:
• Canvas Background:    #070b14  (Deep space navy)
• Card Surface:         #0d1527  (Elevated deep navy)
• Subtle Card Surface:  #09101f  (Recessed container)
• Primary Gradient:     from-blue-600 via-indigo-600 to-violet-600
• Accents:              Cyan (#22d3ee) • Emerald (#34d399) • Rose (#f43f5e)
```

### Micro-Interaction Specifications:
- **Button Hover / Press**: `hover:-translate-y-0.5`, `active:scale-[0.98]`, duration 150ms `ease-out`.
- **Modal & Palette Entrances**: Opacity 0% → 100%, scale 96% → 100%, duration 200ms `ease-out`.
- **Slide-in Drawers**: Translate X `100% → 0%`, backdrop blur `backdrop-blur-sm`, duration 250ms.
- **Accessibility (`prefers-reduced-motion`)**: All spatial movement and scaling transitions gracefully degrade to pure opacity and color fades for users with vestibular sensitivities.

---

## 📡 Complete API Reference

### Authentication Endpoints
| Method | Route | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Register new user with display name, username, email, password | No |
| `POST` | `/api/auth/login` | Authenticate using username or email + password | No |
| `POST` | `/api/auth/verify-email` | Mark user email address as verified | No |
| `POST` | `/api/auth/resend-verification`| Trigger verification email resend with cooldown | No |
| `POST` | `/api/auth/refresh` | Obtain fresh access token using valid refresh token | No |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile and permissions | Yes (Bearer) |

### User Directory Endpoints
| Method | Route | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/users/check-username?q=` | Verify username format and real-time availability | No |
| `GET` | `/api/users/check-email?q=` | Check email format and uniqueness | No |
| `GET` | `/api/users/search?q=` | Search active members by username or display name | Yes (Bearer) |
| `POST` | `/api/users/profile` | Update user display name, bio, job title, and avatar | Yes (Bearer) |

### Conversations & Messages
| Method | Route | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/conversations` | List user's active DM and group conversations | Yes (Bearer) |
| `POST` | `/api/conversations` | Create new conversation or direct message channel | Yes (Bearer) |
| `GET` | `/api/conversations/:id/messages` | Fetch cursor-paginated messages for a conversation | Yes (Bearer) |
| `POST` | `/api/conversations/:id/messages` | Send message (also broadcast over WebSockets) | Yes (Bearer) |

### Workspace & Project Management
| Method | Route | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/workspaces` | List all workspaces available to user | Yes (Bearer) |
| `POST` | `/api/workspaces` | Create new workspace | Yes (Bearer) |
| `GET` | `/api/workspaces/validate-invite/:code` | Validate invitation code and return workspace meta | No |
| `POST` | `/api/workspaces/join` | Join workspace via invitation code | Yes (Bearer) |
| `GET` | `/api/workspaces/:id/tasks` | Get all tasks for workspace Kanban board | Yes (Bearer) |
| `POST` | `/api/workspaces/:id/tasks` | Create new task with priority, due date, assignee | Yes (Bearer) |
| `PATCH` | `/api/workspaces/:id/tasks/:taskId` | Update task status, order, or metadata | Yes (Bearer) |
| `GET` | `/api/workspaces/:id/projects` | List projects and milestone progress | Yes (Bearer) |
| `GET` | `/api/workspaces/:id/meetings` | List scheduled meetings and calendar syncs | Yes (Bearer) |
| `GET` | `/api/workspaces/:id/announcements` | Retrieve company broadcasts and announcements | Yes (Bearer) |

### System & Maintenance
| Method | Route | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/maintenance/status` | Check system maintenance state and completion time | No |
| `POST` | `/api/admin/maintenance/toggle` | Toggle maintenance mode and update banner text | Yes (Admin) |

---

## 🗄️ Database Schema Blueprint

```prisma
model User {
  id             String    @id @default(uuid())
  username       String    @unique
  email          String?   @unique
  email_verified Boolean   @default(false)
  password_hash  String
  display_name   String
  avatar         String?
  bio            String?
  role           String    @default("user") // "user" | "admin"
  is_suspended   Boolean   @default(false)
  job_title      String?
  department     String?
  status_message String?
  theme_pref     String?   @default("dark")
  created_at     DateTime  @default(now())

  // Relations
  memberships    ConversationMember[]
  messages       Message[]
  workspaceMembers WorkspaceMember[]
  tasksAssigned  WorkspaceTask[]
}

model Workspace {
  id          String   @id @default(uuid())
  name        String
  description String?
  category    String?  @default("Engineering & Product")
  invite_code String   @unique
  created_at  DateTime @default(now())

  members     WorkspaceMember[]
  tasks       WorkspaceTask[]
  projects    WorkspaceProject[]
  meetings    WorkspaceMeeting[]
  invitations WorkspaceInvitation[]
}

model WorkspaceTask {
  id           String    @id @default(uuid())
  workspace_id String
  title        String
  description  String?
  status       String    @default("todo") // "todo" | "in_progress" | "review" | "done"
  priority     String    @default("medium")
  assignee_id  String?
  due_date     DateTime?
  tags         String?   // JSON-encoded array
  checklist    String?   // JSON-encoded items
  created_at   DateTime  @default(now())
}
```

---

## 📁️ Project Directory Structure

```
├── prisma/
│   └── schema.prisma                 # Core Prisma data models
├── server/
│   ├── routes.ts                     # REST API endpoints & auth pipeline
│   ├── workspaceRoutes.ts            # Workspace, Kanban, Task, & Meeting endpoints
│   ├── seed.ts                       # Database seeder (Demo data & admin)
│   └── server.ts                     # Express server & WebSocket gateway
├── shared/
│   └── types.ts                      # Shared TypeScript interface definitions
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── CapabilityStrip.tsx   # Interactive product pillar strip
│   │   │   ├── ProductPreviewMini.tsx# Live miniature workspace preview
│   │   │   ├── PasswordStrengthIndicator.tsx # Password evaluation meter
│   │   │   ├── EmailVerificationView.tsx # Verification card & resend timer
│   │   │   └── OnboardingChoiceModal.tsx # Purpose selector (Personal/Team/Both)
│   │   ├── workspace/
│   │   │   ├── WorkspaceView.tsx     # Master workspace layout
│   │   │   ├── KanbanBoard.tsx       # Drag-and-drop sprint task board
│   │   │   ├── TeamDirectoryView.tsx # Member roster with scoped controls
│   │   │   ├── ProjectsView.tsx      # Roadmap & milestone progress
│   │   │   ├── CalendarMeetingsView.tsx # Meeting schedule & links
│   │   │   ├── MyWorkView.tsx        # Personal assigned task tracker
│   │   │   └── AnalyticsView.tsx     # Team throughput & velocity metrics
│   │   ├── AuthScreen.tsx            # Redesigned 2-column authentication shell
│   │   ├── LandingPage.tsx           # Public showcase & product experience
│   │   ├── ChatArea.tsx              # Real-time chat & rich message actions
│   │   ├── CommandPalette.tsx        # Ctrl+K global navigation palette
│   │   ├── KeyboardShortcutsModal.tsx# Shortcuts cheat sheet ('?')
│   │   ├── AdminDashboard.tsx        # Administrative moderation console
│   │   └── Toast.tsx                 # Transient notification queue
│   ├── store/
│   │   ├── chatStore.ts              # Zustand store for chat, auth & sockets
│   │   └── workspaceStore.ts         # Zustand store for tasks & workspace state
│   ├── App.tsx                       # Master root view orchestrator
│   ├── index.css                     # Design tokens & animation definitions
│   └── main.tsx                      # Client entry point
├── package.json                      # Dependencies & build scripts
├── vite.config.ts                    # Vite client build configuration
└── metadata.json                     # AI Studio application metadata
```

---

## 🛠️ Step-by-Step Local Setup

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/your-repo/blinktalks.git
cd blinktalks
npm install
```

### 3. Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
```

### 4. Initialize Database
Push the Prisma schema to synchronize SQLite:
```bash
npx prisma db push
```

*(Optional)* Seed sample workspace, users, and tasks:
```bash
npx tsx server/seed.ts
```

### 5. Launch Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🚢 Production Deployment & Containerization

BlinkTalks is engineered for instant containerized deployment on **Google Cloud Run**, Docker, or standard Node environments.

### Production Build Script
```bash
npm run build
```
This triggers:
1. `vite build` — Bundles static frontend assets to `dist/`.
2. `esbuild server.ts --bundle --platform=node --format=cjs --outfile=dist/server.cjs` — Compiles a single, fast CommonJS server bundle bypassing ES module overhead.

### Launching Production
```bash
npm start
```
Starts `dist/server.cjs` binding to `0.0.0.0:3000`.

---

## 🧪 Testing & Quality Verification

To run comprehensive type-checking and syntax linting across both client and server:
```bash
# TypeScript verification
npm run lint

# Production build verification
npm run build
```

---

<div align="center">

**BlinkTalks** • Built with passion, precision, and modern full-stack engineering.

`Connect. Talk. Stay in Sync.`

</div>
