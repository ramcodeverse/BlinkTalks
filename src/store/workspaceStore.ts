import { create } from "zustand";
import {
  Workspace,
  WorkspaceMember,
  WorkspaceInvitation,
  WorkspaceAuditLog,
  WorkspaceRole,
  Department,
  Project,
  Task,
  TaskComment,
  Announcement,
  WorkspaceActivity,
  Meeting,
  Note,
  WorkspaceFile,
  NotificationItem,
  SavedItem,
} from "../../shared/types.js";
import { useChatStore, API_BASE, safeParseJson } from "./chatStore.js";

export type WorkspaceTab =
  | "dashboard"
  | "chats"
  | "my-work"
  | "kanban"
  | "projects"
  | "calendar"
  | "team"
  | "announcements"
  | "notes"
  | "files"
  | "analytics";

export interface WorkspaceAnalytics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  inReviewTasks: number;
  blockedTasks: number;
  completionRate: number;
  totalProjects: number;
  totalMembers: number;
  overdueTasks: number;
  highPriorityTasks: number;
}

interface WorkspaceState {
  // Navigation & UI
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;

  // Workspace
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  isLoadingWorkspaces: boolean;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (name: string, description?: string, category?: string) => Promise<Workspace>;
  joinWorkspace: (inviteCode: string) => Promise<Workspace>;

