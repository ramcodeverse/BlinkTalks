/**
 * Shared Type Definitions for Telegram-like Chat App
 * Acts as the strict contract between Frontend and Backend
 */

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

export interface UserProfile {
  id: string;
  username: string; // unique, e.g. "ram"
  display_name: string;
  avatar?: string | null;
  bio?: string | null;
  role: UserRole;
  is_suspended: boolean;
  created_at: string;
}

export interface Contact {
  owner_id: string;
  contact_user: UserProfile;
  created_at: string;
}

export interface Conversation {
  id: string;
  type: "direct" | "group";
  name?: string | null; // Null for direct chats
  is_public: boolean;
  invite_code?: string | null;
  created_at: string;
  // Included on join or fetch:
  members?: ConversationMember[];
  last_message?: MessagePayload | null;
  unread_count?: number;
  other_user?: UserProfile | null;
  is_accepted?: boolean;
  is_blocked?: boolean;
}

export interface ConversationMember {
  conversation_id: string;
  user_id: string;
  role: "member" | "admin";
  joined_at: string;
  last_read_message_id?: string | null;
  user?: UserProfile;
}

export interface MessagePayload {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_username: string;
  sender_avatar?: string | null;
  content: string; // Plaintext (decrypted by server, never sent encrypted to authenticated socket)
  created_at: string;
  edited_at?: string | null;
  // Reactions list associated with this message
  reactions?: MessageReaction[];
  // Temp ID for optimistic client side reconciliation
  temp_id?: string;
}

export interface MessageReaction {
  emoji: string;
  user_ids: string[];
}

export interface PresenceState {
  userId: string;
  isOnline: boolean;
  lastSeen: string; // ISO String
}

// REST API Requests & Responses
export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface UsernameCheckResponse {
  available: boolean;
  username: string;
}

// WebSocket Event Types
export type ClientMessageType =
  | "auth"
  | "send_message"
  | "typing"
  | "read_conversation"
  | "add_reaction"
  | "remove_reaction"
  | "pong";

export interface ClientWSMessage {
  type: ClientMessageType;
  payload: any;
}

export type ServerMessageType =
  | "auth_ack"
  | "message"
  | "message_ack"
  | "presence"
  | "typing"
  | "read_receipt"
  | "reaction_update"
  | "user_suspended"
  | "message_delete"
  | "ping";

export interface ServerWSMessage {
  type: ServerMessageType;
  payload: any;
}

// Typed WebSocket Payloads
export interface ClientAuthPayload {
  token: string;
}

export interface ClientSendMessagePayload {
  temp_id: string;
  conversation_id: string;
  content: string;
}

export interface ClientTypingPayload {
  conversation_id: string;
  is_typing: boolean;
}

export interface ClientReadPayload {
  conversation_id: string;
  message_id: string;
}

export interface ClientReactionPayload {
  message_id: string;
  emoji: string;
}
