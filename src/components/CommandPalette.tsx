import React, { useState, useEffect, useRef } from "react";
import { useChatStore } from "../store/chatStore.ts";
import { useWorkspaceStore } from "../store/workspaceStore.ts";
import {
  Search,
  MessageSquare,
  Users,
  UserCheck,
  Plus,
  ArrowRight,
  Settings,
  Bell,
  Globe,
  Keyboard,
  Shield,
  X,
  FileText,
  Kanban,
  Folder,
  Calendar,
  Users2,
  LayoutDashboard,
  CheckSquare,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenAdmin: () => void;
  onOpenNotifications: () => void;
  onOpenShortcuts: () => void;
  onGoToLanding: () => void;
  onSelectNav?: (item: any) => void;
}

interface PaletteItem {
  id: string;
  category: "Action" | "Channel" | "Direct Chat" | "Contact" | "Message" | "Task" | "Project";
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onOpenSettings,
  onOpenAdmin,
  onOpenNotifications,
  onOpenShortcuts,
  onGoToLanding,
  onSelectNav,
}: CommandPaletteProps) {
  const {
    user,
    conversations,
    contacts,
    messages,
    setActiveConversation,
    presence,
  } = useChatStore();
  const { tasks, projects, setActiveTab, setActiveProject, setIsTaskModalOpen } =
    useWorkspaceStore();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open trigger handled in parent, but if inside we toggle
          onClose();
        }
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Build items array
  const allItems: PaletteItem[] = [];

  // 1. Core Quick Actions
  allItems.push(
    {
      id: "act-landing",
      category: "Action",
      title: "Public Website",
      subtitle: "Return to marketing & architectural overview",
      icon: Globe,
      action: () => {
        onGoToLanding();
        onClose();
      },
    },
    {
      id: "act-notifications",
      category: "Action",
      title: "View Notifications",
      subtitle: "Pending direct message requests & alerts",
      icon: Bell,
      action: () => {
        onOpenNotifications();
        onClose();
      },
    },
    {
      id: "act-settings",
      category: "Action",
      title: "Account Settings",
      subtitle: "Manage profile, session tokens & encryption keys",
      icon: Settings,
      action: () => {
        onOpenSettings();
        onClose();
      },
    },
    {
      id: "act-shortcuts",
      category: "Action",
      title: "Keyboard Shortcuts",
      subtitle: "View comprehensive navigation hotkeys",
      icon: Keyboard,
      action: () => {
        onOpenShortcuts();
        onClose();
      },
    },
    {
      id: "act-ws-dashboard",
      category: "Action",
      title: "Workspace HQ & Overview",
      subtitle: "Sprint metrics, company announcements & deliverable health",
      icon: LayoutDashboard,
      action: () => {
        setActiveTab("dashboard");
        if (onSelectNav) onSelectNav("workspace");
        onClose();
      },
    },
    {
      id: "act-ws-kanban",
      category: "Action",
      title: "Kanban Sprint Board",
      subtitle: "Manage To-Do, In-Progress, Review, and Completed cards",
      icon: Kanban,
      action: () => {
        setActiveTab("kanban");
        if (onSelectNav) onSelectNav("kanban");
        onClose();
      },
    },
    {
      id: "act-ws-new-task",
      category: "Action",
      title: "Create New Task",
      subtitle: "Add a new deliverable, checklist, due date and assignee",
      icon: Plus,
      action: () => {
        setIsTaskModalOpen(true);
        if (onSelectNav) onSelectNav("kanban");
        onClose();
      },
    },
    {
      id: "act-ws-projects",
      category: "Action",
      title: "Projects & Roadmaps",
      subtitle: "Milestones, progress bars and cross-functional team initiatives",
      icon: Folder,
      action: () => {
        setActiveTab("projects");
        if (onSelectNav) onSelectNav("projects");
        onClose();
      },
    },
    {
      id: "act-ws-calendar",
      category: "Action",
      title: "Calendar & Video Syncs",
      subtitle: "Scheduled team meetings, standups and deliverable deadlines",
      icon: Calendar,
      action: () => {
        setActiveTab("calendar");
        if (onSelectNav) onSelectNav("calendar");
        onClose();
      },
    },
    {
      id: "act-ws-team",
      category: "Action",
      title: "Team & Member Directory",
      subtitle: "Colleague roles, departments and direct messaging",
      icon: Users2,
      action: () => {
        setActiveTab("team");
        if (onSelectNav) onSelectNav("team");
        onClose();
      },
    }
  );

  // Add tasks
  tasks.forEach((task) => {
    allItems.push({
      id: `task-${task.id}`,
      category: "Task",
      title: task.title,
      subtitle: `${task.status} • ${task.priority} Priority ${task.assignee ? `• @${task.assignee.username}` : ""}`,
      icon: CheckSquare,
      action: () => {
        setActiveTab("kanban");
        if (onSelectNav) onSelectNav("kanban");
        onClose();
      },
    });
  });

  if (user?.role === "admin") {
    allItems.push({
      id: "act-admin",
      category: "Action",
      title: "Governance Admin Console",
      subtitle: "Manage platform users, channels & maintenance",
      icon: Shield,
      action: () => {
        onOpenAdmin();
        onClose();
      },
    });
  }

  // 2. Conversations & Channels
  conversations.forEach((conv) => {
    if (conv.type === "group") {
      allItems.push({
        id: `conv-${conv.id}`,
        category: "Channel",
        title: conv.name || "Group Channel",
        subtitle: `${conv.members?.length || 0} members • ${conv.is_public ? "Public" : "Private"}`,
        icon: Users,
        action: () => {
          setActiveConversation(conv.id);
          onClose();
        },
      });
    } else {
      const isOnline = conv.other_user ? presence[conv.other_user.id]?.isOnline : false;
      allItems.push({
        id: `conv-${conv.id}`,
        category: "Direct Chat",
        title: conv.name || conv.other_user?.display_name || "Direct Chat",
        subtitle: `@${conv.other_user?.username || "unknown"} • ${isOnline ? "Online" : "Offline"}`,
        icon: MessageSquare,
        action: () => {
          setActiveConversation(conv.id);
          onClose();
        },
      });
    }
  });

  // 3. Contacts
  contacts.forEach((contact) => {
    // Only if not already represented
    const alreadyConv = conversations.find(
      (c) => c.type === "direct" && c.other_user?.id === contact.id
    );
    if (!alreadyConv) {
      allItems.push({
        id: `contact-${contact.id}`,
        category: "Contact",
        title: contact.display_name,
        subtitle: `@${contact.username} • Saved Contact`,
        icon: UserCheck,
        action: async () => {
          try {
            await useChatStore.getState().startDirectChat(contact.id);
          } catch (e) {
            console.error(e);
          }
          onClose();
        },
      });
    }
  });

  // 4. Message Search (if query >= 2 chars)
  if (query.trim().length >= 2) {
    const qLower = query.toLowerCase();
    Object.entries(messages).forEach(([convId, msgList]) => {
      const conv = conversations.find((c) => c.id === convId);
      const convName = conv ? conv.name : "Chat";
      msgList.forEach((msg) => {
        if (msg.content.toLowerCase().includes(qLower) && !msg.content.startsWith("deleted by @")) {
          allItems.push({
            id: `msg-${msg.id}`,
            category: "Message",
            title: msg.content.length > 55 ? msg.content.slice(0, 55) + "..." : msg.content,
            subtitle: `In ${convName} • by ${msg.sender_name}`,
            icon: FileText,
            action: () => {
              setActiveConversation(convId);
              onClose();
            },
          });
        }
      });
    });
  }

  // Filter items based on query
  const filtered = query.trim()
    ? allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase())) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-scale-up"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Box */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <Search className="h-4 w-4 text-brand-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search people, channels, messages..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <div className="flex items-center space-x-1.5 ml-2">
            <kbd className="hidden sm:inline text-[10px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-400 font-mono">
              ESC
            </kbd>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No matching commands or conversations found for "{query}".
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-left ${
                    isSelected
                      ? "bg-brand-600/20 text-white border border-brand-500/30"
                      : "text-slate-300 hover:bg-slate-800/60 border border-transparent"
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-brand-600 text-white"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-white truncate">
                          {item.title}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 uppercase tracking-wider">
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <ArrowRight
                    className={`h-3.5 w-3.5 shrink-0 ml-2 transition ${
                      isSelected ? "text-brand-400 translate-x-0.5" : "text-slate-600"
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center space-x-3">
            <span>
              <kbd className="bg-slate-800 px-1 rounded text-[10px] text-slate-400">↑</kbd>{" "}
              <kbd className="bg-slate-800 px-1 rounded text-[10px] text-slate-400">↓</kbd> navigate
            </span>
            <span>
              <kbd className="bg-slate-800 px-1 rounded text-[10px] text-slate-400">↵</kbd> select
            </span>
          </div>
          <span>BlinkTalk Command Gateway</span>
        </div>
      </div>
    </div>
  );
}