  // Projects
  projects: Project[];
  activeProject: Project | null;
  isLoadingProjects: boolean;
  setActiveProject: (project: Project | null) => void;
  fetchProjects: () => Promise<void>;
  createProject: (data: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Tasks
  tasks: Task[];
  activeTask: Task | null;
  isLoadingTasks: boolean;
  taskFilterStatus: string;
  taskFilterPriority: string;
  taskFilterAssignee: string;
  taskSearchQuery: string;
  setTaskFilterStatus: (s: string) => void;
  setTaskFilterPriority: (p: string) => void;
  setTaskFilterAssignee: (a: string) => void;
  setTaskSearchQuery: (q: string) => void;
  setActiveTask: (task: Task | null) => void;
  fetchTasks: (projectId?: string) => Promise<void>;
  createTask: (data: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTaskStatus: (taskId: string, newStatus: string) => Promise<void>;
  addTaskComment: (taskId: string, content: string) => Promise<TaskComment>;

  // Members & Departments
  members: WorkspaceMember[];
  departments: Department[];
  isLoadingMembers: boolean;
  fetchMembers: () => Promise<void>;
  fetchDepartments: () => Promise<void>;
  addMember: (userId: string, role?: string, department?: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: string, department?: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  suspendMember: (userId: string, reason?: string) => Promise<void>;
  restoreMember: (userId: string) => Promise<void>;
  removeMemberWithReason: (userId: string, reason?: string) => Promise<void>;
  bulkRemoveMembers: (userIds: string[], reason?: string) => Promise<void>;
  bulkUpdateMemberRoles: (userIds: string[], role: string) => Promise<void>;
  transferOwnership: (newOwnerId: string) => Promise<void>;
  fetchMemberWorkload: (userId: string) => Promise<any>;

  // Invitations
  invitations: WorkspaceInvitation[];
  isLoadingInvitations: boolean;
  fetchInvitations: (status?: string) => Promise<void>;
  createInviteLink: (role?: string, expiresInDays?: number, targetEmailOrUser?: string) => Promise<WorkspaceInvitation>;
  batchInvite: (targets: string[], role?: string) => Promise<{ created: WorkspaceInvitation[]; skipped: string[] }>;
  revokeInvitation: (invitationId: string) => Promise<void>;
  resendInvitation: (invitationId: string) => Promise<WorkspaceInvitation>;
  validateInviteCode: (code: string) => Promise<any>;

  // Audit Logs
  auditLogs: WorkspaceAuditLog[];
  isLoadingAuditLogs: boolean;
  fetchAuditLogs: (action?: string) => Promise<void>;

  // Real-time Event Handler
  handleWorkspaceRealtimeEvent: (event: string, data: any) => void;

  // Announcements
  announcements: Announcement[];
  isLoadingAnnouncements: boolean;
  fetchAnnouncements: () => Promise<void>;
  createAnnouncement: (title: string, content: string, priority?: string) => Promise<Announcement>;

  // Activities
  activities: WorkspaceActivity[];
  isLoadingActivities: boolean;
  fetchActivities: () => Promise<void>;

  // Meetings
  meetings: Meeting[];
  isLoadingMeetings: boolean;
  fetchMeetings: () => Promise<void>;
  createMeeting: (data: Partial<Meeting>) => Promise<Meeting>;
  deleteMeeting: (id: string) => Promise<void>;

  // Notes
  notes: Note[];
  isLoadingNotes: boolean;
  fetchNotes: () => Promise<void>;
  createNote: (title: string, content: string, isPinned?: boolean) => Promise<Note>;
  updateNote: (id: string, data: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  // Files
  files: WorkspaceFile[];
  isLoadingFiles: boolean;
  fetchFiles: () => Promise<void>;
  createFileEntry: (name: string, fileType: string, sizeBytes: number, url: string, projectId?: string) => Promise<WorkspaceFile>;

  // Notifications
  notifications: NotificationItem[];
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  // Saved Items
  savedItems: SavedItem[];
  fetchSavedItems: () => Promise<void>;
  toggleSavedItem: (itemType: "task" | "message" | "announcement" | "file", itemId: string, title: string, details?: string) => Promise<void>;

  // Analytics
  analytics: WorkspaceAnalytics | null;
  fetchAnalytics: () => Promise<void>;

  // Modals
  isTaskModalOpen: boolean;
  setIsTaskModalOpen: (open: boolean) => void;
  taskModalPrefill: Partial<Task> | null;
  setTaskModalPrefill: (prefill: Partial<Task> | null) => void;

  isProjectModalOpen: boolean;
  setIsProjectModalOpen: (open: boolean) => void;

  isMeetingModalOpen: boolean;
  setIsMeetingModalOpen: (open: boolean) => void;

  isAnnouncementModalOpen: boolean;
  setIsAnnouncementModalOpen: (open: boolean) => void;

  isWorkspaceModalOpen: boolean;
  setIsWorkspaceModalOpen: (open: boolean) => void;
}

function getAuthHeader() {
  const token = useChatStore.getState().token;
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  activeTab: "dashboard",
  setActiveTab: (tab) => set({ activeTab: tab }),

  workspaces: [],
  activeWorkspace: null,
  isLoadingWorkspaces: false,
  setWorkspaces: (workspaces) => set({ workspaces }),
  setActiveWorkspace: (workspace) => {
    set({ activeWorkspace: workspace, activeProject: null });
    if (workspace) {
      // Auto fetch all resources for this workspace
      get().fetchProjects();
      get().fetchTasks();
      get().fetchMembers();
      get().fetchDepartments();
      get().fetchAnnouncements();
      get().fetchActivities();
      get().fetchMeetings();
      get().fetchNotes();
      get().fetchFiles();
      get().fetchAnalytics();
    }
  },

  fetchWorkspaces: async () => {
    set({ isLoadingWorkspaces: true });
    try {
      const res = await fetch(`${API_BASE}/api/workspaces`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch workspaces: ${res.status}`);
      }
      const data = await safeParseJson(res);
      const list: Workspace[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.workspaces)
        ? data.workspaces
        : [];
      set({ workspaces: list, isLoadingWorkspaces: false });
      
      // If no active workspace is selected, select first one
      const currentActive = get().activeWorkspace;
      if (!currentActive && list.length > 0) {
        get().setActiveWorkspace(list[0]);
      } else if (currentActive) {
        const found = list.find((w: Workspace) => w.id === currentActive.id);
        if (found) {
          set({ activeWorkspace: found });
        } else if (list.length > 0) {
          get().setActiveWorkspace(list[0]);
        }
      }
    } catch (err) {
      console.error("fetchWorkspaces error:", err);
      set({ isLoadingWorkspaces: false });
    }
  },

  createWorkspace: async (name, description, category) => {
    const res = await fetch(`${API_BASE}/api/workspaces`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({ name, description, category }),
    });
    if (!res.ok) {
      const err = await safeParseJson(res);
      throw new Error(err.error || "Failed to create workspace");
    }
    const data = await safeParseJson(res);
    const created = data?.workspace || data;
    set((state) => ({
      workspaces: [created, ...state.workspaces],
      activeWorkspace: created,
    }));
    get().setActiveWorkspace(created);
    return created;
  },

  joinWorkspace: async (inviteCode) => {
    const res = await fetch(`${API_BASE}/api/workspaces/join`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({ invite_code: inviteCode }),
    });
    if (!res.ok) {
      const err = await safeParseJson(res);
      throw new Error(err.error || "Failed to join workspace");
    }
    const data = await safeParseJson(res);
    const joined = data?.workspace || data;
    await get().fetchWorkspaces();
    get().setActiveWorkspace(joined);
    return joined;
  },

  // Projects
  projects: [],
  activeProject: null,
  isLoadingProjects: false,
  setActiveProject: (project) => {
    set({ activeProject: project });
    if (project) {
      get().fetchTasks(project.id);
    } else {
      get().fetchTasks();
    }
  },

  fetchProjects: async () => {
    const ws = get().activeWorkspace;
    if (!ws) return;
    set({ isLoadingProjects: true });
    try {
      const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/projects`, {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        const data = await safeParseJson(res);
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.projects)
          ? data.projects
          : [];
        set({ projects: list, isLoadingProjects: false });
      } else {
        set({ isLoadingProjects: false });
      }
    } catch (err) {
      console.error("fetchProjects error:", err);
      set({ isLoadingProjects: false });
    }
  },

  createProject: async (data) => {
    let ws = get().activeWorkspace;
    if (!ws) {
      await get().fetchWorkspaces();
      ws = get().activeWorkspace;
    }
    if (!ws) throw new Error("No active workspace");
    const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/projects`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await safeParseJson(res);
      throw new Error(err.error || "Failed to create project");
    }
    const dataRes = await safeParseJson(res);
    const created = dataRes?.project || dataRes;
    set((state) => ({ projects: [created, ...state.projects] }));
    get().fetchActivities();
    get().fetchAnalytics();
    return created;
  },

  updateProject: async (id, data) => {
    const res = await fetch(`${API_BASE}/api/projects/${id}`, {
      method: "PATCH",
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const dataRes = await safeParseJson(res);
      const updated = dataRes?.project || dataRes;
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updated : p)),
        activeProject: state.activeProject?.id === id ? updated : state.activeProject,
      }));
      get().fetchActivities();
    }
  },

  deleteProject: async (id) => {
    const res = await fetch(`${API_BASE}/api/projects/${id}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    if (res.ok) {
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        activeProject: state.activeProject?.id === id ? null : state.activeProject,
      }));
      get().fetchTasks();
      get().fetchActivities();
      get().fetchAnalytics();
    }
  },

  // Tasks
  tasks: [],
  activeTask: null,
  isLoadingTasks: false,
  taskFilterStatus: "ALL",
  taskFilterPriority: "ALL",
  taskFilterAssignee: "ALL",
  taskSearchQuery: "",
  setTaskFilterStatus: (s) => set({ taskFilterStatus: s }),
  setTaskFilterPriority: (p) => set({ taskFilterPriority: p }),
  setTaskFilterAssignee: (a) => set({ taskFilterAssignee: a }),
  setTaskSearchQuery: (q) => set({ taskSearchQuery: q }),
  setActiveTask: (task) => set({ activeTask: task }),

  fetchTasks: async (projectId) => {
    const ws = get().activeWorkspace;
    if (!ws) return;
    set({ isLoadingTasks: true });
    try {
      const url = projectId
        ? `${API_BASE}/api/workspaces/${ws.id}/tasks?project_id=${projectId}`
        : `${API_BASE}/api/workspaces/${ws.id}/tasks`;
      const res = await fetch(url, { headers: getAuthHeader() });
      if (res.ok) {
        const data = await safeParseJson(res);
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.tasks)
          ? data.tasks
          : [];
        set({ tasks: list, isLoadingTasks: false });
      } else {
        set({ isLoadingTasks: false });
      }
    } catch (err) {
      console.error("fetchTasks error:", err);
      set({ isLoadingTasks: false });
    }
  },

