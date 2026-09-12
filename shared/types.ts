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
  email?: string | null;
  email_verified?: boolean;
  avatar?: string | null;
  bio?: string | null;
  role: UserRole;
  is_suspended: boolean;
  job_title?: string | null;
  department?: string | null;
  status_message?: string | null;
  theme_pref?: string | null;
  created_at: string;
}

// ==========================================
// WORKSPACE & COLLABORATION TYPES
// ==========================================

export type WorkspaceRole =
  | "OWNER"
  | "ADMIN"
  | "MANAGER"
  | "MEMBER"
  | "GUEST"
  | "owner"
  | "admin"
  | "manager"
  | "member"
  | "guest";

export type MemberStatus = "ACTIVE" | "SUSPENDED" | "REMOVED";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  invite_code: string;
  role: WorkspaceRole;
  status: InvitationStatus;
  invited_by: string;
  invited_user_id?: string | null;
  invited_email?: string | null;
  allowed_departments?: string | null;
  allowed_communities?: string | null;
  created_at: string;
  expires_at?: string | null;
  accepted_at?: string | null;
  accepted_by?: string | null;
  inviter?: {
    id: string;
    username: string;
    display_name: string;
    avatar?: string | null;
  };
}

export interface WorkspaceAuditLog {
  id: string;
  workspace_id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  target_id?: string | null;
  target_name?: string | null;
  details?: string | null;
  created_at: string;
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "BLOCKED" | "COMPLETED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type ProjectStatus = "Planning" | "Active" | "On Hold" | "Completed" | "Archived";

export interface SubtaskItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  logo?: string | null;
  invite_code: string;
  owner_id: string;
  created_at: string;
  role?: WorkspaceRole;
  status?: MemberStatus;
  members_count?: number;
  projects_count?: number;
  tasks_count?: number;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  status: MemberStatus;
  department?: string | null;
  joined_at: string;
  joined_by?: string | null;
  removal_reason?: string | null;
  suspended_at?: string | null;
  last_active_at?: string | null;
  updated_at?: string;
  user: UserProfile;
}

export interface Department {
  id: string;
  workspace_id: string;
  name: string;
  description?: string | null;
  created_at: string;
  members_count?: number;
}

export interface Project {
  id: string;
  workspace_id: string;
  community_id?: string | null;
  name: string;
  description?: string | null;
  color: string;
  icon: string;
  start_date?: string | null;
  due_date?: string | null;
  priority: TaskPriority;
  status: ProjectStatus;
  owner_id: string;
  created_at: string;
  updated_at: string;
  tasks_count?: number;
  completed_tasks_count?: number;
  in_progress_tasks_count?: number;
  overdue_tasks_count?: number;
  completion_percentage?: number;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  status: "PENDING" | "COMPLETED";
  created_at: string;
}

export interface Task {
  id: string;
  workspace_id: string;
  project_id?: string | null;
  community_id?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id?: string | null;
  creator_id: string;
  due_date?: string | null;
  start_date?: string | null;
  labels: string[];
  subtasks: SubtaskItem[];
  dependencies: string[];
  order_index: number;
  source_msg?: string | null;
  created_at: string;
  updated_at: string;
  assignee?: UserProfile | null;
  creator?: UserProfile;
  project?: { id: string; name: string; color: string } | null;
  comments_count?: number;
  comments?: TaskComment[];
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: UserProfile;
}

export interface Announcement {
  id: string;
  workspace_id: string;
  author_id: string;
  title: string;
  content: string;
  priority: "NORMAL" | "HIGH" | "URGENT";
  expires_at?: string | null;
  created_at: string;
  author?: UserProfile;
}

export interface WorkspaceActivity {
  id: string;
  workspace_id: string;
  user_id: string;
  user_name: string;
  action: string;
  object_type: string;
  object_title: string;
  details?: string | null;
  created_at: string;
}

export interface Meeting {
  id: string;
  workspace_id: string;
  project_id?: string | null;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  link?: string | null;
  created_by: string;
  created_at: string;
  project?: { id: string; name: string; color: string } | null;
}

export interface Note {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceFile {
  id: string;
  workspace_id: string;
  project_id?: string | null;
  task_id?: string | null;
  name: string;
  file_type: string;
  size_bytes: number;
  url: string;
  uploaded_by: string;
  created_at: string;
  uploader?: UserProfile;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface SavedItem {
  id: string;
  user_id: string;
  item_type: "task" | "message" | "announcement" | "file";
  item_id: string;
  title: string;
  details?: string | null;
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
  category?: string | null;
  topic?: string | null;
  is_community?: boolean;
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
  message_type?: string; // "chat" | "task_activity" | "project_activity" | "system"
  metadata?: string | null; // JSON string payload for rich activity cards
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
