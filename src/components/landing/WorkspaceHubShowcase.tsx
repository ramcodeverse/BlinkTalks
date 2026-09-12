import React, { useState } from "react";
import {
  Building,
  Hash,
  FolderKanban,
  CheckSquare,
  Users,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Radio,
  Copy,
  Check,
} from "lucide-react";

interface WorkspacePreset {
  id: string;
  name: string;
  type: string;
  role: string;
  code: string;
  membersCount: number;
  channels: { name: string; unread?: boolean; activeCount: number }[];
  projects: { name: string; progress: number }[];
  activeTasks: { title: string; priority: string; due: string }[];
  recentAnnouncement: string;
}

const PRESETS: WorkspacePreset[] = [
  {
    id: "engineering",
    name: "BlinkTalks Core",
    type: "Engineering & Platform",
    role: "Admin",
    code: "BT-CORE-902",
    membersCount: 18,
    channels: [
      { name: "general", activeCount: 12 },
      { name: "platform-releases", unread: true, activeCount: 8 },
      { name: "incident-response", activeCount: 4 },
      { name: "architecture-rfcs", activeCount: 6 },
    ],
    projects: [
      { name: "WebSocket v2.5 Migration", progress: 88 },
      { name: "Payload Encryption Audit", progress: 65 },
    ],
    activeTasks: [
      { title: "Patch token refresh edge case", priority: "HIGH", due: "Today" },
      { title: "Optimize message virtualized list", priority: "MED", due: "Tomorrow" },
    ],
    recentAnnouncement: "Sprint 24 production cut at 5:00 PM UTC. All reviews must be approved.",
  },
  {
    id: "design",
    name: "Apex Product Studio",
    type: "Design & UX Team",
    role: "Member",
    code: "APEX-UX-412",
    membersCount: 9,
    channels: [
      { name: "design-system", activeCount: 7 },
      { name: "feedback-critique", activeCount: 5 },
      { name: "illustrations-3d", activeCount: 3 },
    ],
    projects: [
      { name: "Dark Theme Design Tokens", progress: 92 },
      { name: "Mobile Navigation Flow", progress: 45 },
    ],
    activeTasks: [
      { title: "Export SVG icons for web applet", priority: "HIGH", due: "Friday" },
      { title: "Review contrast ratios for WCAG AA", priority: "MED", due: "Next Mon" },
    ],
    recentAnnouncement: "New component specs uploaded to shared files. Check #design-system.",
  },
  {
    id: "hackathon",
    name: "CS490 Capstone Group",
    type: "University Project",
    role: "Owner",
    code: "CS490-CAP-77",
    membersCount: 4,
    channels: [
      { name: "project-chat", activeCount: 4 },
      { name: "final-paper", activeCount: 3 },
      { name: "demo-day-prep", activeCount: 2 },
    ],
    projects: [
      { name: "Final Report & Slides", progress: 75 },
      { name: "Live System Benchmark", progress: 50 },
    ],
    activeTasks: [
      { title: "Record 3-minute video presentation", priority: "HIGH", due: "Thursday" },
      { title: "Format bibliography in markdown", priority: "LOW", due: "Friday" },
    ],
    recentAnnouncement: "Professor confirmed our presentation slot for Friday 10:30 AM.",
  },
  {
    id: "community",
    name: "Fullstack Founders Hub",
    type: "Creator Community",
    role: "Manager",
    code: "FF-HUB-889",
    membersCount: 142,
    channels: [
      { name: "introductions", activeCount: 34 },
      { name: "showcase-demos", unread: true, activeCount: 28 },
      { name: "founder-questions", activeCount: 19 },
      { name: "cofounder-matching", activeCount: 12 },
    ],
    projects: [
      { name: "Monthly Virtual Demo Day", progress: 60 },
    ],
    activeTasks: [
      { title: "Select 5 startup pitches for live stage", priority: "HIGH", due: "In 3 days" },
    ],
    recentAnnouncement: "Over 140 founders joined this week. Welcome all new builders!",
  },
];

export default function WorkspaceHubShowcase() {
  const [selectedId, setSelectedId] = useState<string>("engineering");
  const [copiedCode, setCopiedCode] = useState(false);

  const activeWs = PRESETS.find((p) => p.id === selectedId) || PRESETS[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeWs.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 backdrop-blur-sm space-y-6">
      {/* Top Controls: Interactive Workspace Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="font-display font-bold text-base sm:text-lg text-white flex items-center gap-2">
            <Building className="h-5 w-5 text-brand-400" />
            <span>Interactive Workspace Switcher</span>
          </h3>
          <p className="text-xs text-slate-400">
            Switch between workspaces to see how channels, tasks, and teams partition instantly
          </p>
        </div>

        {/* Switcher Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {PRESETS.map((p) => {
            const isSelected = p.id === selectedId;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                  isSelected
                    ? "bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-500/20"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Workspace Hub Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Workspace Info & Channels (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Header Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {activeWs.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-white">{activeWs.name}</h4>
                  <p className="text-[11px] text-slate-400">{activeWs.type}</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/30 font-bold">
                {activeWs.role}
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase font-mono">Members</span>
                <p className="font-semibold text-white flex items-center gap-1.5 mt-0.5">
                  <Users className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{activeWs.membersCount} connected</span>
                </p>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase font-mono">Invite Code</span>
                <button
                  onClick={handleCopyCode}
                  className="font-mono text-[11px] text-brand-300 hover:text-white flex items-center gap-1 mt-0.5 transition cursor-pointer"
                  title="Click to copy invite code"
                >
                  <span>{activeWs.code}</span>
                  {copiedCode ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3 text-slate-500" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Channels List */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] font-bold text-slate-400 uppercase">
                Topic Channels ({activeWs.channels.length})
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">REAL-TIME WSS</span>
            </div>

            <div className="space-y-1.5">
              {activeWs.channels.map((ch, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex items-center space-x-2">
                    <Hash className="h-3.5 w-3.5 text-brand-400" />
                    <span className="text-xs font-medium text-white">{ch.name}</span>
                    {ch.unread && (
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {ch.activeCount} online
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Projects, Tasks & Announcement (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Active Projects */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] font-bold text-slate-400 uppercase">
                Active Sprints & Projects
              </span>
              <span className="text-[10px] text-slate-400">Synced to Kanban</span>
            </div>

            <div className="space-y-2.5">
              {activeWs.projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-white">{proj.name}</span>
                    <span className="font-mono text-cyan-300 font-bold">{proj.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Deliverable Tasks */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] font-bold text-slate-400 uppercase">
                Priority Deliverables
              </span>
              <span className="text-[10px] text-slate-400">Due This Week</span>
            </div>

            <div className="space-y-2">
              {activeWs.activeTasks.map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800"
                >
                  <div className="flex items-center space-x-2">
                    <CheckSquare className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span className="text-xs text-slate-200 font-medium">{t.title}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px]">
                    <span
                      className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                        t.priority === "HIGH"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {t.priority}
                    </span>
                    <span className="text-slate-400 font-medium">{t.due}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pinned Broadcast Announcement */}
          <div className="p-3.5 rounded-2xl bg-brand-950/40 border border-brand-800/40 flex items-start space-x-2.5">
            <Sparkles className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-brand-200">Latest Team Announcement: </span>
              <span className="text-slate-300">{activeWs.recentAnnouncement}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
