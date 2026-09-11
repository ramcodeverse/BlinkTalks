import React, { useState, useEffect } from "react";
import { useChatStore } from "../store/chatStore.ts";
import { useWorkspaceStore, WorkspaceTab } from "../store/workspaceStore.ts";
import {
  LayoutDashboard,
  MessageSquare,
  Hash,
  CheckSquare,
  Folder,
  Calendar,
  Users2,
  FileText,
  Megaphone,
  BarChart3,
  Kanban,
  Building,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Crown,
  ChevronDown,
  Plus,
  Circle,
  X,
} from "lucide-react";

export type NavItem =
  | "workspace"
  | "chats"
  | "channels"
  | "my-work"
  | "kanban"
  | "projects"
  | "calendar"
  | "team"
  | "files"
  | "announcements"
  | "analytics"
  | "admin"
  | "settings";

interface MainSidebarProps {
  activeItem: NavItem;
  onSelect: (item: NavItem) => void;
  onOpenAdmin: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenWorkspaceModal: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function MainSidebar({
  activeItem,
  onSelect,
  onOpenAdmin,
  onOpenSettings,
  onOpenHelp,
  onOpenWorkspaceModal,
  isMobileOpen = false,
  onCloseMobile,
}: MainSidebarProps) {
  const { user, conversations, logout } = useChatStore();
  const { activeWorkspace, tasks, setActiveTab } = useWorkspaceStore();
  const [userStatus, setUserStatus] = useState<"online" | "away" | "busy" | "offline">("online");

  // Collapsed state persisted in localStorage
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("blinktalks_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [wsMenuOpen, setWsMenuOpen] = useState(false);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("blinktalks_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  // Badge counts
  const unreadChats = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);
  const myPendingTasks = tasks.filter(
    (t) => (!t.assignee_id || t.assignee_id === user?.id) && t.status !== "COMPLETED"
  ).length;

  const NAV_ITEMS = [
    { id: "workspace" as NavItem, label: "Dashboard", icon: LayoutDashboard, wsTab: "dashboard" as WorkspaceTab },
    { id: "chats" as NavItem, label: "Inbox & Chats", icon: MessageSquare, badge: unreadChats },
    { id: "channels" as NavItem, label: "Channels", icon: Hash },
    { id: "my-work" as NavItem, label: "My Work", icon: CheckSquare, badge: myPendingTasks, wsTab: "my-work" as WorkspaceTab },
    { id: "kanban" as NavItem, label: "Kanban Board", icon: Kanban, wsTab: "kanban" as WorkspaceTab },
    { id: "projects" as NavItem, label: "Projects", icon: Folder, wsTab: "projects" as WorkspaceTab },
    { id: "calendar" as NavItem, label: "Calendar", icon: Calendar, wsTab: "calendar" as WorkspaceTab },
    { id: "team" as NavItem, label: "Team", icon: Users2, wsTab: "team" as WorkspaceTab },
    { id: "files" as NavItem, label: "Files", icon: FileText, wsTab: "files" as WorkspaceTab },
    { id: "announcements" as NavItem, label: "Announcements", icon: Megaphone, wsTab: "announcements" as WorkspaceTab },
    { id: "analytics" as NavItem, label: "Analytics", icon: BarChart3, wsTab: "analytics" as WorkspaceTab },
  ];

  const handleItemClick = (item: typeof NAV_ITEMS[0]) => {
    onSelect(item.id);
    if (item.wsTab) {
      setActiveTab(item.wsTab);
    }
    if (onCloseMobile) onCloseMobile();
  };

  // User status indicators
  const currentPresence = userStatus;
  const presenceColors: Record<string, string> = {
    online: "bg-emerald-400",
    away: "bg-amber-400",
    busy: "bg-rose-500",
    offline: "bg-slate-500",
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 sm:hidden transition-opacity duration-200"
        />
      )}

