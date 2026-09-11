import React from "react";
import { useWorkspaceStore, WorkspaceTab } from "../../store/workspaceStore.ts";
import {
  LayoutDashboard,
  CheckSquare,
  Kanban,
  Folder,
  Calendar,
  Users2,
  Megaphone,
  FileText,
  BarChart3,
  Plus,
  Building,
  ChevronDown,
  MessageSquare,
} from "lucide-react";

interface WorkspaceHeaderProps {
  onOpenWorkspaceModal: () => void;
  onSwitchToChats?: () => void;
}

export default function WorkspaceHeader({
  onOpenWorkspaceModal,
  onSwitchToChats,
}: WorkspaceHeaderProps) {
  const {
    activeWorkspace,
    activeTab,
    setActiveTab,
    setIsTaskModalOpen,
  } = useWorkspaceStore();

  const TABS: { id: WorkspaceTab; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "my-work", label: "My Work", icon: CheckSquare },
    { id: "kanban", label: "Kanban Board", icon: Kanban },
    { id: "projects", label: "Projects", icon: Folder },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "team", label: "Team", icon: Users2 },
    { id: "files", label: "Files", icon: FileText },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "notes", label: "Docs & Notes", icon: FileText },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 select-none">
      {/* Left: Workspace switcher & Tab pills */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Workspace Dropdown Button */}
        <button
          onClick={onOpenWorkspaceModal}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 transition cursor-pointer"
        >
          <Building className="h-4 w-4 text-brand-400" />
          <span className="text-xs font-bold truncate max-w-[160px]">
            {activeWorkspace?.name || "Acme Innovations HQ"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </button>

        <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

        {/* Tab Switcher Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-brand-600 text-white shadow-sm shadow-brand-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Quick actions */}
      <div className="flex items-center space-x-2.5">
        {onSwitchToChats && (
          <button
            onClick={onSwitchToChats}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
          >
            <MessageSquare className="h-3.5 w-3.5 text-brand-400" />
            <span>Chat Hub</span>
          </button>
        )}

        <button
          onClick={() => setIsTaskModalOpen(true)}
          className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-brand-500/20 transition cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
}
