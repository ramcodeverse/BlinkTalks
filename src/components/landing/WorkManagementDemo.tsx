import React, { useState } from "react";
import {
  MessageSquare,
  CheckSquare,
  ArrowRight,
  FolderKanban,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
  User,
  Tag,
  Calendar,
} from "lucide-react";

export default function WorkManagementDemo() {
  const [step, setStep] = useState<"message" | "task" | "board">("message");

  return (
    <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-10 relative overflow-hidden backdrop-blur-sm">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Unified Workflow Engine</span>
          </div>
          <h3 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
            Turn Conversations Into Work.
          </h3>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Most tasks start in conversations and get lost. BlinkTalks lets you turn any message directly into a task with assignees, due dates, projects, and boards.
          </p>
        </div>

        {/* Interactive Lifecycle Stepper */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 select-none">
          <button
            onClick={() => setStep("message")}
            className={`p-3 sm:p-4 rounded-xl text-left border transition cursor-pointer ${
              step === "message"
                ? "bg-brand-600/20 border-brand-500/50 text-white shadow-lg shadow-brand-500/10"
                : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono uppercase font-bold text-brand-400">Step 1</span>
              <MessageSquare className="h-4 w-4 text-brand-400" />
            </div>
            <p className="font-semibold text-xs text-white">Chat Discussion</p>
            <p className="text-[10px] text-slate-400 hidden sm:block">Action item stated in channel</p>
          </button>

          <button
            onClick={() => setStep("task")}
            className={`p-3 sm:p-4 rounded-xl text-left border transition cursor-pointer ${
              step === "task"
                ? "bg-brand-600/20 border-brand-500/50 text-white shadow-lg shadow-brand-500/10"
                : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono uppercase font-bold text-cyan-400">Step 2</span>
              <CheckSquare className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="font-semibold text-xs text-white">Task Extraction</p>
            <p className="text-[10px] text-slate-400 hidden sm:block">Converted with 1-click</p>
          </button>

          <button
            onClick={() => setStep("board")}
            className={`p-3 sm:p-4 rounded-xl text-left border transition cursor-pointer ${
              step === "board"
                ? "bg-brand-600/20 border-brand-500/50 text-white shadow-lg shadow-brand-500/10"
                : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-400">Step 3</span>
              <FolderKanban className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="font-semibold text-xs text-white">Kanban & Done</p>
            <p className="text-[10px] text-slate-400 hidden sm:block">Tracked to completion</p>
          </button>
        </div>

        {/* Live Interactive Transformation Card */}
        <div className="p-5 sm:p-8 rounded-2xl bg-slate-950 border border-slate-800/90 shadow-xl space-y-6">
          {step === "message" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800">
                <span className="flex items-center space-x-1.5 font-medium">
                  <MessageSquare className="h-3.5 w-3.5 text-brand-400" />
                  <span>Channel: #core-platform</span>
                </span>
                <span className="text-[10px] font-mono">Today, 2:14 PM</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2.5">
                  <div className="h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                    PM
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white">Priya Sharma</span>
                    <span className="text-[10px] text-slate-400 ml-2">Product Lead</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 pl-9">
                  "We need to finish authentication and session refresh before Friday so QA can run regression tests."
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <p className="text-xs text-slate-400">
                  Click below to convert this conversation message into a structured task:
                </p>
                <button
                  onClick={() => setStep("task")}
                  className="btn-interactive w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-brand-600/20 cursor-pointer"
                >
                  <CheckSquare className="h-4 w-4" />
                  <span>Convert Message to Task</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </button>
              </div>
            </div>
          )}

          {step === "task" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800">
                <span className="flex items-center space-x-1.5 text-cyan-400 font-semibold">
                  <CheckSquare className="h-4 w-4" />
                  <span>Task Created from Message</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold">
                  HIGH PRIORITY
                </span>
              </div>

              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400">TASK-104</span>
                  <h4 className="text-base font-bold text-white">
                    Authentication & Session Refresh Implementation
                  </h4>
                  <p className="text-xs text-slate-400">
                    Source: Priya Sharma in #core-platform ("finish authentication before Friday...")
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-mono">Assignee</span>
                    <p className="font-semibold text-white flex items-center gap-1">
                      <User className="h-3 w-3 text-cyan-400" /> Alex Miller
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-mono">Project</span>
                    <p className="font-semibold text-brand-300 flex items-center gap-1">
                      <FolderKanban className="h-3 w-3" /> BlinkTalks v2.5
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-mono">Due Date</span>
                    <p className="font-semibold text-amber-300 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Friday, 5:00 PM
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-mono">Status</span>
                    <p className="font-semibold text-blue-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> IN PROGRESS
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setStep("message")}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Back to Message</span>
                </button>
                <button
                  onClick={() => setStep("board")}
                  className="btn-interactive w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-cyan-600/20 cursor-pointer"
                >
                  <span>Track to Kanban Board</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </button>
              </div>
            </div>
          )}

          {step === "board" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800">
                <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Sprint Completed & Synced</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400">REAL-TIME SYNCED</span>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 opacity-60">
                  <p className="text-[10px] font-mono font-bold text-slate-400 uppercase mb-2">To Do (0)</p>
                  <p className="text-[11px] text-slate-500 italic">No remaining backlog</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 opacity-60">
                  <p className="text-[10px] font-mono font-bold text-blue-400 uppercase mb-2">In Progress (0)</p>
                  <p className="text-[11px] text-slate-500 italic">Work completed</p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/60 shadow-md">
                  <p className="text-[10px] font-mono font-bold text-emerald-400 uppercase mb-2">Done (1)</p>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-900/50 space-y-1.5">
                    <p className="text-xs font-semibold text-emerald-200 line-through">
                      Authentication & Session Refresh
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="text-emerald-400 font-medium">Verified by QA</span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-300">
                  🎉 Completed task automatically posted notification in <strong className="text-white">#core-platform</strong>
                </span>
                <button
                  onClick={() => setStep("message")}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer flex items-center space-x-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Replay Demo</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