      {/* Main Sidebar Shell */}
      <aside
        id="main-workspace-sidebar"
        className={`fixed sm:static top-0 bottom-0 left-0 z-40 flex flex-col justify-between bg-slate-950 border-r border-slate-850 select-none transition-[width] duration-200 ease-out shrink-0 overflow-hidden ${
          isMobileOpen
            ? "translate-x-0 w-64 shadow-2xl"
            : "-translate-x-full sm:translate-x-0"
        } ${isCollapsed ? "sm:w-[68px]" : "sm:w-60"}`}
      >
        {/* Top: Workspace Switcher Header */}
        <div className="p-3 border-b border-slate-850 shrink-0">
          <div className="relative">
            <button
              onClick={() => {
                if (isCollapsed) {
                  setIsCollapsed(false);
                }
                setWsMenuOpen((prev) => !prev);
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 text-slate-200 transition group cursor-pointer"
              title={activeWorkspace?.name || "BlinkTalks Workspace"}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                  {activeWorkspace?.name?.charAt(0) || "B"}
                </div>
                {!isCollapsed && (
                  <div className="text-left truncate">
                    <p className="text-xs font-bold text-white truncate leading-tight">
                      {activeWorkspace?.name || "BlinkTalks HQ"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {user?.role === "admin" ? "Enterprise Admin" : "Team Member"}
                    </p>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <ChevronDown className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 transition" />
              )}
            </button>

            {/* Workspace Switcher Popover */}
            {wsMenuOpen && (
              <div className="absolute top-12 left-0 right-0 z-50 p-2 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl space-y-1 animate-scale-up text-xs">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Workspace
                </div>
                <button
                  onClick={() => {
                    setWsMenuOpen(false);
                    onOpenWorkspaceModal();
                  }}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition cursor-pointer text-left"
                >
                  <Building className="h-3.5 w-3.5 text-brand-400" />
                  <span>Switch / Join Workspace</span>
                </button>
                <button
                  onClick={() => {
                    setWsMenuOpen(false);
                    onOpenWorkspaceModal();
                  }}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition cursor-pointer text-left"
                >
                  <Plus className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Create Workspace</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Middle: Navigation Items List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeItem === item.id ||
              (item.wsTab && activeItem === "workspace" && useWorkspaceStore.getState().activeTab === item.wsTab);

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                title={isCollapsed ? item.label : undefined}
                className={`btn-interactive w-full flex items-center rounded-xl transition group cursor-pointer relative ${
                  isCollapsed ? "justify-center p-2.5" : "px-3 py-2 space-x-3"
                } ${
                  isActive
                    ? "bg-brand-600/20 text-brand-300 border border-brand-500/30 font-semibold"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/80"
                }`}
              >
                {/* Active Indicator line */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-brand-500 shadow-sm shadow-brand-500" />
                )}

                <Icon className="h-4 w-4 shrink-0" />

                {!isCollapsed && (
                  <span className="flex-1 text-left text-xs truncate">
                    {item.label}
                  </span>
                )}

                {/* Badge counter */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`flex items-center justify-center rounded-full text-[10px] font-bold text-white bg-brand-500 ${
                      isCollapsed
                        ? "absolute -top-1 -right-1 h-4 w-4"
                        : "px-1.5 py-0.2 min-w-4.5"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Controls: Help, Settings, Profile, Collapse Toggle */}
        <div className="p-2 border-t border-slate-850 space-y-1 shrink-0">
          {/* Admin link if user is admin */}
          {user?.role === "admin" && (
            <button
              onClick={onOpenAdmin}
              title={isCollapsed ? "Governance Admin" : undefined}
              className={`w-full flex items-center rounded-xl text-amber-400 hover:text-amber-300 hover:bg-slate-900 transition cursor-pointer ${
                isCollapsed ? "justify-center p-2.5" : "px-3 py-2 space-x-3 text-xs"
              }`}
            >
              <Crown className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="font-semibold">Admin Console</span>}
            </button>
          )}

          {/* Help & Shortcuts */}
          <button
            onClick={onOpenHelp}
            title={isCollapsed ? "Help & Shortcuts (?)" : undefined}
            className={`w-full flex items-center rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition cursor-pointer ${
              isCollapsed ? "justify-center p-2.5" : "px-3 py-2 space-x-3 text-xs"
            }`}
          >
            <HelpCircle className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Help & Shortcuts</span>}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            title={isCollapsed ? "Settings" : undefined}
            className={`w-full flex items-center rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition cursor-pointer ${
              isCollapsed ? "justify-center p-2.5" : "px-3 py-2 space-x-3 text-xs"
            }`}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </button>

          {/* User Profile Card with Presence Selector */}
          <div className="relative pt-1">
            <button
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className={`w-full flex items-center rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 p-2 transition cursor-pointer group ${
                isCollapsed ? "justify-center" : "space-x-2.5 justify-between"
              }`}
              title={user?.display_name || "Profile"}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="relative shrink-0">
                  <div className="h-7 w-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                    {user?.display_name?.charAt(0) || "U"}
                  </div>
                  {/* Status Indicator with subtle one-time animation on change */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950 ${
                      presenceColors[currentPresence] || "bg-emerald-400"
                    } animate-pulse-once`}
                  />
                </div>

                {!isCollapsed && (
                  <div className="text-left truncate">
                    <p className="text-xs font-semibold text-slate-200 truncate leading-tight">
                      {user?.display_name || "User"}
                    </p>
                    <p className="text-[10px] text-slate-400 capitalize">
                      {currentPresence}
                    </p>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <ChevronDown className="h-3 w-3 text-slate-500 group-hover:text-slate-300 shrink-0" />
              )}
            </button>

            {/* User Presence & Signout Menu */}
            {userMenuOpen && (
              <div className="absolute bottom-12 left-0 right-0 z-50 p-2 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl space-y-1 animate-scale-up text-xs">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Set Presence Status
                </div>
                {(["online", "away", "busy", "offline"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setUserStatus(st);
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer capitalize text-left"
                  >
                    <span className={`h-2 w-2 rounded-full ${presenceColors[st]}`} />
                    <span>{st}</span>
                  </button>
                ))}

                <div className="pt-1 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition cursor-pointer text-left"
                  >
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Expand Button */}
          <div className="hidden sm:flex justify-end pt-1">
            <button
              onClick={toggleCollapsed}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition cursor-pointer"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
