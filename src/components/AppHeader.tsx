import React, { useState } from "react";
import { useChatStore } from "../store/chatStore.ts";
import { useWorkspaceStore } from "../store/workspaceStore.ts";
import {
  MessageSquare,
  Search,
  Bell,
  Settings,
  Crown,
  LogOut,
  Globe,
  Keyboard,
  Menu,
  Plus,
  CheckSquare,
  Folder,
  Calendar,
  Megaphone,
  ChevronDown,
  Sparkles,
  ChevronRight,
} from "lucide-react";

interface AppHeaderProps {
  onOpenSettings: () => void;
  onOpenAdmin: () => void;
  onOpenNotifications: () => void;
  onGoToLanding: () => void;
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
  onToggleMobileSidebar?: () => void;
  onOpenTour?: () => void;
}

export default function AppHeader({
  onOpenSettings,
  onOpenAdmin,
  onOpenNotifications,
  onGoToLanding,
  onOpenCommandPalette,
  onOpenShortcuts,
  onToggleMobileSidebar,
  onOpenTour,
}: AppHeaderProps) {
  const { user, logout, connectionStatus, conversations } = useChatStore();
  const {
    activeWorkspace,
    activeTab,
    setIsTaskModalOpen,
    setIsProjectModalOpen,
    setIsMeetingModalOpen,
    setIsAnnouncementModalOpen,
  } = useWorkspaceStore();

  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  // Compute total unread count & pending requests
  const pendingRequests = conversations.filter((c) => c.is_accepted === false && !c.is_blocked).length;
  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0) + pendingRequests;

  const tabLabels: Record<string, string> = {
    dashboard: "Dashboard Overview",
    chats: "Inbox & Chats",
    "my-work": "My Work",
    kanban: "Kanban Sprint Board",
    projects: "Projects & Roadmaps",
    calendar: "Calendar & Video Syncs",
    team: "Team Directory",
    files: "Files & Repository",
    announcements: "Announcements",
    analytics: "Delivery Analytics",
  };

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-slate-850 bg-slate-950/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between shrink-0 select-none transition-shadow">
      {/* Left: Mobile Drawer Trigger + Breadcrumb */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="sm:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition cursor-pointer"
            title="Toggle Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <button
          onClick={onGoToLanding}
          title="Return to Public Site"
          className="flex items-center space-x-2 group cursor-pointer text-left shrink-0"
        >
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 p-0.5 shadow-sm shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <div className="h-full w-full bg-slate-950 rounded-[6px] flex items-center justify-center">
              <MessageSquare className="h-3.5 w-3.5 text-brand-400" />
            </div>
          </div>
          <span className="font-display font-bold text-sm tracking-tight text-white hidden md:inline">
            BlinkTalks
          </span>
        </button>

        {/* Breadcrumb path */}
        <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-400 pl-2 border-l border-slate-800">
          <span className="font-medium text-slate-300 truncate max-w-[120px]">
            {activeWorkspace?.name || "Workspace"}
          </span>
          <ChevronRight className="h-3 w-3 text-slate-600 shrink-0" />
          <span className="text-brand-300 font-semibold truncate">
            {tabLabels[activeTab] || "Overview"}
          </span>
        </div>

        {/* Connection status indicator */}
        <div
          title={`Gateway: ${connectionStatus}`}
          className="hidden xl:flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400"
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              connectionStatus === "connected"
                ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                : connectionStatus === "reconnecting"
                ? "bg-amber-400 animate-ping"
                : "bg-rose-500"
            }`}
          />
          <span className="capitalize">{connectionStatus}</span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-sm mx-3 hidden sm:block">
        <div
          onClick={onOpenCommandPalette}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/90 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-300 transition cursor-pointer group"
        >
          <Search className="h-3.5 w-3.5 text-slate-500 group-hover:text-brand-400 transition" />
          <span className="flex-1 truncate">Search tasks, channels, files...</span>
          <kbd className="hidden md:inline-flex items-center space-x-0.5 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-400 font-mono">
            <span>⌘</span>
            <span>K</span>
          </kbd>
        </div>
      </div>

      {/* Right: + Create Button, Notifications, Tour, User */}
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        {/* + Quick Create Dropdown */}
        <div className="relative">
          <button
            onClick={() => setCreateMenuOpen((prev) => !prev)}
            className="btn-interactive flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm shadow-brand-500/20 transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Create</span>
            <ChevronDown className="h-3 w-3 opacity-75" />
          </button>

          {createMenuOpen && (
            <div className="absolute right-0 top-11 z-50 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 space-y-0.5 animate-scale-up text-xs">
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  setIsTaskModalOpen(true);
                }}
                className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition cursor-pointer text-left"
              >
                <CheckSquare className="h-4 w-4 text-brand-400" />
                <span>New Task</span>
              </button>
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  setIsProjectModalOpen(true);
                }}
                className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition cursor-pointer text-left"
              >
                <Folder className="h-4 w-4 text-emerald-400" />
                <span>New Project</span>
              </button>
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  setIsMeetingModalOpen(true);
                }}
                className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition cursor-pointer text-left"
              >
                <Calendar className="h-4 w-4 text-purple-400" />
                <span>Schedule Sync</span>
              </button>
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  setIsAnnouncementModalOpen(true);
                }}
                className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition cursor-pointer text-left"
              >
                <Megaphone className="h-4 w-4 text-amber-400" />
                <span>Announcement</span>
              </button>
            </div>
          )}
        </div>

        {/* Tour launcher */}
        {onOpenTour && (
          <button
            onClick={onOpenTour}
            className="btn-interactive hidden md:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-amber-300 text-xs font-medium transition cursor-pointer"
            title="Workspace Onboarding Tour"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Tour</span>
          </button>
        )}

        {/* Public Website */}
        <button
          onClick={onGoToLanding}
          className="btn-interactive hidden lg:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white text-xs font-medium transition cursor-pointer"
          title="Browse Public Site"
        >
          <Globe className="h-3.5 w-3.5" />
          <span>Site</span>
        </button>

        {/* Keyboard Shortcuts */}
        <button
          onClick={onOpenShortcuts}
          className="btn-interactive hidden sm:flex p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition cursor-pointer"
          title="Keyboard Shortcuts (?)"
        >
          <Keyboard className="h-4 w-4" />
        </button>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="btn-interactive relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition cursor-pointer"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {totalUnread > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-brand-500 text-[9px] font-bold text-white animate-pulse">
              {totalUnread}
            </span>
          )}
        </button>

        {/* Admin Console (if admin) */}
        {user?.role === "admin" && (
          <button
            onClick={onOpenAdmin}
            className="btn-interactive flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold transition cursor-pointer"
            title="Open Admin Console"
          >
            <Crown className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Admin</span>
          </button>
        )}

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="btn-interactive p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition cursor-pointer"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>

        {/* User Mini Profile */}
        <div className="flex items-center space-x-2 pl-1.5 border-l border-slate-850">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            {user?.display_name?.charAt(0).toUpperCase() || "U"}
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition cursor-pointer"
            title="Log Out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