  createTask: async (data) => {
    let ws = get().activeWorkspace;
    if (!ws) {
      await get().fetchWorkspaces();
      ws = get().activeWorkspace;
    }
    if (!ws) {
      // Auto-provision a default workspace if user has none
      try {
        ws = await get().createWorkspace("Main Workspace", "Default collaboration workspace", "general");
      } catch (wsErr) {
        console.warn("Could not auto-create workspace:", wsErr);
      }
    }
    if (!ws) throw new Error("No active workspace found or could be created.");

    const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/tasks`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await safeParseJson(res);
      throw new Error(err.error || "Failed to create task");
    }
    const dataRes = await safeParseJson(res);
    const created = dataRes?.task || dataRes;
    set((state) => ({ tasks: [created, ...state.tasks] }));
    get().fetchActivities();
    get().fetchAnalytics();
    return created;
  },

  updateTask: async (id, data) => {
    const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
      method: "PATCH",
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const dataRes = await safeParseJson(res);
      const updated = dataRes?.task || dataRes;
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
        activeTask: state.activeTask?.id === id ? updated : state.activeTask,
      }));
      get().fetchActivities();
      get().fetchAnalytics();
    }
  },

  deleteTask: async (id) => {
    const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    if (res.ok) {
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        activeTask: state.activeTask?.id === id ? null : state.activeTask,
      }));
      get().fetchActivities();
      get().fetchAnalytics();
    }
  },

  moveTaskStatus: async (taskId, newStatus) => {
    // Optimistic UI update
    const prevTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus as any } : t
      ),
    }));

    try {
      const res = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: getAuthHeader(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        // Rollback on failure
        set({ tasks: prevTasks });
      } else {
        const dataRes = await safeParseJson(res);
        const updated = dataRes?.task || dataRes;
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === taskId ? updated : t)),
        }));
        get().fetchActivities();
        get().fetchAnalytics();
      }
    } catch (err) {
      set({ tasks: prevTasks });
      console.error("moveTaskStatus error:", err);
    }
  },

  addTaskComment: async (taskId, content) => {
    const res = await fetch(`${API_BASE}/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const err = await safeParseJson(res);
      throw new Error(err.error || "Failed to add comment");
    }
    const dataRes = await safeParseJson(res);
    const created = dataRes?.comment || dataRes;
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            comments: [...(t.comments || []), created],
          };
        }
        return t;
      }),
      activeTask:
        state.activeTask?.id === taskId
          ? {
              ...state.activeTask,
              comments: [...(state.activeTask.comments || []), created],
            }
          : state.activeTask,
    }));
    return created;
  },

  // Members & Departments
  members: [],
  departments: [],
  isLoadingMembers: false,

  fetchMembers: async () => {
    const ws = get().activeWorkspace;
    if (!ws) return;
    set({ isLoadingMembers: true });
    try {
      const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/members`, {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        const data = await safeParseJson(res);
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.members)
          ? data.members
          : [];
        set({ members: list, isLoadingMembers: false });
      } else {
        set({ isLoadingMembers: false });
      }
    } catch (err) {
      console.error("fetchMembers error:", err);
      set({ isLoadingMembers: false });
    }
  },

  fetchDepartments: async () => {
    const ws = get().activeWorkspace;
    if (!ws) return;
    try {
      const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/departments`, {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        const data = await safeParseJson(res);
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.departments)
          ? data.departments
          : [];
        set({ departments: list });
      }
    } catch (err) {
      console.error("fetchDepartments error:", err);
    }
  },

  addMember: async (userId, role, department) => {
    const ws = get().activeWorkspace;
    if (!ws) return;
    const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/members`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({ user_id: userId, role, department }),
    });
    if (!res.ok) {
      const err = await safeParseJson(res);
      throw new Error(err.error || "Failed to add member");
    }
    await get().fetchMembers();
    get().fetchActivities();
  },

  updateMemberRole: async (memberId, role, department) => {
    const ws = get().activeWorkspace;
    if (!ws) return;
    const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/members/${memberId}`, {
      method: "PATCH",
      headers: getAuthHeader(),
      body: JSON.stringify({ role, department }),
    });
    if (res.ok) {
      await get().fetchMembers();
    }
  },

  removeMember: async (memberId) => {
    const ws = get().activeWorkspace;
    if (!ws) return;
    const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/members/${memberId}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    if (res.ok) {
      set((state) => ({
        members: state.members.filter((m) => m.id !== memberId && m.user_id !== memberId),
      }));
      get().fetchActivities();
    }
  },

  suspendMember: async (userId, reason) => {
    const ws = get().activeWorkspace;
    if (!ws) return;
    const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/members/${userId}/suspend`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await safeParseJson(res);
      throw new Error(err.error || "Failed to suspend member");
    }
    await get().fetchMembers();
    get().fetchAuditLogs();
    get().fetchActivities();
  },

  restoreMember: async (userId) => {
    const ws = get().activeWorkspace;
    if (!ws) return;
    const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/members/${userId}/restore`, {
      method: "POST",
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      const err = await safeParseJson(res);
      throw new Error(err.error || "Failed to restore member");
    }
    await get().fetchMembers();
    get().fetchAuditLogs();
    get().fetchActivities();
  },

  removeMemberWithReason: async (userId, reason) => {
    const ws = get().activeWorkspace;
    if (!ws) return;
    const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/members/${userId}/remove`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await safeParseJson(res);
      throw new Error(err.error || "Failed to remove member");
    }
    await get().fetchMembers();
    get().fetchAuditLogs();
    get().fetchActivities();
  },

  bulkRemoveMembers: async (userIds, reason) => {
    const ws = get().activeWorkspace;
    if (!ws || userIds.length === 0) return;
    const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/members/bulk-remove`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({ user_ids: userIds, reason }),
    });
    if (!res.ok) {
      const err = await safeParseJson(res);
      throw new Error(err.error || "Failed to remove selected members");
    }
    await get().fetchMembers();
    get().fetchAuditLogs();
    get().fetchActivities();
  },

  bulkUpdateMemberRoles: async (userIds, role) => {
    const ws = get().activeWorkspace;
    if (!ws || userIds.length === 0) return;
    const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/members/bulk-role`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({ user_ids: userIds, role }),
    });
    if (!res.ok) {
      const err = await safeParseJson(res);
      throw new Error(err.error || "Failed to update member roles");
    }
    await get().fetchMembers();
    get().fetchAuditLogs();
  },

  transferOwnership: async (newOwnerId) => {
    const ws = get().activeWorkspace;
    if (!ws) return;
    const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/transfer-ownership`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({ new_owner_id: newOwnerId }),
    });
    if (!res.ok) {
      const err = await safeParseJson(res);
      throw new Error(err.error || "Failed to transfer ownership");
    }
    await get().fetchWorkspaces();
    await get().fetchMembers();
    get().fetchAuditLogs();
  },

  fetchMemberWorkload: async (userId) => {
    const ws = get().activeWorkspace;
    if (!ws) return null;
    const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/members/${userId}/work`, {
      headers: getAuthHeader(),
    });
    if (res.ok) {
      return await safeParseJson(res);
    }
    return null;
  },

  // Invitations
  invitations: [],
  isLoadingInvitations: false,

  fetchInvitations: async (status) => {
    const ws = get().activeWorkspace;
    if (!ws) return;
    set({ isLoadingInvitations: true });
    try {
      const url = status
        ? `${API_BASE}/api/workspaces/${ws.id}/invitations?status=${status}`
        : `${API_BASE}/api/workspaces/${ws.id}/invitations`;
      const res = await fetch(url, { headers: getAuthHeader() });
      if (res.ok) {
        const data = await safeParseJson(res);
        set({
          invitations: Array.isArray(data) ? data : data.invitations || [],
          isLoadingInvitations: false,
        });
      } else {
        set({ isLoadingInvitations: false });
      }
    } catch (err) {
      console.error("fetchInvitations error:", err);
      set({ isLoadingInvitations: false });
    }
  },

  createInviteLink: async (role = "MEMBER", expiresInDays = 7, targetEmailOrUser) => {
    const ws = get().activeWorkspace;
    if (!ws) throw new Error("No active workspace");
    const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/invitations`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({
        role,
        expiresInDays,
        targetEmailOrUser,
      }),
    });
    if (!res.ok) {
      const err = await safeParseJson(res);
      throw new Error(err.error || "Failed to create invitation");
    }
    const data = await safeParseJson(res);
    const invitation = data?.invitation || data;
    set((state) => ({
      invitations: [invitation, ...state.invitations],
    }));
    get().fetchAuditLogs();
    return invitation;
  },

  batchInvite: async (targets, role = "MEMBER") => {
    const ws = get().activeWorkspace;
    if (!ws) throw new Error("No active workspace");
    const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/invitations/batch`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({ targets, role }),
    });
    if (!res.ok) {
      const err = await safeParseJson(res);
      throw new Error(err.error || "Failed to send batch invitations");
    }
    const data = await safeParseJson(res);
    await get().fetchInvitations();
    get().fetchAuditLogs();
    return data;
  },

  revokeInvitation: async (invitationId) => {
    const ws = get().activeWorkspace;
    if (!ws) return;
    const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/invitations/${invitationId}/revoke`, {
      method: "POST",
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      const err = await safeParseJson(res);
      throw new Error(err.error || "Failed to revoke invitation");
    }
    set((state) => ({
      invitations: state.invitations.map((i) =>
        i.id === invitationId ? { ...i, status: "REVOKED" as const } : i
      ),
    }));
    get().fetchAuditLogs();
  },

  resendInvitation: async (invitationId) => {
    const ws = get().activeWorkspace;
    if (!ws) throw new Error("No active workspace");
    const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/invitations/${invitationId}/resend`, {
      method: "POST",
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      const err = await safeParseJson(res);
      throw new Error(err.error || "Failed to resend invitation");
    }
    const data = await safeParseJson(res);
    const renewed = data?.invitation || data;
    set((state) => ({
      invitations: state.invitations.map((i) => (i.id === invitationId ? renewed : i)),
    }));
    get().fetchAuditLogs();
    return renewed;
  },

  validateInviteCode: async (code) => {
    const res = await fetch(`${API_BASE}/api/workspaces/validate-invite/${encodeURIComponent(code)}`);
    const data = await safeParseJson(res);
    if (!res.ok) {
      throw new Error(data.error || "Invalid invitation code");
    }
    return data;
  },

  // Audit Logs
  auditLogs: [],
  isLoadingAuditLogs: false,

  fetchAuditLogs: async (action) => {
    const ws = get().activeWorkspace;
    if (!ws) return;
    set({ isLoadingAuditLogs: true });
    try {
      const url = action
        ? `${API_BASE}/api/workspaces/${ws.id}/audit-logs?action=${action}`
        : `${API_BASE}/api/workspaces/${ws.id}/audit-logs`;
      const res = await fetch(url, { headers: getAuthHeader() });
      if (res.ok) {
        const data = await safeParseJson(res);
        set({
          auditLogs: Array.isArray(data) ? data : data.logs || [],
          isLoadingAuditLogs: false,
        });
      } else {
        set({ isLoadingAuditLogs: false });
      }
    } catch (err) {
      console.error("fetchAuditLogs error:", err);
      set({ isLoadingAuditLogs: false });
    }
  },

  // Realtime Event Handler
  handleWorkspaceRealtimeEvent: (event, data) => {
    const activeWs = get().activeWorkspace;
    if (!activeWs || activeWs.id !== data?.workspace_id) return;

    console.log(`⚡ Real-time workspace event received: ${event}`, data);

    switch (event) {
      case "member_joined":
      case "member_removed":
      case "member_suspended":
      case "member_restored":
      case "role_changed":
        get().fetchMembers();
        get().fetchActivities();
        get().fetchAnalytics();
        get().fetchAuditLogs();
        break;

      case "ownership_transferred":
        get().fetchWorkspaces();
        get().fetchMembers();
        get().fetchAuditLogs();
        break;

      case "invitation_created":
      case "invitation_revoked":
      case "invitation_accepted":
        get().fetchInvitations();
        get().fetchAuditLogs();
        break;

      default:
        break;
    }
  },


  // Announcements
  announcements: [],
  isLoadingAnnouncements: false,

  fetchAnnouncements: async () => {
    const ws = get().activeWorkspace;
    if (!ws) return;
    set({ isLoadingAnnouncements: true });
    try {
      const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/announcements`, {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        const data = await safeParseJson(res);
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.announcements)
          ? data.announcements
          : [];
        set({ announcements: list, isLoadingAnnouncements: false });
      } else {
        set({ isLoadingAnnouncements: false });
      }
    } catch (err) {
      console.error("fetchAnnouncements error:", err);
      set({ isLoadingAnnouncements: false });
    }
  },

  createAnnouncement: async (title, content, priority) => {
    let ws = get().activeWorkspace;
    if (!ws) {
      await get().fetchWorkspaces();
      ws = get().activeWorkspace;
    }
    if (!ws) throw new Error("No active workspace");
    const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/announcements`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({ title, content, priority }),
    });
    if (!res.ok) {
      const err = await safeParseJson(res);
      throw new Error(err.error || "Failed to create announcement");
    }
    const dataRes = await safeParseJson(res);
    const created = dataRes?.announcement || dataRes;
    set((state) => ({ announcements: [created, ...state.announcements] }));
    get().fetchActivities();
    return created;
  },

  // Activities
  activities: [],
  isLoadingActivities: false,

  fetchActivities: async () => {
    const ws = get().activeWorkspace;
    if (!ws) return;
    set({ isLoadingActivities: true });
    try {
      const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/activities`, {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        const data = await safeParseJson(res);
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.activities)
          ? data.activities
          : [];
        set({ activities: list, isLoadingActivities: false });
      } else {
        set({ isLoadingActivities: false });
      }
    } catch (err) {
      console.error("fetchActivities error:", err);
      set({ isLoadingActivities: false });
    }
  },

  // Meetings
  meetings: [],
  isLoadingMeetings: false,

  fetchMeetings: async () => {
    const ws = get().activeWorkspace;
    if (!ws) return;
    set({ isLoadingMeetings: true });
    try {
      const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/meetings`, {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        const data = await safeParseJson(res);
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.meetings)
          ? data.meetings
          : [];
        set({ meetings: list, isLoadingMeetings: false });
      } else {
        set({ isLoadingMeetings: false });
      }
    } catch (err) {
      console.error("fetchMeetings error:", err);
      set({ isLoadingMeetings: false });
    }
  },

  createMeeting: async (data) => {
    let ws = get().activeWorkspace;
    if (!ws) {
      await get().fetchWorkspaces();
      ws = get().activeWorkspace;
    }
    if (!ws) throw new Error("No active workspace");
    const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/meetings`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await safeParseJson(res);
      throw new Error(err.error || "Failed to create meeting");
    }
    const dataRes = await safeParseJson(res);
    const created = dataRes?.meeting || dataRes;
    set((state) => ({ meetings: [...state.meetings, created] }));
    get().fetchActivities();
    return created;
  },

  deleteMeeting: async (id) => {
    const res = await fetch(`${API_BASE}/api/meetings/${id}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    if (res.ok) {
      set((state) => ({
        meetings: state.meetings.filter((m) => m.id !== id),
      }));
    }
  },

  // Notes
  notes: [],
  isLoadingNotes: false,

  fetchNotes: async () => {
    const ws = get().activeWorkspace;
    if (!ws) return;
    set({ isLoadingNotes: true });
    try {
      const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/notes`, {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        const data = await safeParseJson(res);
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.notes)
          ? data.notes
          : [];
        set({ notes: list, isLoadingNotes: false });
      } else {
        set({ isLoadingNotes: false });
      }
    } catch (err) {
      console.error("fetchNotes error:", err);
      set({ isLoadingNotes: false });
    }
  },

  createNote: async (title, content, isPinned) => {
    let ws = get().activeWorkspace;
    if (!ws) {
      await get().fetchWorkspaces();
      ws = get().activeWorkspace;
    }
    if (!ws) throw new Error("No active workspace");
    const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/notes`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({ title, content, is_pinned: isPinned }),
    });
    if (!res.ok) {
      const err = await safeParseJson(res);
      throw new Error(err.error || "Failed to create note");
    }
    const dataRes = await safeParseJson(res);
    const created = dataRes?.note || dataRes;
    set((state) => ({ notes: [created, ...state.notes] }));
    return created;
  },

  updateNote: async (id, data) => {
    const res = await fetch(`${API_BASE}/api/notes/${id}`, {
      method: "PATCH",
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const dataRes = await safeParseJson(res);
      const updated = dataRes?.note || dataRes;
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? updated : n)),
      }));
    }
  },

  deleteNote: async (id) => {
    const res = await fetch(`${API_BASE}/api/notes/${id}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    if (res.ok) {
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
      }));
    }
  },

  // Files
  files: [],
  isLoadingFiles: false,

  fetchFiles: async () => {
    const ws = get().activeWorkspace;
    if (!ws) return;
    set({ isLoadingFiles: true });
    try {
      const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/files`, {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        const data = await safeParseJson(res);
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.files)
          ? data.files
          : [];
        set({ files: list, isLoadingFiles: false });
      } else {
        set({ isLoadingFiles: false });
      }
    } catch (err) {
      console.error("fetchFiles error:", err);
      set({ isLoadingFiles: false });
    }
  },

  createFileEntry: async (name, fileType, sizeBytes, url, projectId) => {
    let ws = get().activeWorkspace;
    if (!ws) {
      await get().fetchWorkspaces();
      ws = get().activeWorkspace;
    }
    if (!ws) throw new Error("No active workspace");
    const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/files`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({
        name,
        file_type: fileType,
        size_bytes: sizeBytes,
        url,
        project_id: projectId,
      }),
    });
    if (!res.ok) {
      const err = await safeParseJson(res);
      throw new Error(err.error || "Failed to record file");
    }
    const dataRes = await safeParseJson(res);
    const created = dataRes?.file || dataRes;
    set((state) => ({ files: [created, ...state.files] }));
    get().fetchActivities();
    return created;
  },

  // Notifications
  notifications: [],

  fetchNotifications: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        const data = await safeParseJson(res);
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.notifications)
          ? data.notifications
          : [];
        set({ notifications: list });
      }
    } catch (err) {
      console.error("fetchNotifications error:", err);
    }
  },

  markNotificationRead: async (id) => {
    await fetch(`${API_BASE}/api/notifications/${id}/read`, {
      method: "PATCH",
      headers: getAuthHeader(),
    });
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
    }));
  },

  markAllNotificationsRead: async () => {
    await fetch(`${API_BASE}/api/notifications/mark-all-read`, {
      method: "POST",
      headers: getAuthHeader(),
    });
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
    }));
  },

  // Saved Items
  savedItems: [],

  fetchSavedItems: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/saved-items`, {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        const data = await safeParseJson(res);
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.saved_items)
          ? data.saved_items
          : [];
        set({ savedItems: list });
      }
    } catch (err) {
      console.error("fetchSavedItems error:", err);
    }
  },

  toggleSavedItem: async (itemType, itemId, title, details) => {
    const existing = get().savedItems.find(
      (si) => si.item_id === itemId && si.item_type === itemType
    );
    if (existing) {
      await fetch(`${API_BASE}/api/saved-items/${existing.id}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });
      set((state) => ({
        savedItems: state.savedItems.filter((si) => si.id !== existing.id),
      }));
    } else {
      const res = await fetch(`${API_BASE}/api/saved-items`, {
        method: "POST",
        headers: getAuthHeader(),
        body: JSON.stringify({
          item_type: itemType,
          item_id: itemId,
          title,
          details,
        }),
      });
      if (res.ok) {
        const dataRes = await safeParseJson(res);
        const created = dataRes?.saved_item || dataRes;
        set((state) => ({ savedItems: [created, ...state.savedItems] }));
      }
    }
  },

  // Analytics
  analytics: null,

  fetchAnalytics: async () => {
    const ws = get().activeWorkspace;
    if (!ws) return;
    try {
      const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/analytics`, {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        const data = await safeParseJson(res);
        set({ analytics: data?.analytics || data });
      }
    } catch (err) {
      console.error("fetchAnalytics error:", err);
    }
  },

  // Modals
  isTaskModalOpen: false,
  setIsTaskModalOpen: (open) => set({ isTaskModalOpen: open }),
  taskModalPrefill: null,
  setTaskModalPrefill: (prefill) => set({ taskModalPrefill: prefill }),

  isProjectModalOpen: false,
  setIsProjectModalOpen: (open) => set({ isProjectModalOpen: open }),

  isMeetingModalOpen: false,
  setIsMeetingModalOpen: (open) => set({ isMeetingModalOpen: open }),

  isAnnouncementModalOpen: false,
  setIsAnnouncementModalOpen: (open) => set({ isAnnouncementModalOpen: open }),

  isWorkspaceModalOpen: false,
  setIsWorkspaceModalOpen: (open) => set({ isWorkspaceModalOpen: open }),
}));
