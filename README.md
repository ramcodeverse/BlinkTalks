# Telegram-Style Flat-Identity Chat Engine

A portfolio-grade, production-quality, real-time chat application built on Node.js, Express, native WebSockets, React, and Prisma. This project is explicitly designed to demonstrate senior-level full-stack engineering, focus on system performance, secure data architecture, presence scaling, and resilient synchronization protocols.

---

## 🎨 Core Architectural Blueprint

### 1. Fan-Out & Multi-Instance Scalability
The WebSocket controller is decoupled from database transactions using a Redis-ready **Pub/Sub event loop**:
* **The Flow**: When a user transmits a message to a DM or Group channel, the server validates boundaries and rate limits, encrypts the payload, persists it to storage, and publishes it to the corresponding Redis channel (`chat:conversation:<id>`).
* **Broadcasting**: All active server instances are subscribed to these channels. Each instance receives the published payload and broadcasts it only to the active WebSockets connected to its local instance.
* **Complexity**: This ensures that broadcasting cost is bounded by the conversation membership size ($O(N)$), rather than the total platform population, while the Pub/Sub hop remains constant $O(1)$ regardless of cluster size.

### 2. Ephemeral vs. Durable State (CAP Tradeoff)
We select a highly deliberate strategy for the CAP (Consistency, Availability, Partition-tolerance) tradeoff:
* **Message Delivery (CP - Consistency/Partition-tolerant)**: During network partitions, it is better to briefly reject or buffer a message send than to risk silent message loss or unordered state. Delivery uses strict monotonic database indexing on `(conversation_id, created_at)` and cursor alignments.
* **Presence & Typing States (AP - Available/Partition-tolerant)**: High frequency, micro-interaction payloads bypass the database entirely to prevent write-locking. They are stored in fast in-memory caches (simulating Redis Key-Value hashes) and synced to locally active sockets. Stale presence (e.g. showing a user online for 5 more seconds during a partition) is a minor UX degradation, whereas blocking the app to wait for precise presence consistency is unacceptable.

---

## 🔒 Security & Data Encryption Ledger

* **At-Rest Symmetric Encryption**: Message content columns are encrypted using AES-256-GCM. The initialization vector (IV) and authentication tag are prepended to the ciphertext (`iv:tag:ciphertext`). This protects against static database dump leaks.
* **In-Transit Protection**: Encrypted tunnels protect the entire transport channel (TLS/WSS). Plaintext payloads are decrypted server-side and transmitted only over validated, JWT-authorized WebSocket frames.
* **JWT Access Pins**: Short-lived (15 min) JWT tokens using pinned `HS256` signatures enforce strict token rotation, backed by long-lived Refresh Tokens (7 days).
* **Soft Delete Governance**: To prevent broken threads, orphans, or cascaded delete holes, administrative deletions soft-delete identities by randomized anonymization (`deleted_<hash>`), freeing the original username for re-registration instantly while keeping logs intact.

---

## 🚀 Key Engineering Formulas & Decision Guidelines

### 1. Capacity Planning (Little's Law)
$$\text{Average Concurrent Connections } (L) = \lambda \times W$$
* *Where*: $\lambda$ is the arrival rate of active connection requests per second, and $W$ is the average socket duration. For example, if we receive 20 new logins/sec and users stay active for 15 minutes (900 sec), a single instance must scale to handle $L = 20 \times 900 = 18,000$ concurrent WebSocket sessions.

### 2. Rate Limiting (Token Bucket)
$$\text{Tokens}(t) = \min(C, \text{Tokens}(t-1) + r \times \Delta t)$$
* *Where*: $C$ represents burst capacity allowance, and $r$ is the refill rate/sec.
* *Protection*: Applied at the socket gateway. Searches are throttled tightly ($C=5, r=0.5/\text{sec}$) to defend against malicious directory-scraping, while message limits allow smooth typing bursts ($C=15, r=3/\text{sec}$).

### 3. Cursor-Based Pagination Indexing
Unlike traditional SQL `OFFSET` paging which forces database page-scans of complexity $O(\text{offset} + \text{limit})$, our history endpoints query on the cursor of our composite covering index `(conversation_id, created_at)`. This guarantees $O(\log N + \text{limit})$ lookup complexity, making performance completely independent of how far back in history a user scrolls.

### 4. Why No CRDT?
Collaborative documents require a Conflict-free Replicated Data Type (CRDT) to merge concurrent edits. Chat applications are append-only. Each message is immutable and has exactly one author. Therefore, ordering by monotonic `created_at` timestamps combined with at-least-once socket delivery is sufficient, bypassing unnecessary client-side CRDT computational overhead.

---

## 🛠️ Step-by-Step Local Setup

1. **Prerequisites**: Ensure Node.js (v18+) is installed.
2. **Environment Setup**: Check `.env.example` and set up variables (such as `JWT_SECRET`).
3. **Database Setup**:
   Prisma SQLite is pre-configured and ready. Initialize tables by pushing the schema:
   ```bash
   npx prisma db push
   ```
4. **Launch Application**:
   Run the dev server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Interview Q&A Cheatsheet (Defend Your Code)

* **Q**: *Why did you pick native WebSockets over Socket.IO?*
  **A**: Native WebSockets reduce bundle size and run directly on web standards. It allowed me to write custom heartbeat checks and a resilient resynchronization engine, proving I understand TCP upgrade handshakes rather than relying on library magic.
* **Q**: *How do you handle connection drops?*
  **A**: The client automatically detects WebSocket drops, shows "reconnecting", and initiates an exponential backoff loop. Upon reconnection, it queries the database for missed logs since the latest received message cursor, ensuring zero gaps and zero duplicates.
* **Q**: *What happens when an admin deletes a user?*
  **A**: To protect thread integrity, I designed a soft-delete/anonymization pattern. The user’s username is randomized and freed back into the system, passwords and tokens are destroyed, but the historic messages persist as "Deleted Account" so other participants don't see broken, one-sided conversations.
