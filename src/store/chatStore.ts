import { create } from "zustand";
import {
  UserProfile,
  Conversation,
  MessagePayload,
  PresenceState,
  ClientWSMessage,
} from "../../shared/types.js";

interface ChatState {
  // Auth state
  user: UserProfile | null;
  token: string | null;
  refreshToken: string | null;
  
  // UI State
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, MessagePayload[]>; // conversation_id -> messages
  presence: Record<string, { isOnline: boolean; lastSeen: string }>;
  typing: Record<string, string[]>; // conversation_id -> array of usernames typing
  contacts: UserProfile[];
  
  // Connection state
  connectionStatus: "connected" | "reconnecting" | "offline";
  socket: WebSocket | null;
  
  // Pending queue for offline resilience
  pendingMessages: { temp_id: string; conversation_id: string; content: string }[];

  // Actions
  setAuth: (user: UserProfile | null, token: string | null, refreshToken: string | null) => void;
  initializeAuth: () => Promise<boolean>;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
  updateProfile: (displayName: string, bio: string) => Promise<void>;
  leaveGroupChat: (conversationId: string) => Promise<void>;
  deleteGroupChat: (conversationId: string) => Promise<void>;
  renameGroupChat: (conversationId: string, name: string) => Promise<void>;
  
  // Conversation actions
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (id: string | null) => void;
  fetchConversations: () => Promise<void>;
  startDirectChat: (targetUserId: string) => Promise<string>;
  createGroupChat: (name: string, isPublic: boolean) => Promise<string>;
  joinGroup: (codeOrId: string) => Promise<string>;
  
  // Message history actions
  fetchMessages: (conversationId: string, cursor?: string) => Promise<boolean>; // returns whether has next page
  sendWSMessage: (type: string, payload: any) => void;
  sendMessage: (content: string) => void;
  deleteMessage: (messageId: string) => Promise<void>;
  markAsRead: (conversationId: string, messageId: string) => void;
  
  // Contacts
  fetchContacts: () => Promise<void>;
  addContact: (userId: string) => Promise<void>;
  removeContact: (userId: string) => Promise<void>;
  
  // Socket orchestration
  connectSocket: () => void;
  disconnectSocket: () => void;
  handleSocketIncoming: (event: MessageEvent) => void;
}

const DEV_BACKEND = "https://ais-dev-qssxoo2vmqcb6brvxriblu-721377060812.asia-southeast1.run.app";
const PRE_BACKEND = "https://ais-pre-qssxoo2vmqcb6brvxriblu-721377060812.asia-southeast1.run.app";

function isDevEnv() {
  const hostname = window.location.hostname;
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.includes("-dev") ||
    hostname.includes("ais-dev") ||
    !!import.meta.env.DEV
  );
}

function getApiBase() {
  const envUrl = (import.meta.env.VITE_API_URL || "").trim();
  if (envUrl) return envUrl.replace(/\/$/, "");

  const hostname = window.location.hostname;
  // If running on localhost, 127.0.0.1, on Netlify (which has backend proxying configured),
  // or directly on the Cloud Run container/preview iframe itself,
  // we can use relative paths "" so it connects to the local or proxied co-located server.
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".run.app") ||
    hostname.endsWith(".netlify.app") ||
    hostname.includes("googleusercontent.com") ||
    hostname.includes("google.com")
  ) {
    return "";
  }

  // Otherwise, we are on a proxy or external host (like Netlify),
  // so we use the absolute Cloud Run backend URL.
  return isDevEnv() ? DEV_BACKEND : PRE_BACKEND;
}

export const API_BASE = getApiBase();

