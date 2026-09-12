import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import url from "url";
import fs from "fs";
import path from "path";
import { verifyAccessToken } from "./auth.js";
import { getPrisma } from "./db.js";
import { encrypt, decrypt } from "./encryption.js";
import { pubsub, presenceManager } from "./pubsub.js";
import { messageLimiter } from "./limiter.js";
import { ClientWSMessage, ServerWSMessage, UserRole } from "../shared/types.js";

interface CustomWebSocket extends WebSocket {
  userId: string;
  username: string;
  role: UserRole;
  isAlive: boolean;
  subscriptions: Map<string, () => void>; // conversationId -> unsubscribe function
}

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  // Map of userId -> Set of WebSockets (allows multi-device sessions)
  const userSockets = new Map<string, Set<CustomWebSocket>>();

  // Handle upgrade requests manually to verify authorization
  server.on("upgrade", (request, socket, head) => {
    const { pathname, query } = url.parse(request.url || "", true);

    // ONLY intercept upgrades for our chat app websocket endpoint!
    if (pathname !== "/ws") {
      return; // Let other upgrade listeners (e.g. Vite dev server HMR) handle it
    }

    const token = query.token as string;

    if (!token) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    // Block non-admin websocket upgrade if in maintenance mode
    const MAINTENANCE_FILE_PATH = path.join(process.cwd(), "maintenance.json");
    let maintenanceActive = false;
    try {
      if (fs.existsSync(MAINTENANCE_FILE_PATH)) {
        const data = JSON.parse(fs.readFileSync(MAINTENANCE_FILE_PATH, "utf-8"));
        if (data.active) {
          maintenanceActive = true;
        }
      }
    } catch (err) {
      // Ignore
    }

    if (maintenanceActive && payload.role !== "admin") {
      socket.write("HTTP/1.1 503 Service Unavailable\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      const customWs = ws as CustomWebSocket;
      customWs.userId = payload.sub;
      customWs.username = payload.username;
      customWs.role = payload.role;
      customWs.isAlive = true;
      customWs.subscriptions = new Map();

      wss.emit("connection", customWs, request);
    });
  });

  wss.on("connection", async (ws: CustomWebSocket) => {
    const userId = ws.userId;
    const username = ws.username;

    try {
      // Track socket for user
      let sockets = userSockets.get(userId);
      if (!sockets) {
        sockets = new Set();
        userSockets.set(userId, sockets);
      }
      sockets.add(ws);

      console.log(`🔌 WebSocket Connected: @${username} (${sockets.size} active sessions)`);

      // Handle Presence Online
      const isFirstConnection = sockets.size === 1;
      if (isFirstConnection) {
        presenceManager.setPresence(userId, true);
        broadcastPresence(userId, true);
      }

      // Subscribe user socket to all of their current conversation channels
      await subscribeUserToConversations(ws);

      // Subscribe user socket to workspace events
      const unsubWorkspace = pubsub.subscribe("workspace:events", (payloadStr) => {
        try {
          const eventPayload = JSON.parse(payloadStr);
          sendWSMessage(ws, "workspace_event" as any, eventPayload);
        } catch (err) {
          console.error("Error parsing workspace pubsub event:", err);
        }
      });
      ws.subscriptions.set("workspace:events", unsubWorkspace);

      // Initial success handshake
      sendWSMessage(ws, "auth_ack", {
        userId,
        username,
        status: "connected",
      });
    } catch (err: any) {
      console.error("Error in wss connection handler:", err);
    }

    // Handle incoming frames
    ws.on("message", async (data) => {
      try {
        const rawMessage = JSON.parse(data.toString()) as ClientWSMessage;
        await handleClientMessage(ws, rawMessage);
      } catch (err) {
        console.error("Malformed socket frame received:", err);
      }
    });

    // Heartbeat pong receiver
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    // Handle connection termination
    ws.on("close", () => {
      const activeSockets = userSockets.get(userId);
      if (activeSockets) {
        activeSockets.delete(ws);
        if (activeSockets.size === 0) {
          userSockets.delete(userId);
          
          // Last device disconnected -> Set presence offline
          presenceManager.setPresence(userId, false);
          broadcastPresence(userId, false);
          console.log(`🔌 WebSocket Offline: @${username}`);
        } else {
          console.log(`🔌 WebSocket Session closed for @${username} (${activeSockets.size} remaining)`);
        }
      }

      // Cleanup pub/sub subscriptions
      for (const unsubscribe of ws.subscriptions.values()) {
        unsubscribe();
      }
      ws.subscriptions.clear();
    });

    ws.on("error", (err) => {
      console.error(`Socket error for @${username}:`, err);
    });
  });

  // Heartbeat loop: periodically ping connected sockets
  const interval = setInterval(() => {
    wss.clients.forEach((client) => {
      const customWs = client as CustomWebSocket;
      if (customWs.isAlive === false) {
        console.log(`💀 Heartbeat timeout for user ${customWs.username}. Terminating socket.`);
        return customWs.terminate();
      }
      customWs.isAlive = false;
      customWs.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  // ==========================================
  // HELPER METRICS & BROADCASTS
  // ==========================================

  /**
   * Helper to write formatted events
   */
  function sendWSMessage(ws: WebSocket, type: ServerWSMessage["type"], payload: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  }

  /**
   * Subscribes the socket session to Pub/Sub channels for all conversations
   * they are registered as members of.
   */
  async function subscribeUserToConversations(ws: CustomWebSocket) {
    try {
      const prisma = getPrisma();
      const memberships = await prisma.conversationMember.findMany({
        where: { user_id: ws.userId },
        select: { conversation_id: true },
      });

      for (const member of memberships) {
        subscribeToConversationChannel(ws, member.conversation_id);
      }
    } catch (error) {
      console.error("Error setting up dynamic pubsub subscriptions:", error);
    }
  }

  /**
   * Subscribes a CustomWebSocket to a single conversation channel
   */
  function subscribeToConversationChannel(ws: CustomWebSocket, conversationId: string) {
    if (ws.subscriptions.has(conversationId)) return;

    const channelName = `chat:conversation:${conversationId}`;
    const unsubscribe = pubsub.subscribe(channelName, (payloadStr) => {
      try {
        const payload = JSON.parse(payloadStr);
        
        // Suppress echo to original socket if it is a message_ack
        if (payload.type === "message" && payload.sender_id === ws.userId) {
          // Send only if they have multiple tabs open and need synchronizing
          // Or we can just let it echo to allow multi-tab syncing. Yes, multi-tab sync is amazing!
        }
        
        sendWSMessage(ws, payload.type, payload.data);
      } catch (err) {
        console.error("Error parsing published pubsub payload:", err);
      }
    });

    ws.subscriptions.set(conversationId, unsubscribe);
  }

  /**
   * Broadcasts presence status to the user's active direct chats and groups
   */
  async function broadcastPresence(userId: string, isOnline: boolean) {
    try {
      const prisma = getPrisma();
      
      // Find all conversation IDs this user is in
      const memberships = await prisma.conversationMember.findMany({
        where: { user_id: userId },
        select: { conversation_id: true },
      });

      const lastSeenStr = new Date().toISOString();

      for (const m of memberships) {
        const payload = {
          type: "presence",
          data: {
            userId,
            isOnline,
            lastSeen: lastSeenStr,
          },
        };
        // Publish presence state to all conversation channels!
        pubsub.publish(`chat:conversation:${m.conversation_id}`, JSON.stringify(payload));
      }
    } catch (error) {
      console.error("Presence broadcast failed:", error);
    }
  }

  /**
   * Core router of WebSocket messages coming from clients
   */
  async function handleClientMessage(ws: CustomWebSocket, wsMsg: ClientWSMessage) {
    const { type, payload } = wsMsg;

    switch (type) {
      case "pong":
        ws.isAlive = true;
        break;

      case "send_message":
        await handleSendMessage(ws, payload);
        break;

      case "typing":
        await handleTyping(ws, payload);
        break;

      case "read_conversation":
        await handleReadConversation(ws, payload);
        break;

      case "add_reaction":
        // Stretch reaction handling
        break;

      default:
        console.log(`Unmatched WebSocket type: ${type}`);
    }
  }

  /**
   * Client intends to send a message
   */
  async function handleSendMessage(
    ws: CustomWebSocket,
    payload: { temp_id: string; conversation_id: string; content: string }
  ) {
    const { temp_id, conversation_id, content } = payload;

    // 1. Rate Limiting check
    if (!messageLimiter.tryConsume(ws.userId)) {
      sendWSMessage(ws, "message_ack", {
        temp_id,
        success: false,
        error: "Slow down! Rate limit exceeded. (Message throttled by token bucket)",
      });
      return;
    }

    try {
      const prisma = getPrisma();

      // Verify membership
      const memberships = await prisma.conversationMember.findMany({
        where: { conversation_id: conversation_id },
        include: { user: true },
      });

      const myMembership = memberships.find((m) => m.user_id === ws.userId);

      if (!myMembership) {
        sendWSMessage(ws, "message_ack", {
          temp_id,
          success: false,
          error: "You are no longer a member of this conversation.",
        });
        return;
      }

      // Check suspension
      if (myMembership.user.is_suspended) {
        sendWSMessage(ws, "message_ack", {
          temp_id,
          success: false,
          error: "This account is suspended.",
        });
        return;
      }

      // Check if any member has blocked this conversation
      const blockedMember = memberships.find((m) => m.is_blocked);
      if (blockedMember) {
        sendWSMessage(ws, "message_ack", {
          temp_id,
          success: false,
          error: "This conversation is blocked.",
        });
        return;
      }

      // Ensure the recipient socket is subscribed (if they just joined, we handles it dynamically)
      // Actually, if we are in a group, new members subscribe, but we can make sure this socket is subscribed
      subscribeToConversationChannel(ws, conversation_id);

      // 2. Encrypt text content at rest
      const cipherText = encrypt(content.trim());

      // 3. Persist to DB
      const message = await prisma.message.create({
        data: {
          conversation_id,
          sender_id: ws.userId,
          content: cipherText,
        },
      });

      // 4. Send Acknowledgment back to client immediately (At-least-once confirmation)
      sendWSMessage(ws, "message_ack", {
        temp_id,
        message_id: message.id,
        success: true,
      });

      // 5. Publish plaintext content to the conversation channel via Pub/Sub
      const publishedPayload = {
        type: "message",
        data: {
          id: message.id,
          conversation_id,
          sender_id: ws.userId,
          sender_name: myMembership.user.display_name,
          sender_username: myMembership.user.username,
          sender_avatar: myMembership.user.avatar,
          content: content.trim(), // Send PLAINTEXT over authenticated WebSocket
          message_type: message.message_type || "chat",
          metadata: message.metadata || null,
          created_at: message.created_at.toISOString(),
          temp_id, // include temp_id to let the original client resolve local pending state
        },
      };

      pubsub.publish(`chat:conversation:${conversation_id}`, JSON.stringify(publishedPayload));

    } catch (err) {
      console.error("Failed to process socket send_message:", err);
      sendWSMessage(ws, "message_ack", {
        temp_id,
        success: false,
        error: "Message delivery failed due to database error.",
      });
    }
  }

  /**
   * Client transmits typing status
   */
  async function handleTyping(ws: CustomWebSocket, payload: { conversation_id: string; is_typing: boolean }) {
    const { conversation_id, is_typing } = payload;
    
    // Broadcast typing state to the pub/sub channel
    const typingPayload = {
      type: "typing",
      data: {
        userId: ws.userId,
        conversationId: conversation_id,
        isTyping: is_typing,
        username: ws.username,
      },
    };

    pubsub.publish(`chat:conversation:${conversation_id}`, JSON.stringify(typingPayload));
  }

  /**
   * Client marked conversation messages as read
   */
  async function handleReadConversation(ws: CustomWebSocket, payload: { conversation_id: string; message_id: string }) {
    const { conversation_id, message_id } = payload;

    try {
      const prisma = getPrisma();
      
      // Update read timestamp in DB
      await prisma.conversationMember.update({
        where: {
          conversation_id_user_id: {
            conversation_id,
            user_id: ws.userId,
          },
        },
        data: {
          last_read_message_id: message_id,
        },
      });

      // Broadcast read receipt so other clients update double-ticks
      const readPayload = {
        type: "read_receipt",
        data: {
          userId: ws.userId,
          conversationId: conversation_id,
          messageId: message_id,
        },
      };

      pubsub.publish(`chat:conversation:${conversation_id}`, JSON.stringify(readPayload));
    } catch (err) {
      console.error("Read receipt update failed:", err);
    }
  }
}
