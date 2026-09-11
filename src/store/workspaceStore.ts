import { create } from "zustand";
import {
  Workspace,
  WorkspaceMember,
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
      set({ workspaces: data, isLoadingWorkspaces: false });
      
      // If no active workspace is selected, select first one
      const currentActive = get().activeWorkspace;
      if (!currentActive && data.length > 0) {
        get().setActiveWorkspace(data[0]);
      } else if (currentActive) {
        const found = data.find((w: Workspace) => w.id === currentActive.id);
        if (found) set({ activeWorkspace: found });
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
    const created = await safeParseJson(res);
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
    const joined = await safeParseJson(res);
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
        set({ projects: data, isLoadingProjects: false });
      } else {
        set({ isLoadingProjects: false });
      }
    } catch (err) {
      console.error("fetchProjects error:", err);
      set({ isLoadingProjects: false });
    }
  },

  createProject: async (data) => {
    const ws = get().activeWorkspace;
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
    const created = await safeParseJson(res);
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
      const updated = await safeParseJson(res);
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
        set({ tasks: data, isLoadingTasks: false });
      } else {
        set({ isLoadingTasks: false });
      }
    } catch (err) {
      console.error("fetchTasks error:", err);
      set({ isLoadingTasks: false });
    }
  },

  createTask: async (data) => {
    const ws = get().activeWorkspace;
    if (!ws) throw new Error("No active workspace");
    const res = await fetch(`${API_BASE}/api/workspaces/${ws.id}/tasks`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await safeParseJson(res);
      throw new Error(err.error || "Failed to create task");
    }
    const created = await safeParseJson(res);
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
      const updated = await safeParseJson(res);
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
      const res = await fetch(`${API_BASE}/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: getAuthHeader(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        // Rollback on failure
        set({ tasks: prevTasks });
      } else {
        const updated = await safeParseJson(res);
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
    const created = await safeParseJson(res);
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
        set({ members: data, isLoadingMembers: false });
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
        set({ departments: data });
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
    const res = await fetch(`${API_BASE}/api/workspace-members/${memberId}`, {
      method: "PATCH",
      headers: getAuthHeader(),
      body: JSON.stringify({ role, department }),
    });
    if (res.ok) {
      await get().fetchMembers();
    }
  },

  removeMember: async (memberId) => {
    const res = await fetch(`${API_BASE}/api/workspace-members/${memberId}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    if (res.ok) {
      set((state) => ({
        members: state.members.filter((m) => m.id !== memberId),
      }));
      get().fetchActivities();
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
        set({ announcements: data, isLoadingAnnouncements: false });
      } else {
        set({ isLoadingAnnouncements: false });
      }
    } catch (err) {
      console.error("fetchAnnouncements error:", err);
      set({ isLoadingAnnouncements: false });
    }
  },

  createAnnouncement: async (title, content, priority) => {
    const ws = get().activeWorkspace;
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
    const created = await safeParseJson(res);
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
        set({ activities: data, isLoadingActivities: false });
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
        set({ meetings: data, isLoadingMeetings: false });
      } else {
        set({ isLoadingMeetings: false });
      }
    } catch (err) {
      console.error("fetchMeetings error:", err);
      set({ isLoadingMeetings: false });
    }
  },

  createMeeting: async (data) => {
    const ws = get().activeWorkspace;
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
    const created = await safeParseJson(res);
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
        set({ notes: data, isLoadingNotes: false });
      } else {
        set({ isLoadingNotes: false });
      }
    } catch (err) {
      console.error("fetchNotes error:", err);
      set({ isLoadingNotes: false });
    }
  },

  createNote: async (title, content, isPinned) => {
    const ws = get().activeWorkspace;
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
    const created = await safeParseJson(res);
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
      const updated = await safeParseJson(res);
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
        set({ files: data, isLoadingFiles: false });
      } else {
        set({ isLoadingFiles: false });
      }
    } catch (err) {
      console.error("fetchFiles error:", err);
      set({ isLoadingFiles: false });
    }
  },

  createFileEntry: async (name, fileType, sizeBytes, url, projectId) => {
    const ws = get().activeWorkspace;
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
    const created = await safeParseJson(res);
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
        set({ notifications: data });
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
        set({ savedItems: data });
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
        const created = await safeParseJson(res);
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
        set({ analytics: data });
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
