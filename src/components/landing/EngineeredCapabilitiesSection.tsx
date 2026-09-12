import React, { useState } from "react";
import {
  MessageSquare,
  Lock,
  Hash,
  ShieldCheck,
  Building,
  CheckSquare,
  FolderKanban,
  Layers,
  Users,
  Bell,
  Activity,
  Smile,
  FileText,
  Calendar,
  Search,
  Database,
  Smartphone,
  Check,
  Sparkles,
} from "lucide-react";

interface Capability {
  title: string;
  category: "Communication" | "Work Management" | "Platform & Security";
  description: string;
  icon: any;
  status: "Production Ready";
}

const CAPABILITIES: Capability[] = [
  {
    title: "Real-time Messaging",
    category: "Communication",
    description: "Instant WebSocket delivery with typing indicators, delivery receipts, and sub-50ms latency.",
    icon: MessageSquare,
    status: "Production Ready",
  },
  {
    title: "Private Conversations",
    category: "Communication",
    description: "Direct 1-on-1 encrypted messaging streams isolated from public team channel noise.",
    icon: Lock,
    status: "Production Ready",
  },
  {
    title: "Group Chats & Channels",
    category: "Communication",
    description: "Topical and department channels with member lists, roles, and searchable archives.",
    icon: Hash,
    status: "Production Ready",
  },
  {
    title: "Role-based Governance",
    category: "Platform & Security",
    description: "Owner, Admin, and Member permissions governing workspace deletion, invites, and settings.",
    icon: ShieldCheck,
    status: "Production Ready",
  },
  {
    title: "Team Workspaces",
    category: "Work Management",
    description: "Multi-tenant workspaces separating clients, internal engineering, design, and operations.",
    icon: Building,
    status: "Production Ready",
  },
  {
    title: "Task Management",
    category: "Work Management",
    description: "Assignments, priorities, due dates, subtasks, labels, and Markdown descriptions.",
    icon: CheckSquare,
    status: "Production Ready",
  },
  {
    title: "Interactive Kanban Boards",
    category: "Work Management",
    description: "Drag-and-drop workflow across To Do, In Progress, In Review, and Completed columns.",
    icon: FolderKanban,
    status: "Production Ready",
  },
  {
    title: "Project Management",
    category: "Work Management",
    description: "Multi-week roadmaps, completion percentage velocity, and task aggregation.",
    icon: Layers,
    status: "Production Ready",
  },
  {
    title: "Team Collaboration",
    category: "Communication",
    description: "In-line task comments, team @mentions, shared file previews, and discussion feeds.",
    icon: Users,
    status: "Production Ready",
  },
  {
    title: "Smart Notifications",
    category: "Communication",
    description: "Actionable in-app alerts for direct mentions, task assignments, and nearing deadlines.",
    icon: Bell,
    status: "Production Ready",
  },
  {
    title: "Live Presence Engine",
    category: "Communication",
    description: "Real-time presence indicators showing Online, Away, Busy, and current active focus.",
    icon: Activity,
    status: "Production Ready",
  },
  {
    title: "Message Reactions",
    category: "Communication",
    description: "One-click emoji reactions for lightweight, expressive acknowledgment without chat spam.",
    icon: Smile,
    status: "Production Ready",
  },
  {
    title: "Files & Attachments",
    category: "Work Management",
    description: "Centralized file repository supporting previews, metadata tracking, and downloads.",
    icon: FileText,
    status: "Production Ready",
  },
  {
    title: "Calendar & Scheduling",
    category: "Work Management",
    description: "Consolidated timeline mapping task deadlines, team syncs, and delivery milestones.",
    icon: Calendar,
    status: "Production Ready",
  },
  {
    title: "Search Across Everything",
    category: "Platform & Security",
    description: "Instant unified query search spanning messages, channels, tasks, projects, and members.",
    icon: Search,
    status: "Production Ready",
  },
  {
    title: "Cross-Device Persistence",
    category: "Platform & Security",
    description: "PostgreSQL & state sync guaranteeing continuous work access across web and mobile.",
    icon: Database,
    status: "Production Ready",
  },
  {
    title: "Responsive Mobility",
    category: "Platform & Security",
    description: "Pixel-perfect mobile touch optimization with responsive drawers and navigation tabs.",
    icon: Smartphone,
    status: "Production Ready",
  },
];

export default function EngineeredCapabilitiesSection() {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  const categories = ["ALL", "Communication", "Work Management", "Platform & Security"];

  const filtered =
    activeCategory === "ALL"
      ? CAPABILITIES
      : CAPABILITIES.filter((c) => c.category === activeCategory);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Full Architectural Specification</span>
        </div>
        <h3 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">
          Engineered for Complete Team Alignment.
        </h3>
        <p className="text-sm text-slate-400">
          Everything you need for communication, collaboration, and organized work — unified in a single high-performance engine.
        </p>
      </div>

      {/* Category Switcher */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
              activeCategory === cat
                ? "bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-500/20"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Capabilities Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition hover:bg-slate-900/90 space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold flex items-center gap-1">
                  <Check className="h-3 w-3" /> Built-in
                </span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-white group-hover:text-cyan-200 transition-colors">
                  {item.title}
                </h4>
                <span className="text-[10px] font-mono text-brand-400 font-semibold uppercase">
                  {item.category}
                </span>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
