# BlinkTalks — Real-Time Chat Engine

A portfolio-grade, production-quality real-time chat application built on Node.js, Express, native WebSockets, React, and Prisma. Designed to demonstrate senior-level full-stack engineering: system performance under concurrency, secure data architecture, presence scaling, and resilient synchronization protocols.

[![Node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![WebSockets](https://img.shields.io/badge/Realtime-WebSockets-black)](#)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![License](https://img.shields.io/badge/license-MIT-blue)](#license)

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#-core-architectural-blueprint)
- [Security & encryption](#-security--data-encryption-ledger)
- [Engineering formulas & decision guidelines](#-key-engineering-formulas--decision-guidelines)
- [Local setup](#️-local-setup)
- [Project structure](#project-structure)
- [Interview Q&A cheatsheet](#-interview-qa-cheatsheet-defend-your-code)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

BlinkTalks is a flat-identity messaging platform — no workspaces, no nested hierarchy. Every user has a unique `@username`, which is also their login ID. Users can search for and message anyone by username, and start or join public or private groups. The system is built to hold up under concurrent load: horizontally-scalable WebSocket fan-out, cursor-based pagination, and encrypted message storage.

## Features

- Username-based signup/login (JWT auth, bcrypt/argon2 password hashing) — no email or phone required
- Real-time 1:1 and group messaging over WebSockets
- Username search & discovery, public and private groups
- Presence (online/offline/last-seen) and typing indicators
- Read receipts and unread counts
- Reconnection handling with gap-free, duplicate-free resync
- Role-gated admin console: user registry, suspend/reinstate, soft-delete, password reset, audit log
- Message content encrypted at rest (AES-256-GCM); all traffic over TLS/WSS

---

## 🎨 Core Architectural Blueprint

### 1. Fan-Out & Multi-Instance Scalability

The WebSocket controller is decoupled from database transactions using a Redis-ready **Pub/Sub event loop**:

- **The flow**: when a user sends a message to a DM or group conversation, the server validates membership and rate limits, encrypts the payload, persists it to storage, and publishes it to the corresponding Redis channel (`chat:conversation:<id>`).
- **Broadcasting**: every active server instance is subscribed to these channels. Each instance receives the published payload and broadcasts it only to the WebSockets connected locally to it.
- **Complexity**: broadcasting cost is bounded by conversation membership size (`O(N)`), not total platform population, while the Pub/Sub hop itself stays `O(1)` regardless of cluster size.

### 2. Ephemeral vs. Durable State (CAP tradeoff)

A deliberate split across the CAP (Consistency, Availability, Partition-tolerance) tradeoff:

- **Message delivery — CP (consistency/partition-tolerant)**: during a network partition, it's better to briefly reject or buffer a send than risk silent message loss or out-of-order state. Delivery relies on strict monotonic indexing on `(conversation_id, created_at)` with cursor-based pagination.
- **Presence & typing state — AP (available/partition-tolerant)**: high-frequency, low-stakes payloads bypass the database entirely to avoid write-locking. They live in a fast in-memory cache (Redis-shaped, swappable for real Redis in production) synced to locally active sockets. Briefly-stale presence (showing someone online a few seconds after they've disconnected) is an acceptable UX cost; blocking the app for perfectly consistent presence is not.

> **Current implementation note**: presence currently runs against an in-memory cache shaped like Redis's API, so the same code path drops into real Redis with a driver swap, not a rewrite, once horizontal scaling is actually needed.

---

## 🔒 Security & Data Encryption Ledger

- **At-rest symmetric encryption**: message content is encrypted with AES-256-GCM. The initialization vector (IV) and authentication tag are prepended to the ciphertext (`iv:tag:ciphertext`). This protects against a static database dump leak — it is not end-to-end encryption, since the application server itself can still decrypt content in the normal message flow. True E2EE (client-side key exchange) is tracked as a future improvement — see [Roadmap](#roadmap).
- **In-transit protection**: the full transport channel is encrypted (TLS/WSS). Plaintext payloads exist only transiently, server-side, over validated, JWT-authorized WebSocket frames.
- **JWT access tokens**: short-lived (15 min), pinned to `HS256`, backed by longer-lived refresh tokens (7 days) for rotation without forcing frequent re-logins.
- **Soft-delete governance**: admin-initiated account deletions anonymize the identity (`deleted_<hash>`) rather than hard-deleting it — this frees the original username for re-registration immediately while keeping message history intact, so other participants in a conversation don't see broken or one-sided threads.
- **Admin access, local dev only**: a seed script provisions one admin account for local testing. It is gated to non-production environments and its credentials are **not published here** — check `prisma/seed.ts` (or your local `.env`) for the current values, and rotate or disable the seed script entirely before any real deployment. Treat any admin credential checked into a README as a leaked credential, even for a demo project.

---

## 🚀 Key Engineering Formulas & Decision Guidelines

### 1. Capacity planning (Little's Law)

$$\text{Average Concurrent Connections } (L) = \lambda \times W$$

Where `λ` is the arrival rate of new connections/sec and `W` is the average socket session duration. Example: 20 new logins/sec with an average 15-minute (900s) active session implies a single instance must sustain `L = 20 × 900 = 18,000` concurrent WebSocket sessions.

### 2. Rate limiting (token bucket)

$$\text{Tokens}(t) = \min(C, \text{Tokens}(t-1) + r \times \Delta t)$$

Where `C` is burst capacity and `r` is the refill rate/sec. Applied at the socket gateway with different profiles per endpoint: username search is throttled tightly (`C=5, r=0.5/sec`) since it's the primary directory-scraping surface, while message sends allow smoother bursts (`C=15, r=3/sec`) to accommodate natural typing rhythm.

### 3. Cursor-based pagination indexing

Traditional SQL `OFFSET` paging forces a page-scan of complexity `O(offset + limit)`. History endpoints instead query against the composite covering index `(conversation_id, created_at)`, giving `O(log N + limit)` lookup complexity — independent of how far back a user scrolls.

### 4. Why no CRDT?

Collaborative documents need a Conflict-free Replicated Data Type (CRDT) to merge concurrent edits to shared mutable state. Chat messages are append-only, and each has exactly one author — so ordering by monotonic `created_at` plus at-least-once socket delivery is sufficient, without the computational overhead of client-side CRDT merge logic.

---

## 🛠️ Local Setup

1. **Prerequisites**: Node.js v18+.
2. **Environment**: copy `.env.example` to `.env` and fill in the required variables (`JWT_SECRET`, encryption key, etc.).
3. **Database**: Prisma + SQLite is pre-configured for local dev. Push the schema:
   ```bash
   npx prisma db push
   ```
4. **Seed local dev data** (optional, creates the local admin account described above):
   ```bash
   npx prisma db seed
   ```
5. **Run the dev server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
.
├── client/          # React frontend
├── server/          # Express + WebSocket backend
│   ├── prisma/      # Schema + seed script
│   └── src/
├── shared/           # Shared TypeScript types (WebSocket event contracts)
└── .env.example
```

---

## 🧪 Interview Q&A Cheatsheet (Defend Your Code)

**Q: Why native WebSockets over Socket.IO?**
A: Native WebSockets keep the client bundle smaller and run directly on web standards. It meant writing custom heartbeat checks and a resilient resync engine myself, which demonstrates understanding of the underlying TCP upgrade handshake rather than relying on a library to hide it.

**Q: How do you handle connection drops?**
A: The client detects a WebSocket drop, shows a "reconnecting" state, and retries with exponential backoff. On reconnection, it requests any messages created after its last-known cursor, so the resync is gap-free and duplicate-free.

**Q: What happens when an admin deletes a user?**
A: A soft-delete/anonymization pattern — the username is randomized and freed for re-registration, and credentials/tokens are invalidated, but historic messages persist labeled as from a "Deleted Account" so other participants don't see broken, one-sided threads.

**Q: Is this end-to-end encrypted?**
A: No — message content is encrypted at rest (AES-256-GCM) and in transit (TLS/WSS), which protects against a database leak or network interception, but the application server can still read plaintext during normal processing. True E2EE would require client-side key exchange, which is out of scope for this version and tracked in the roadmap.

---

## Roadmap

- [ ] Real Redis deployment for presence/pub-sub (currently an in-memory cache shaped for a drop-in swap)
- [ ] End-to-end encryption for private conversations (client-side key exchange)
- [ ] Message reactions and threaded replies
- [ ] Delivered/read receipt ticks per message
- [ ] Horizontal scaling test across multiple server instances

## License

MIT — see `LICENSE`.

---

<p align="center">Made with ⚡ by <b>Ram</b></p>
