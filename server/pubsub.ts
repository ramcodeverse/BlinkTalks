import { EventEmitter } from "events";

/**
 * Pub/Sub Interface contract for multi-instance horizontal scalability.
 * In a multi-node production setup (e.g. Railway, Render, Kubernetes),
 * this would be backed by Redis. Locally, we use an in-memory event-emitter
 * that behaves identically to Redis's non-blocking subscribe/publish loop.
 */
export interface IPubSub {
  publish(channel: string, payload: string): void;
  subscribe(channel: string, callback: (payload: string) => void): () => void;
}

class InMemoryPubSub implements IPubSub {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(1000); // Prevent memory leak warnings with high connection count
  }

  public publish(channel: string, payload: string): void {
    this.emitter.emit(channel, payload);
  }

  /**
   * Subscribes to a channel. Returns an unsubscribe function.
   */
  public subscribe(channel: string, callback: (payload: string) => void): () => void {
    this.emitter.on(channel, callback);
    return () => {
      this.emitter.off(channel, callback);
    };
  }
}

// Global PubSub instance
export const pubsub: IPubSub = new InMemoryPubSub();

/**
 * Ephemeral presence and typing state storage.
 * Telegram-style high-frequency updates live in Redis or high-speed cache, not Postgres,
 * avoiding expensive transactional write-write conflicts.
 */
class EphemeralPresenceManager {
  private presence = new Map<string, { isOnline: boolean; lastSeen: number }>();
  private typing = new Map<string, Set<string>>(); // conversationId -> Set of userIds typing

  public setPresence(userId: string, isOnline: boolean): { isOnline: boolean; lastSeen: number } {
    const state = { isOnline, lastSeen: Date.now() };
    this.presence.set(userId, state);
    return state;
  }

  public getPresence(userId: string): { isOnline: boolean; lastSeen: number } {
    return this.presence.get(userId) || { isOnline: false, lastSeen: 0 };
  }

  public setTyping(conversationId: string, userId: string, isTyping: boolean): string[] {
    let typers = this.typing.get(conversationId);
    if (!typers) {
      typers = new Set();
      this.typing.set(conversationId, typers);
    }

    if (isTyping) {
      typers.add(userId);
    } else {
      typers.delete(userId);
    }

    return Array.from(typers);
  }

  public getTyping(conversationId: string): string[] {
    const typers = this.typing.get(conversationId);
    return typers ? Array.from(typers) : [];
  }

  public getLiveConnectionCount(): number {
    let count = 0;
    for (const [_, state] of this.presence.entries()) {
      if (state.isOnline) count++;
    }
    return count;
  }
}

export const presenceManager = new EphemeralPresenceManager();
