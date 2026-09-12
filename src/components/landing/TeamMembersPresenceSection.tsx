import React, { useState } from "react";
import {
  Users,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  Circle,
  FileText,
  Calendar,
  Megaphone,
  AtSign,
  Share2,
  Activity,
  Layers,
  Video,
  ShieldCheck,
  Check,
} from "lucide-react";

interface TeamMember {
  name: string;
  avatar: string;
  role: string;
  department: string;
  status: "Online" | "Away" | "Busy" | "Offline";
  currentWork: string;
  color: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Alex Miller",
    avatar: "AM",
    role: "Frontend Developer",
    department: "Product Engineering",
    status: "Online",
    currentWork: "Working on Dashboard & Kanban Board",
    color: "from-blue-600 to-indigo-600",
  },
  {
    name: "Priya Sharma",
    avatar: "PS",
    role: "Backend Developer",
    department: "Platform Infrastructure",
    status: "Busy",
    currentWork: "Working on API Security & WebSocket Gateway",
    color: "from-indigo-600 to-purple-600",
  },
  {
    name: "Rahul Verma",
    avatar: "RV",
    role: "DevOps Engineer",
    department: "Cloud Operations",
    status: "Away",
    currentWork: "Reviewing Docker deployment & TLS certs",
    color: "from-cyan-600 to-blue-600",
  },
  {
    name: "Sarah Jenkins",
    avatar: "SJ",
    role: "Product Designer",
    department: "UI/UX Design",
    status: "Online",
    currentWork: "Designing Task Modal & Mobile Experience",
    color: "from-purple-600 to-pink-600",
  },
];

const COLLABORATION_FEATURES = [
  {
    title: "Task Comments & Threads",
    desc: "Discuss edge cases directly inside tasks without losing context across chat rooms.",
    icon: MessageSquare,
  },
  {
    title: "@Mentions System",
    desc: "Ping teammates in channels, tasks, or docs for immediate attention and notifications.",
    icon: AtSign,
  },
  {
    title: "Shared Team Files",
    desc: "Store assets, architectural diagrams, and project briefs in a centralized repository.",
    icon: Share2,
  },
  {
    title: "Project Discussions",
    desc: "Dedicated high-level discussion streams tied directly to multi-week sprint milestones.",
    icon: Layers,
  },
  {
    title: "Broadcast Announcements",
    desc: "Post company-wide or team-wide alerts with pinned banners and priority flags.",
    icon: Megaphone,
  },
  {
    title: "Team Channels",
    desc: "Public and private topical channels for engineering, design, operations, and social.",
    icon: MessageSquare,
  },
  {
    title: "Live Activity Stream",
    desc: "Transparent real-time audit of every task created, moved, approved, or completed.",
    icon: Activity,
  },
  {
    title: "Review Approvals",
    desc: "Clear sign-off workflows between leads and contributors before moving to production.",
    icon: CheckCircle2,
  },
  {
    title: "Collaborative Notes & Docs",
    desc: "Markdown-powered shared documentation with live formatting and export options.",
    icon: FileText,
  },
  {
    title: "Calendar & Meetings",
    desc: "Plan sprint syncs, schedule video calls, and track milestone deadlines in one view.",
    icon: Calendar,
  },
  {
    title: "Instant Video Rooms",
    desc: "Jump into 1-click team video syncs right from channels or scheduled events.",
    icon: Video,
  },
];

export default function TeamMembersPresenceSection() {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const statusBadgeColor = (status: TeamMember["status"]) => {
    switch (status) {
      case "Online":
        return "bg-emerald-400";
      case "Away":
        return "bg-amber-400";
      case "Busy":
        return "bg-rose-500";
      case "Offline":
        return "bg-slate-500";
    }
  };

  const statusBadgeText = (status: TeamMember["status"]) => {
    switch (status) {
      case "Online":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "Away":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "Busy":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "Offline":
        return "text-slate-400 bg-slate-800 border-slate-700";
    }
  };

  const filteredMembers =
    filterStatus === "ALL"
      ? TEAM_MEMBERS
      : TEAM_MEMBERS.filter((m) => m.status.toUpperCase() === filterStatus);

  return (
    <div className="space-y-16">
      {/* 19. TEAM COLLABORATION: YOUR TEAM, IN SYNC */}
      <div className="space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
            <Users className="h-3.5 w-3.5 text-cyan-400" />
            <span>Human-Centric Transparency</span>
          </div>
          <h3 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">
            Your Team, In Sync.
          </h3>
          <p className="text-sm text-slate-400">
            Know who is online, what they are currently building, and their live presence status without asking for constant status updates.
          </p>
        </div>

        {/* Presence Filter Pills */}
        <div className="flex items-center justify-center space-x-2">
          {["ALL", "ONLINE", "BUSY", "AWAY", "OFFLINE"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold transition cursor-pointer border ${
                filterStatus === st
                  ? "bg-brand-600 text-white border-brand-500"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Team Member Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredMembers.map((member, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition hover:translate-y-[-2px] space-y-4 shadow-lg group"
            >
              <div className="flex items-start justify-between">
                <div className="relative">
                  <div
                    className={`h-11 w-11 rounded-2xl bg-gradient-to-tr ${member.color} flex items-center justify-center text-white font-bold text-sm shadow-md`}
                  >
                    {member.avatar}
                  </div>
                  <span
                    className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-slate-950 ${statusBadgeColor(
                      member.status
                    )}`}
                  />
                </div>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${statusBadgeText(
                    member.status
                  )}`}
                >
                  {member.status.toUpperCase()}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                  {member.name}
                </h4>
                <p className="text-xs text-brand-300 font-medium">{member.role}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{member.department}</p>
              </div>

              <div className="pt-3 border-t border-slate-850 space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">
                  Current Focus
                </span>
                <p className="text-xs text-slate-300 font-medium line-clamp-2">
                  {member.currentWork}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 20. COLLABORATION FEATURES */}
      <div className="space-y-8 pt-10 border-t border-slate-800/80">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h4 className="font-display font-bold text-2xl text-white">
            Built-In Collaboration Suite
          </h4>
          <p className="text-xs text-slate-400">
            No expensive third-party plugins needed. Everything is engineered into the unified BlinkTalks architecture.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COLLABORATION_FEATURES.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-4.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition flex items-start space-x-3.5 group"
              >
                <div className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="space-y-1">
                  <h5 className="font-semibold text-xs text-white group-hover:text-cyan-200 transition-colors">
                    {feat.title}
                  </h5>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