export async function safeParseJson(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    throw new Error(
      `The server returned an HTML page instead of JSON (Status ${res.status}). This often means the backend API URL is incorrect, down, or blocked by a proxy.`
    );
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
      throw new Error(
        `The server returned an HTML page (Status ${res.status}). Please check that your VITE_API_URL environment variable is correct and that the backend server is running.`
      );
    }
    throw new Error(`Failed to parse response as JSON (Status ${res.status}): ${text.slice(0, 100)}`);
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof payload.exp !== "number") return false;
    // Buffer of 15 seconds to avoid handshake race conditions
    return (payload.exp * 1000) - 15000 < Date.now();
  } catch (err) {
    return true;
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  conversations: [],
  activeConversationId: null,
  messages: {},
  presence: {},
  typing: {},
  contacts: [],
  connectionStatus: "offline",
  socket: null,
  pendingMessages: [],

  setAuth: (user, token, refreshToken) => {
    if (token) {
      localStorage.setItem("tg_token", token);
    } else {
      localStorage.removeItem("tg_token");
    }
    if (refreshToken) {
      localStorage.setItem("tg_refresh", refreshToken);
    } else {
      localStorage.removeItem("tg_refresh");
    }
    set({ user, token, refreshToken });
  },

  initializeAuth: async () => {
    const token = localStorage.getItem("tg_token");
    const refresh = localStorage.getItem("tg_refresh");
    
    if (!token) return false;

    set({ token, refreshToken: refresh });

    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await safeParseJson(res);
        set({ user: data.user, connectionStatus: "offline" });
        get().connectSocket();
        get().fetchConversations();
        get().fetchContacts();
        return true;
      } else if (res.status === 401 && refresh) {
        // Access token expired -> Try refresh
        const refreshed = await get().refreshSession();
        return refreshed;
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    }
    return false;
  },

  refreshSession: async () => {
    const refresh = get().refreshToken;
    if (!refresh) return false;

    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      });

      if (res.ok) {
        const data = await safeParseJson(res);
        const token = data.token;
        localStorage.setItem("tg_token", token);
        set({ token });
        
        // Re-get me
        const meRes = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (meRes.ok) {
          const meData = await safeParseJson(meRes);
          set({ user: meData.user });
          get().connectSocket();
          get().fetchConversations();
          get().fetchContacts();
          return true;
        }
      }
    } catch (err) {
      console.error("Token refresh failed:", err);
    }
    get().logout();
    return false;
  },

  login: async (username, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await safeParseJson(res);
    if (!res.ok) {
      throw new Error(data.error || "Login failed");
    }

    get().setAuth(data.user, data.token, data.refreshToken);
    get().connectSocket();
    await get().fetchConversations();
    await get().fetchContacts();
  },

  signup: async (username, password, displayName) => {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, display_name: displayName }),
    });

    const data = await safeParseJson(res);
    if (!res.ok) {
      throw new Error(data.error || "Signup failed");
    }

    get().setAuth(data.user, data.token, data.refreshToken);
    get().connectSocket();
    await get().fetchConversations();
    await get().fetchContacts();
  },

  logout: () => {
    get().disconnectSocket();
    localStorage.removeItem("tg_token");
    localStorage.removeItem("tg_refresh");
    set({
      user: null,
      token: null,
      refreshToken: null,
      conversations: [],
      activeConversationId: null,
      messages: {},
      presence: {},
      typing: {},
      contacts: [],
      connectionStatus: "offline",
    });
  },

  updateProfile: async (displayName, bio) => {
    const token = get().token;
    if (!token) throw new Error("No active credentials");

    const res = await fetch(`${API_BASE}/api/users/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ display_name: displayName, bio }),
    });

    const data = await safeParseJson(res);
    if (!res.ok) {
      throw new Error(data.error || "Failed to update profile");
    }

    set({ user: data.user });
  },

  leaveGroupChat: async (conversationId) => {
    const token = get().token;
    if (!token) throw new Error("Unauthorized");

    const res = await fetch(`${API_BASE}/api/conversations/${conversationId}/leave`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const data = await safeParseJson(res);
      throw new Error(data.error || "Failed to leave group");
    }

    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== conversationId),
      activeConversationId: state.activeConversationId === conversationId ? null : state.activeConversationId,
    }));
  },

  deleteGroupChat: async (conversationId) => {
    const token = get().token;
    if (!token) throw new Error("Unauthorized");

    const res = await fetch(`${API_BASE}/api/conversations/${conversationId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const data = await safeParseJson(res);
      throw new Error(data.error || "Failed to delete group");
    }

    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== conversationId),
      activeConversationId: state.activeConversationId === conversationId ? null : state.activeConversationId,
    }));
  },

  renameGroupChat: async (conversationId, name) => {
    const token = get().token;
    if (!token) throw new Error("Unauthorized");

    const res = await fetch(`${API_BASE}/api/conversations/${conversationId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });

    const data = await safeParseJson(res);
    if (!res.ok) {
      throw new Error(data.error || "Failed to rename group");
    }

    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, name: data.name } : c
      ),
    }));
  },

  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (id) => {
    set({ activeConversationId: id });
    if (id) {
      // Clear unread indicator locally
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, unread_count: 0 } : c
        ),
      }));

      // Fetch message history
      get().fetchMessages(id);

      // Tell server we read the conversation up to last message
      const history = get().messages[id] || [];
      if (history.length > 0) {
        const lastMsg = history[history.length - 1];
        get().markAsRead(id, lastMsg.id);
      }
    }
  },

  fetchConversations: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await safeParseJson(res);
        set({ conversations: data.conversations });
      }
    } catch (err) {
      console.error("Fetch conversations failed:", err);
    }
  },

  startDirectChat: async (targetUserId) => {
    const token = get().token;
    if (!token) throw new Error("Unauthorized");

    const res = await fetch(`${API_BASE}/api/conversations/direct`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ targetUserId }),
    });

    const data = await safeParseJson(res);
    if (!res.ok) throw new Error(data.error || "Failed to start direct chat");

    // Prepend or switch to it
    const conversations = get().conversations;
    if (!conversations.some((c) => c.id === data.id)) {
      set({ conversations: [data, ...conversations] });
    }
    
    // Subscribe our current socket to this new conversation dynamically!
    // Since WebSocket will receive standard packets, joining on WS is dynamic
    get().setActiveConversation(data.id);
    return data.id;
  },

  createGroupChat: async (name, isPublic) => {
    const token = get().token;
    if (!token) throw new Error("Unauthorized");

    const res = await fetch(`${API_BASE}/api/conversations/group`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, is_public: isPublic }),
    });

    const data = await safeParseJson(res);
    if (!res.ok) throw new Error(data.error || "Failed to create group");

    set({ conversations: [data, ...get().conversations] });
    get().setActiveConversation(data.id);
    return data.id;
  },

  joinGroup: async (codeOrId) => {
    const token = get().token;
    if (!token) throw new Error("Unauthorized");

    const res = await fetch(`${API_BASE}/api/conversations/join/${codeOrId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await safeParseJson(res);
    if (!res.ok) throw new Error(data.error || "Failed to join group");

    await get().fetchConversations();
    get().setActiveConversation(data.conversationId);
    return data.conversationId;
  },

  fetchMessages: async (conversationId, cursor) => {
    const token = get().token;
    if (!token) return false;

    try {
      const url = cursor 
        ? `${API_BASE}/api/conversations/${conversationId}/messages?cursor=${encodeURIComponent(cursor)}`
        : `${API_BASE}/api/conversations/${conversationId}/messages`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await safeParseJson(res);
        
        set((state) => {
          const existing = state.messages[conversationId] || [];
          let merged;
          
          if (cursor) {
            // Prepend older history
            merged = [...data.messages, ...existing];
          } else {
            // Overwrite or full reload
            merged = data.messages;
          }

          // Deduplicate by message ID
          const seen = new Set();
          const deduped = merged.filter((m) => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
          });

          return {
            messages: {
              ...state.messages,
              [conversationId]: deduped,
            },
          };
        });

        return !!data.nextCursor;
      }
    } catch (err) {
      console.error("Fetch messages failed:", err);
    }
    return false;
  },

  fetchContacts: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await safeParseJson(res);
        set({ contacts: data.contacts });
      }
    } catch (err) {
      console.error("Failed to load contacts:", err);
    }
  },

  addContact: async (userId) => {
    const token = get().token;
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ contactUserId: userId }),
      });
      if (res.ok) {
        await get().fetchContacts();
      }
    } catch (err) {
      console.error("Failed to add contact:", err);
    }
  },

  removeContact: async (userId) => {
    const token = get().token;
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/contacts/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await get().fetchContacts();
      }
    } catch (err) {
      console.error("Failed to delete contact:", err);
    }
  },

  // ==========================================
  // WEBSOCKET COMMUNICATOR
  // ==========================================

  sendWSMessage: (type, payload) => {
    const socket = get().socket;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, payload }));
    } else {
      console.warn("Socket not connected. Buffering action.");
    }
  },

  sendMessage: (content) => {
    const activeId = get().activeConversationId;
    const user = get().user;
    if (!activeId || !user) return;

    const temp_id = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    // Create local optimistic payload (pending state)
    const optimisticMessage: MessagePayload = {
      id: temp_id,
      conversation_id: activeId,
      sender_id: user.id,
      sender_name: user.display_name,
      sender_username: user.username,
      sender_avatar: user.avatar,
      content: content.trim(),
      created_at: new Date().toISOString(),
      temp_id, // mark it as pending
    };

    // 1. Instantly push to UI (Optimistic update)
    set((state) => {
      const current = state.messages[activeId] || [];
      return {
        messages: {
          ...state.messages,
          [activeId]: [...current, optimisticMessage],
        },
      };
    });

    // 2. Transmit via Socket
    get().sendWSMessage("send_message", {
      temp_id,
      conversation_id: activeId,
      content: content.trim(),
    });
  },

  deleteMessage: async (messageId) => {
    const token = get().token;
    if (!token) throw new Error("Unauthorized");

    const res = await fetch(`${API_BASE}/api/messages/${messageId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await safeParseJson(res);
      throw new Error(data.error || "Failed to delete message");
    }
  },

  markAsRead: (conversationId, messageId) => {
    get().sendWSMessage("read_conversation", {
      conversation_id: conversationId,
      message_id: messageId,
    });
  },

  connectSocket: async () => {
    let token = get().token;
    if (!token || get().socket) return;

    // Refresh token proactively if it is expired or close to expiring
    if (isTokenExpired(token) && get().refreshToken) {
      console.log("🔌 WS Handshake: Access token is expired/expiring. Refreshing session...");
      const success = await get().refreshSession();
      if (!success) {
        console.error("🔌 WS Handshake: Token refresh failed. Terminating socket connection attempt.");
        return;
      }
      token = get().token;
      if (!token) return;
    }

    set({ connectionStatus: "reconnecting" });

    // Derive protocol and host (wss:// if secure context, ws:// otherwise)
    const apiBase = API_BASE;
    let wsUrl;
    if (apiBase) {
      const wsProtocol = apiBase.startsWith("https:") ? "wss:" : "ws:";
      const host = apiBase.replace(/^https?:\/\//, "");
      const cleanHost = host.endsWith("/") ? host.slice(0, -1) : host;
      wsUrl = `${wsProtocol}//${cleanHost}/ws?token=${token}`;
    } else {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;
    }
    
    console.log("🔌 Initializing WS Connection:", wsUrl);
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      set({ socket, connectionStatus: "connected" });
      console.log("🔌 WebSocket Handshake Completed.");

      // Re-sync active conversation logs on reconnection
      const activeId = get().activeConversationId;
      if (activeId) {
        get().fetchMessages(activeId);
      }
      // Re-fetch chat listings to update read heads/presence
      get().fetchConversations();
    };

    socket.onmessage = get().handleSocketIncoming;

    socket.onerror = (err) => {
      console.error("🔌 WebSocket transport error:", err);
    };

    socket.onclose = () => {
      console.log("🔌 WebSocket disconnected. Retrying in 3 seconds...");
      set({ socket: null, connectionStatus: "offline" });
      
      // Auto reconnect loop
      setTimeout(() => {
        if (get().token) {
          get().connectSocket();
        }
      }, 3000);
    };
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.close();
      set({ socket: null, connectionStatus: "offline" });
    }
  },

  handleSocketIncoming: (event) => {
    try {
      const { type, payload } = JSON.parse(event.data);

      switch (type) {
        case "auth_ack":
          console.log("🔌 Authenticated on socket session.", payload);
          break;

        case "message_ack": {
          const { temp_id, message_id, success, error } = payload;
          const activeId = get().activeConversationId;
          if (!activeId) return;

          // Replace optimistic temp ID with permanent DB ID, or mark as error
          set((state) => {
            const list = state.messages[activeId] || [];
            const updated = list.map((msg) => {
              if (msg.id === temp_id) {
                if (success) {
                  return { ...msg, id: message_id, temp_id: undefined };
                } else {
                  return { ...msg, content: `⚠️ Error: ${error || "Failed to send message"}`, is_error: true } as any;
                }
              }
              return msg;
            });
            return {
              messages: {
                ...state.messages,
                [activeId]: updated,
              },
            };
          });
          break;
        }

        case "message": {
          const message = payload as MessagePayload;
          const convId = message.conversation_id;

          // 1. Add message to state
          set((state) => {
            const current = state.messages[convId] || [];
            
            // Check if we already have this message (e.g. sender who optimistically added it,
            // or we got message ack first, or duplicate event)
            if (current.some((m) => m.id === message.id || (message.temp_id && m.id === message.temp_id))) {
              // Resolve pending optimistic tag
              return {
                messages: {
                  ...state.messages,
                  [convId]: current.map((m) => 
                    m.id === message.id || (message.temp_id && m.id === message.temp_id)
                      ? { ...message, temp_id: undefined }
                      : m
                  ),
                },
              };
            }

            return {
              messages: {
                ...state.messages,
                [convId]: [...current, message],
              },
            };
          });

          // 2. Update last message in the conversations list
          set((state) => {
            const updatedConvList = state.conversations.map((c) => {
              if (c.id === convId) {
                const unreadIncrement = (state.activeConversationId !== convId) ? (c.unread_count || 0) + 1 : 0;
                return {
                  ...c,
                  last_message: message,
                  unread_count: unreadIncrement,
                };
              }
              return c;
            });

            // Float conversation to the top
            const target = updatedConvList.find((c) => c.id === convId);
            const remaining = updatedConvList.filter((c) => c.id !== convId);
            
            return {
              conversations: target ? [target, ...remaining] : updatedConvList,
            };
          });

          // 3. Mark as read immediately if current active
          if (get().activeConversationId === convId) {
            get().markAsRead(convId, message.id);
          }
          break;
        }

        case "message_delete": {
          const { message_id, conversation_id, soft_delete_content } = payload;
          set((state) => {
            const current = state.messages[conversation_id] || [];
            
            let updatedMessages;
            if (soft_delete_content) {
              updatedMessages = current.map((m) => {
                if (m.id === message_id) {
                  return {
                    ...m,
                    content: soft_delete_content,
                  };
                }
                return m;
              });
            } else {
              updatedMessages = current.filter((m) => m.id !== message_id);
            }
            
            // Also need to update the last message in conversations list if that message was deleted or soft-deleted
            const updatedConversations = state.conversations.map((c) => {
              if (c.id === conversation_id && c.last_message?.id === message_id) {
                if (soft_delete_content) {
                  return {
                    ...c,
                    last_message: {
                      ...c.last_message,
                      content: soft_delete_content,
                    },
                  };
                } else {
                  const nextLastMsg = updatedMessages.length > 0 ? updatedMessages[updatedMessages.length - 1] : null;
                  return {
                    ...c,
                    last_message: nextLastMsg,
                  };
                }
              }
              return c;
            });

            return {
              messages: {
                ...state.messages,
                [conversation_id]: updatedMessages,
              },
              conversations: updatedConversations,
            };
          });
          break;
        }

        case "presence": {
          const { userId, isOnline, lastSeen } = payload;
          set((state) => ({
            presence: {
              ...state.presence,
              [userId]: { isOnline, lastSeen },
            },
          }));
          break;
        }

        case "typing": {
          const { userId, conversationId, isTyping, username } = payload;
          if (userId === get().user?.id) return; // ignore our own typing status

          set((state) => {
            const current = state.typing[conversationId] || [];
            let updated;
            if (isTyping) {
              updated = current.includes(username) ? current : [...current, username];
            } else {
              updated = current.filter((u) => u !== username);
            }
            return {
              typing: {
                ...state.typing,
                [conversationId]: updated,
              },
            };
          });
          break;
        }

        case "read_receipt": {
          // Double ticks resolution can be managed here (visual updates)
          break;
        }

        case "user_suspended": {
          alert("Account Suspended. This account has been suspended by an admin.");
          get().logout();
          break;
        }

        case "conversation_accepted": {
          get().fetchConversations();
          break;
        }

        case "conversation_blocked": {
          const { conversationId, userId } = payload;
          if (get().activeConversationId === conversationId && get().user?.id === userId) {
            set({ activeConversationId: null });
          }
          get().fetchConversations();
          break;
        }

        case "conversation_unblocked": {
          get().fetchConversations();
          break;
        }

        case "group_join":
        case "group_leave": {
          const { conversationId, userId, removed } = payload;
          if (conversationId === get().activeConversationId && userId === get().user?.id && removed) {
            set({ activeConversationId: null });
            alert("You have been removed from this group.");
          }
          get().fetchConversations();
          break;
        }

        default:
          console.log(`Unhandled Server event type: ${type}`);
      }
    } catch (err) {
      console.error("Error processing incoming WebSocket payload:", err);
    }
  },
}));
