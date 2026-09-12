import React, { useState } from "react";
import {
  MessageSquare,
  Users,
  CheckSquare,
  FolderKanban,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  Send,
  ChevronRight,
  Clock,
  CheckCircle2,
  Smile,
  Hash,
} from "lucide-react";

export default function HeroProductPreview() {
  const [activeTab, setActiveTab] = useState<"kanban" | "chat">("kanban");
  const [activeColumn, setActiveColumn] = useState<number>(1);

  return (
    <div className="relative mx-auto max-w-2xl w-full">
      {/* Outer Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-brand-600/30 via-indigo-600/20 to-cyan-500/20 rounded-3xl blur-xl opacity-75 pointer-events-none" />

      {/* Main Container Window */}
      <div className="relative rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Top App Chrome Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800/90 select-none">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-rose-500/80" />
            <div className="h-3 w-3 rounded-full bg-amber-500/80" />
            <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>app.blinktalks.live/engineering</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">LIVE SYNC</span>
          </div>
        </div>

        {/* Interior Workspace Layout */}
        <div className="flex h-[420px] sm:h-[450px]">
          {/* Mini Workspace Sidebar */}
          <div className="w-44 bg-slate-950/70 border-r border-slate-800/80 p-3 hidden sm:flex flex-col justify-between shrink-0 select-none">
            <div className="space-y-3">
              {/* Workspace Badge */}
              <div className="flex items-center space-x-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="h-6 w-6 rounded-md bg-brand-600 flex items-center justify-center text-white text-[11px] font-bold">
                  BT
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-white truncate">BlinkTalks Eng</p>
                  <p className="text-[9px] text-slate-400">Company Hub</p>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="space-y-0.5">
                {[
                  { label: "Home", icon: Layers, active: false },
                  { label: "Chats", icon: MessageSquare, badge: "3", active: false },
                  { label: "Channels", icon: Hash, badge: "5", active: false },
                  { label: "My Work", icon: CheckSquare, badge: "8", active: true },
                  { label: "Projects", icon: FolderKanban, active: false },
                  { label: "Kanban", icon: FolderKanban, active: false },
                  { label: "Calendar", icon: Calendar, active: false },
                  { label: "Team", icon: Users, active: false },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between px-2 py-1.5 rounded-md text-[11px] font-medium transition cursor-pointer ${
                        item.active
                          ? "bg-brand-600/20 text-brand-300 border border-brand-500/30"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="h-3.5 w-3.5" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-brand-600 text-white font-bold">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* User Profile Footer */}
            <div className="flex items-center space-x-2 pt-2 border-t border-slate-800/60">
              <div className="relative">
                <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white">
                  AL
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 border border-slate-950" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-white truncate">Alex Miller</p>
                <p className="text-[9px] text-slate-400">Frontend Lead</p>
              </div>
            </div>
          </div>

          {/* Center Main Stage */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-900/60 p-4 sm:p-5 overflow-y-auto">
            {/* Top Greeting & Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800/80">
              <div>
                <h3 className="font-display font-bold text-base text-white flex items-center gap-1.5">
                  Good afternoon, Alex
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                </h3>
                <p className="text-[11px] text-slate-400">8 open assignments • 3 due today</p>
              </div>

              {/* My Work Quick Counters */}
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-medium text-slate-300">
                  <strong className="text-white">8</strong> Tasks
                </span>
                <span className="px-2 py-1 rounded-lg bg-brand-950/60 border border-brand-800/50 text-[10px] font-medium text-brand-300">
                  <strong className="text-cyan-300">3</strong> Today
                </span>
                <span className="px-2 py-1 rounded-lg bg-rose-950/40 border border-rose-800/50 text-[10px] font-medium text-rose-300">
                  <strong className="text-rose-400">1</strong> Overdue
                </span>
              </div>
            </div>

            {/* Active Project Highlight Banner */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 mb-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  <span className="font-semibold text-white text-[12px]">Website Redesign</span>
                  <span className="text-[10px] font-mono text-slate-400">Sprint 24</span>
                </div>
                <span className="font-mono text-xs font-bold text-cyan-300">72% Completed</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400 h-full rounded-full w-[72%] transition-all duration-500" />
              </div>
            </div>

            {/* Split: Mini Kanban vs Live Connected Chat */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1">
              {/* Mini Kanban Columns (7 cols) */}
              <div className="md:col-span-7 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                    Live Sprint Board
                  </span>
                  <span className="text-[10px] text-brand-400 flex items-center cursor-pointer">
                    View All <ChevronRight className="h-3 w-3" />
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* In Progress */}
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/90 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-400 font-mono">IN PROGRESS (2)</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] space-y-1 shadow-sm hover:border-blue-500/40 transition">
                      <p className="font-medium text-white line-clamp-1">Fix authentication flow</p>
                      <div className="flex items-center justify-between text-[9px] text-slate-400">
                        <span className="text-rose-400 font-mono font-bold">HIGH</span>
                        <span>Due Today</span>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] space-y-1 shadow-sm">
                      <p className="font-medium text-white line-clamp-1">Update landing page</p>
                      <div className="flex items-center justify-between text-[9px] text-slate-400">
                        <span className="text-amber-400 font-mono font-bold">MED</span>
                        <span>Priya</span>
                      </div>
                    </div>
                  </div>

                  {/* In Review */}
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/90 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-purple-400 font-mono">IN REVIEW (1)</span>
                    </div>
                    <div className="p-2 rounded-lg bg-purple-950/20 border border-purple-800/40 text-[11px] space-y-1 shadow-sm">
                      <p className="font-medium text-white line-clamp-1">Review API security</p>
                      <div className="flex items-center justify-between text-[9px] text-purple-300">
                        <span className="font-mono font-bold">HIGH</span>
                        <span>Rahul</span>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/50 border border-emerald-900/30 text-[11px] space-y-1">
                      <div className="flex items-center space-x-1 text-emerald-400 text-[10px]">
                        <CheckCircle2 className="h-3 w-3" />
                        <span className="font-medium line-clamp-1">Deploy production build</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connected Chat Drawer (5 cols) */}
              <div className="md:col-span-5 p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                    <div className="flex items-center space-x-1.5">
                      <Hash className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="font-bold text-[11px] text-white">#engineering</span>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-400">4 active</span>
                  </div>

                  <div className="space-y-2 text-[10px]">
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-cyan-400 font-bold">@alex:</span> Can someone review the API security implementation before deploy?
                    </div>
                    <div className="bg-brand-950/50 p-2 rounded-lg border border-brand-800/40 text-brand-100">
                      <span className="text-purple-300 font-bold">@priya:</span> Done — verified and moved it to review.
                    </div>
                    <div className="p-1.5 rounded-md bg-emerald-950/30 border border-emerald-800/40 text-[9px] text-emerald-300 flex items-center space-x-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                      <span>Task #BT-142 moved to IN REVIEW</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center space-x-1.5">
                  <div className="flex-1 bg-slate-900 rounded-lg px-2 py-1 text-[10px] text-slate-400 border border-slate-800">
                    Reply in #engineering...
                  </div>
                  <div className="h-6 w-6 rounded-lg bg-brand-600 flex items-center justify-center text-white text-[10px]">
                    <Send className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
