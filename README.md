<div align="center">

# ⚡ BlinkTalks
### Real-Time Communication & Workspace Platform

**"Connect. Talk. Stay in Sync."**

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io)
[![WebSocket](https://img.shields.io/badge/WebSocket-Native-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
[![Express](https://img.shields.io/badge/Express-Server-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)

[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](#)
[![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen?style=flat-square)]()
[![Encryption](https://img.shields.io/badge/Encryption-AES--256--GCM-red?style=flat-square)]()
[![Auth](https://img.shields.io/badge/Auth-JWT%20%2B%20Refresh-blue?style=flat-square)]()
[![PRs](https://img.shields.io/badge/PRs-welcome-ff69b4?style=flat-square)]()

</div>

---

BlinkTalks is a portfolio-grade, production-quality real-time chat and team-workspace platform built on Node.js, Express, native WebSockets, React, and Prisma. It began as a Telegram-style flat-identity chat engine and has since grown into a full communication + project-management suite, demonstrating senior-level full-stack engineering: system performance, secure data architecture, presence scaling, resilient synchronization, and a fluid, motion-driven interface.

## 📑 Table of Contents

- [Product Overview](#-product-overview)
- [Motion & Animation System](#-motion--animation-system)
- [Core Architectural Blueprint](#-core-architectural-blueprint)
- [Security & Data Encryption Ledger](#-security--data-encryption-ledger)
- [Key Engineering Formulas](#-key-engineering-formulas--decision-guidelines)
- [Project Structure](#️-project-structure)
- [Local Setup](#️-step-by-step-local-setup)
- [Known Issues / Next Steps](#️-known-issues--next-steps)

---

## ✨ Product Overview

### 🌐 Public Website & Brand Experience
| Feature | Details |
|---|---|
| **Hero & Identity** | Tagline "Connect. Talk. Stay in Sync." with an animated, looping chat-simulation mockup — messages type in, bubbles spring into place, and a typing indicator pulses on a subtle delay loop. |
| **Value & Capabilities Grid** | 12 feature modules (WebSocket gateway, payload encryption, presence indicators, group governance, thread replies) that fade-and-rise into view on scroll, staggered ~60ms per card. |
| **Sticky Header & Footer** | Glassmorphic header with a blur/opacity transition on scroll, smooth-scroll anchor links, and a multi-column footer with live pulsing status dots. |

### 🔐 Authentication Suite
- Split-screen layout: high-contrast branding column (security badges) beside a reactive auth card that **cross-fades between Sign In / Sign Up** states.
- Debounced username availability checks with an inline spinner → checkmark/error morph transition.
- Password visibility toggle with icon-swap animation, shake-on-error callouts, and a 1-click **Admin Demo Login** (`@admin`) for instant preview access.

### 🖥️ Authenticated Workspace Shell
- **App Header** — Logo, live WebSocket status pill (color-transitions green ↔ amber ↔ red as connection state changes), global search trigger, notification bell with a bounce+badge-pop on new alerts, settings, and profile controls.
- **Left Navigation Rail** — Persistent nav for Home/Website, Chats, Groups, Contacts, Requests, Notifications, and the Governance Console, with an animated active-tab indicator that slides between icons.
- **Conversation Sidebar** — Filter tabs (Chats, Groups, Requests, Contacts) with a sliding underline, presence dots that pulse when a contact is typing, member counts, and invite-code triggers.
- **Notifications & Toasts** — Slide-in/fade-out toast queue and a modal that scales in from 95% → 100% opacity for real-time notifications, contact requests, and unread activity.

### 💬 Real-Time Messaging Features
- **Global Command Palette** (`Ctrl+K` / `Cmd+K`) — Backdrop blur-in, palette scales up from center; results fade in per keystroke with keyboard navigation highlighting.
- **Keyboard Shortcuts Modal** (`?`) — Reference for navigation, messaging, and channel actions, with a staggered fade-in list.
- **In-Conversation Search** — Real-time match highlighting with a hit counter (X of Y), next/previous navigation, animated highlight-fade on each match, and smooth auto-scroll.
- **Per-Channel Draft Preservation** — Unsent composer text persists per conversation across switches and refreshes.
- **Message Actions** — Quoted replies with a slide-up preview, one-click copy with an animated checkmark morph, inline editing (`↑` to edit last message), and a quick-emoji reaction bar (❤️ 👍 🔥 😂 🚀 👏) that pops with a spring bounce and live reaction-count pills.
- **Group Mentions Autocomplete** (`@username`) — Dropdown member picker that slides down with keyboard/click insertion.
- **Smart Scrolling** — Floating "X new messages" indicator that slides up from the bottom edge, with a smooth eased jump-to-bottom.
- **Responsive Layout & Gateway Health** — Mobile-adaptive directory/chat toggle with a horizontal slide transition and back navigation, plus live reconnect banners that slide down with a gentle shake on disconnect.

### 🧩 Workspace & Project Management Suite
- **Kanban Sprint Board** — To Do / In Progress / In Review / Blocked / Completed columns; cards lift with a shadow+scale on drag, and snap into place with an ease-out drop transition. Priority badges, checklist progress bars, and overdue alerts (pulsing red) included.
- **Task Management** — Creation and detail modals/drawers that slide in from the right, with checklist subtasks that strike-through and fade on completion, plus assignees, priorities, comments, tags, and due dates.
- **Projects & Roadmaps** — Progress meters animate fill on load; 1-click drill-down transitions into filtered Kanban views.
- **Calendar & Video Syncs** — Meeting scheduling with Google Meet/Zoom links and upcoming deadline tracking, with hover-lift event cards.
- **Team Directory** — Roles (Owner, Admin, Manager, Member), departments, invite-code sharing, and 1-click DM with a ripple-tap feedback effect.
- **Announcements & Notes** — Priority company announcements (slide-in banner) plus collaborative notes/scratchpads with pin-flip animation.
- **Analytics & Velocity** — Delivery throughput, status breakdowns, priority distribution, and workload charts that animate in on mount (bars grow, donuts sweep).
- **My Work Dashboard** — Personal task tracking grouped by Overdue / Due Today / Upcoming / Completed, with filter chips that morph width on selection.
- **File Repository** — Simulated drag-and-drop uploads with a dashed-border pulse on drag-over, category filters, file-type icons, and animated storage usage gauges.
- **Quick Creation Modals** — Create projects, meetings, and announcements from the global "+ Create" menu (icon rotates 45° into an "×" on open) or view-specific buttons.
- **Onboarding Tour** — 5-step guided walkthrough with spotlight/backdrop transitions between steps, covering the workspace suite, Kanban boards, chat channels, and shortcuts.
- **Unified Navigation** — Collapsible main sidebar (width eases in/out) with unread badges, task counters, presence toggles (Online/Away/Busy/Offline) that cross-fade color, and workspace switching; all actions surfaced in the Command Palette.

---

## 🎬 Motion & Animation System

BlinkTalks treats motion as a first-class part of the design system, not decoration — every transition communicates state.

| Category | Pattern | Easing / Timing |
|---|---|---|
| **Entrances** | Fade + rise (8–12px), scale-in from 95% | `ease-out`, 150–250ms |
| **Exits** | Fade + slight scale-down | `ease-in`, 100–150ms |
| **List Items** | Staggered fade/slide (Kanban cards, palette results, onboarding steps) | 40–60ms stagger step |
| **Micro-interactions** | Button press scale (0.97), icon morphs (copy → check, hamburger → close) | `spring`, ~200ms |
| **Status Changes** | Color cross-fade (connection pill, presence dots) | `linear`, 300ms |
| **Drag & Drop** | Lift (shadow + scale 1.03) → drop (ease-out settle) | 150ms lift / 200ms drop |
| **Modals & Palette** | Backdrop blur-fade + panel scale-in from center | `ease-out`, 200ms |
| **Toasts** | Slide-in from edge, auto-dismiss fade-out | `ease-in-out`, 250ms in / 200ms out |
| **Loading** | Skeleton shimmer sweep on data fetch (workspace views, analytics) | `linear`, 1.2s loop |

**Guiding principles:**
1. Nothing animates longer than ~300ms for core UI feedback — speed preserves the "sub-second" feel promised on the landing page.
2. Every async action (send, save, upload) gets an immediate optimistic UI transition, reconciled silently on server confirmation.
3. Reduced-motion preference (`prefers-reduced-motion`) disables non-essential transitions and stagger effects, keeping only opacity/color changes for accessibility.

---

## 🎨 Core Architectural Blueprint

### 1. Fan-Out & Multi-Instance Scalability
The WebSocket controller is decoupled from database transactions using a Redis-ready **Pub/Sub event loop**:
- **The Flow**: When a user sends a message to a DM or Group channel, the server validates boundaries and rate limits, encrypts the payload, persists it to storage, and publishes it to the corresponding Redis channel (`chat:conversation:<id>`).
- **Broadcasting**: All active server instances subscribe to these channels and broadcast only to the WebSockets connected locally.
- **Complexity**: Broadcasting cost is bounded by conversation membership size ($O(N)$) rather than total platform population, while the Pub/Sub hop stays $O(1)$ regardless of cluster size.

### 2. Ephemeral vs. Durable State (CAP Tradeoff)
- **Message Delivery (CP)**: During network partitions, it's better to briefly reject or buffer a send than risk silent message loss or unordered state. Delivery uses strict monotonic indexing on `(conversation_id, created_at)` with cursor alignment.
- **Presence & Typing States (AP)**: High-frequency micro-interaction payloads bypass the database, living in fast in-memory caches (simulating Redis) synced to local sockets. Brief presence staleness is an acceptable UX tradeoff for availability.

---

## 🔒 Security & Data Encryption Ledger

- **At-Rest Symmetric Encryption**: Message content is encrypted with AES-256-GCM; IV and auth tag are prepended to the ciphertext (`iv:tag:ciphertext`), protecting against static database dump leaks.
- **In-Transit Protection**: TLS/WSS-encrypted tunnels; plaintext is decrypted server-side and transmitted only over validated, JWT-authorized WebSocket frames.
- **JWT Access Pins**: Short-lived (15 min) `HS256` access tokens with 7-day refresh tokens enforce strict rotation.
- **Soft Delete Governance**: Administrative deletions anonymize identities (`deleted_<hash>`) instead of hard-deleting, freeing usernames for re-registration while preserving log integrity.

---

## 🚀 Key Engineering Formulas & Decision Guidelines

### 1. Capacity Planning (Little's Law)
$$\text{Average Concurrent Connections } (L) = \lambda \times W$$
Where $\lambda$ is the arrival rate of active connection requests/sec and $W$ is average socket duration. E.g., 20 logins/sec with 900s average session length → $L = 20 \times 900 = 18{,}000$ concurrent sessions per instance.

### 2. Rate Limiting (Token Bucket)
$$\text{Tokens}(t) = \min(C, \text{Tokens}(t-1) + r \times \Delta t)$$
Where $C$ is burst capacity and $r$ is refill rate/sec. Applied at the socket gateway: searches are throttled tightly ($C=5, r=0.5/\text{sec}$) against directory scraping, while message sends allow smooth typing bursts ($C=15, r=3/\text{sec}$).

### 3. Cursor-Based Pagination
Rather than SQL `OFFSET` paging ($O(\text{offset} + \text{limit})$), history endpoints query the composite covering index `(conversation_id, created_at)`, guaranteeing $O(\log N + \text{limit})$ lookups regardless of scroll depth.

### 4. Why No CRDT?
Chat is append-only — each message is immutable with exactly one author. Ordering by monotonic `created_at` plus at-least-once socket delivery is sufficient, avoiding unnecessary CRDT overhead (unlike collaborative documents, which need conflict merging).

---

## 🗂️ Project Structure

```
├── prisma/
│   └── schema.prisma             # Data models: users, conversations, messages, workspaces, tasks
├── server/
│   ├── routes.ts                 # REST endpoints
│   ├── workspaceRoutes.ts        # Workspace/project management endpoints
│   ├── seed.ts                   # Seed data
│   └── server.ts                 # WebSocket gateway + HTTP server
├── shared/
│   └── types.ts                  # Shared TS types (client + server)
├── src/
│   ├── components/
│   │   ├── LandingPage.tsx, AuthScreen.tsx, AppHeader.tsx, Sidebar.tsx,
│   │   │   LeftNavRail.tsx, ChatArea.tsx, Toast.tsx, NotificationsModal.tsx,
│   │   │   CommandPalette.tsx, KeyboardShortcutsModal.tsx, MainSidebar.tsx
│   │   └── workspace/
│   │       ├── WorkspaceView.tsx, WorkspaceHeader.tsx, WorkspaceDashboard.tsx
│   │       ├── KanbanBoard.tsx, TaskDetailModal.tsx / TaskDetailPanel.tsx, CreateTaskModal.tsx
│   │       ├── ProjectsView.tsx, CreateProjectModal.tsx
│   │       ├── CalendarMeetingsView.tsx, ScheduleMeetingModal.tsx
│   │       ├── TeamDirectoryView.tsx, AnnouncementsView.tsx, CreateAnnouncementModal.tsx
│   │       ├── NotesDocsView.tsx, AnalyticsView.tsx, MyWorkView.tsx, FilesView.tsx
│   │       └── OnboardingModal.tsx, WorkspaceModal.tsx
│   ├── store/
│   │   └── workspaceStore.ts     # Client-side workspace state
│   ├── index.css                 # Design tokens + animation/transition keyframes
│   └── App.tsx
└── index.html
```

---

## 🛠️ Step-by-Step Local Setup

1. **Prerequisites**: Node.js (v18+) installed.
2. **Environment Setup**: Copy `.env.example` to `.env` and set variables (e.g. `JWT_SECRET`).
3. **Database Setup**: Prisma SQLite is pre-configured. Push the schema:
   ```bash
   npx prisma db push
   ```
4. **Seed Data** (optional, for demo/admin login):
   ```bash
   npx tsx server/seed.ts
   ```
5. **Launch Application**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚠️ Known Issues / Next Steps

Recent build attempts to "fix errors in the app" and restructure the README were canceled mid-run. Before shipping:
- Re-run a full type-check/build (`npm run build`) and resolve any outstanding TypeScript or runtime errors across the workspace modules introduced in the last few updates.
- Verify `prisma/schema.prisma` migrations are in sync with `workspaceStore.ts` and `workspaceRoutes.ts` after the workspace suite additions.
- Confirm the Command Palette and Keyboard Shortcuts modal correctly reflect all newly added workspace commands.
- Audit new transitions against `prefers-reduced-motion` to confirm the fallback (opacity/color only) is applied consistently across Kanban drag, modals, and toasts.

<div align="center">

---

Made by ram codeverse ⚡ and a lot of `ease-out` curves.

</div>
