import React from "react";
import { useChatStore } from "../store/chatStore.ts";
import {
  Home,
  MessageSquare,
  Users,
  UserCheck,
  Inbox,
  Bell,
  Settings,
  Shield,
  Crown,
  LayoutDashboard,
  Kanban,
  Folder,
  Calendar,
  Users2,
} from "lucide-react";

export type NavItem =
  | "home"
  | "workspace"
  | "kanban"
  | "projects"
  | "chats"
  | "groups"
  | "calendar"
  | "team"
  | "contacts"
  | "requests"
  | "notifications"
  | "admin"
  | "settings";

interface LeftNavRailProps {
  activeItem: NavItem;
  onSelect: (item: NavItem) => void;
  onOpenAdmin: () => void;
  onOpenSettings: () => void;
}

export default function LeftNavRail({
  activeItem,
  onSelect,
  onOpenAdmin,
  onOpenSettings,
}: LeftNavRailProps) {
  const { user, conversations } = useChatStore();

  const pendingRequests = conversations.filter((c) => c.is_accepted === false && !c.is_blocked).length;
  const unreadChats = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  const navItems = [
    { id: "workspace" as NavItem, label: "Workspace HQ", icon: LayoutDashboard },
    { id: "kanban" as NavItem, label: "Kanban Board", icon: Kanban },
    { id: "projects" as NavItem, label: "Projects", icon: Folder },
    { id: "chats" as NavItem, label: "Chats & Channels", icon: MessageSquare, badge: unreadChats },
    { id: "calendar" as NavItem, label: "Calendar & Meetings", icon: Calendar },
    { id: "team" as NavItem, label: "Team Directory", icon: Users2 },
    { id: "requests" as NavItem, label: "Requests", icon: Inbox, badge: pendingRequests, badgeColor: "bg-amber-500" },
    { id: "notifications" as NavItem, label: "Notifications", icon: Bell, badge: pendingRequests + unreadChats },
  ];

  return (
    <aside className="hidden sm:flex w-16 border-r border-slate-800 bg-slate-950 flex-col items-center py-3 justify-between z-20 shrink-0 select-none">
      {/* Top primary navigations */}
      <div className="w-full flex flex-col items-center space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              title={item.label}
              className={`btn-interactive relative w-11 h-11 rounded-xl flex items-center justify-center transition group cursor-pointer ${
                isActive
                  ? "bg-brand-600/20 text-brand-400 border border-brand-500/30 shadow-lg shadow-brand-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              {/* Active accent vertical line indicator */}
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-brand-500 shadow-sm shadow-brand-500" />
              )}
              <Icon className="h-5 w-5" />

              {/* Badge counter */}
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[9px] font-bold text-white ${
                    item.badgeColor || "bg-brand-500"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom controls */}
      <div className="w-full flex flex-col items-center space-y-1.5 pt-3 border-t border-slate-800/80">
        {user?.role === "admin" && (
          <button
            onClick={onOpenAdmin}
            title="Governance Admin Console"
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition cursor-pointer ${
              activeItem === "admin"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "text-amber-400/80 hover:text-amber-300 hover:bg-slate-900"
            }`}
          >
            <Crown className="h-5 w-5" />
          </button>
        )}

        <button
          onClick={onOpenSettings}
          title="Account Settings"
          className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition cursor-pointer"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
}
