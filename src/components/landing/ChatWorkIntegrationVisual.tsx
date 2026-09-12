import React, { useState } from "react";
import {
  MessageSquare,
  CheckSquare,
  Folder,
  Calendar,
  User,
  Clock,
  ArrowRight,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Tag,
  Hash,
  Send,
} from "lucide-react";

export default function ChatWorkIntegrationVisual() {
  const [selectedTask, setSelectedTask] = useState<"auth" | "audit" | "docs">("auth");

  const taskData = {
    auth: {
      id: "BT-204",
      title: "Complete Authentication System",
      status: "IN_PROGRESS",
      statusColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      assigned: "Alex Miller",
      role: "Frontend Lead",
      due: "Sep 20, 2026",
      project: "BlinkTalks v2.5",
      chatSnippet: "Let's finish the authentication system before Friday's team review.",
      chatAuthor: "Priya Sharma",
      chatAuthorRole: "Tech Lead",
      subtasks: "3 of 4 subtasks completed",
      labels: ["Security", "Sprint 24", "Core API"],
    },
    audit: {
      id: "BT-209",
      title: "Security & Role Governance Audit",
      status: "IN_REVIEW",
      statusColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      assigned: "Rahul Verma",
      role: "Security Engineer",
      due: "Sep 22, 2026",
      project: "Security Architecture",
      chatSnippet: "Audit on SQL partition barrier and transport TLS is ready for peer verification.",
      chatAuthor: "Rahul Verma",
      chatAuthorRole: "Security Engineer",
      subtasks: "5 of 5 checks passed",
      labels: ["Compliance", "AES-256", "Review"],
    },
    docs: {
      id: "BT-215",
      title: "API Migration & WebSocket Guide",
      status: "TODO",
      statusColor: "text-slate-400 bg-slate-800 border-slate-700",
      assigned: "Sarah Jenkins",
      role: "Developer Relations",
      due: "Sep 25, 2026",
      project: "BlinkTalks v2.5",
      chatSnippet: "Drafting the WebSocket reconnect gateway documentation for developers.",
      chatAuthor: "Sarah Jenkins",
      chatAuthorRole: "Developer Relations",
      subtasks: "1 of 3 sections drafted",
      labels: ["Docs", "SDK", "DevOps"],
    },
  };

  const current = taskData[selectedTask];

  return (
    <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-10 backdrop-blur-sm space-y-8">
      {/* Section Headline */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Seamless Dual-Pane Workflow</span>
        </div>
        <h3 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
          Where Conversations Become Execution.
        </h3>
        <p className="text-sm text-slate-400">
          No other platform natively connects active messaging threads to the living tasks and deliverables they produce.
        </p>
      </div>

      {/* Task Selector Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-mono text-slate-500 uppercase tracking-wider mr-2">
          Select Scenario:
        </span>
        {(["auth", "audit", "docs"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setSelectedTask(key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
              selectedTask === key
                ? "bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-500/20"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
            }`}
          >
            {taskData[key].title}
          </button>
        ))}
      </div>

      {/* Split Interface Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
        {/* LEFT: Conversation Panel (7 cols) */}
        <div className="lg:col-span-7 p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <div className="h-7 w-7 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
                  <Hash className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-white">#engineering-core</h4>
                  <p className="text-[10px] text-slate-400">BlinkTalks v2.5 Team Channel</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Conversation
              </span>
            </div>

            {/* Chat message bubbles */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-xs">{current.chatAuthor}</span>
                    <span className="text-[10px] text-brand-300 font-mono">[{current.chatAuthorRole}]</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">2:45 PM</span>
                </div>
                <p className="text-slate-200 leading-relaxed pl-1">
                  "{current.chatSnippet}"
                </p>
              </div>

              {/* Connected Action Note */}
              <div className="p-3 rounded-xl bg-brand-950/30 border border-brand-800/40 text-[11px] text-brand-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckSquare className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>
                    Linked work item: <strong className="text-white">[{current.id}] {current.title}</strong>
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                  CONNECTED
                </span>
              </div>
            </div>
          </div>

          {/* Chat Composer Mock */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center space-x-2">
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 flex items-center justify-between">
              <span>Reply with action item or mention...</span>
              <span className="text-[10px] font-mono text-slate-500">Press Enter</span>
            </div>
            <div className="h-8 w-8 rounded-xl bg-brand-600 flex items-center justify-center text-white text-xs cursor-pointer hover:bg-brand-500 transition">
              <Send className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        {/* RIGHT: Related Work Split Panel (5 cols) */}
        <div className="lg:col-span-5 p-5 sm:p-6 bg-slate-900/60 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <CheckSquare className="h-4 w-4 text-cyan-400" />
                <span className="font-semibold text-xs text-slate-200 uppercase tracking-wider">
                  Related Work
                </span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${current.statusColor}`}>
                {current.status.replace("_", " ")}
              </span>
            </div>

            {/* Task Card Details */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3.5">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">{current.id}</span>
                <h4 className="font-bold text-sm text-white mt-0.5">{current.title}</h4>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-850">
                  <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-500" /> Assignee
                  </span>
                  <span className="font-semibold text-slate-200">{current.assigned}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-850">
                  <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" /> Due Date
                  </span>
                  <span className="font-semibold text-amber-400">{current.due}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-850">
                  <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                    <Folder className="h-3.5 w-3.5 text-slate-500" /> Project
                  </span>
                  <span className="font-semibold text-brand-300">{current.project}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" /> Subtasks
                  </span>
                  <span className="font-mono text-slate-300 text-[11px]">{current.subtasks}</span>
                </div>
              </div>

              {/* Labels */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {current.labels.map((label, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-300"
                  >
                    #{label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-850">
            <button
              onClick={() => alert(`Task ${current.id} details preview.`)}
              className="py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm transition cursor-pointer"
            >
              <span>Open Task</span>
              <ArrowRight className="h-3 w-3" />
            </button>
            <button
              onClick={() => alert(`Navigating to ${current.project} roadmap.`)}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center space-x-1.5 border border-slate-700/60 transition cursor-pointer"
            >
              <span>View Project</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
