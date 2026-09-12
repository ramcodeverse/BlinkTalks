import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  LayoutGrid,
  CheckSquare,
  Sparkles,
  ArrowRight,
  Circle,
} from "lucide-react";

export default function ProductPreviewMini() {
  const [progress, setProgress] = useState(65);
  const [activeTab, setActiveTab] = useState<"kanban" | "tasks" | "chat">("tasks");
  const [taskCompleted, setTaskCompleted] = useState(true);
  const [secondTaskStatus, setSecondTaskStatus] = useState<"progress" | "done">("progress");

  // Subtle delayed entrance simulation (runs once after mount, not aggressive loop)
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(72);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-xl backdrop-blur-sm relative overflow-hidden text-left"
    >
      {/* Ambient subtle top edge gradient */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/30 via-indigo-500/20 to-transparent" />

      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/70 pb-3">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400/90 shadow-sm shadow-emerald-400/50" />
          <span className="text-[11px] font-semibold text-slate-300 tracking-tight">
            BlinkTalks Workspace
          </span>
        </div>
        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono">
          <span className="text-cyan-400 font-medium">#engineering</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-medium">8 active</span>
        </div>
      </div>

      {/* Project Progress Section */}
      <div className="py-3 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-slate-200">Website Redesign</span>
          <span className="font-mono text-[10px] text-cyan-400 font-semibold">{progress}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Task & Work Items Preview */}
      <div className="space-y-1.5 pt-0.5 pb-2">
        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800/50 text-[11px]">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-300 font-medium line-through decoration-slate-600">
              API Review
            </span>
          </div>
          <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Done
          </span>
        </div>

        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-950/70 border border-blue-500/30 text-[11px]">
          <div className="flex items-center space-x-2">
            <div className="h-3.5 w-3.5 rounded-full border border-blue-400/80 flex items-center justify-center shrink-0">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            </div>
            <span className="text-slate-100 font-medium">Update Landing Page</span>
          </div>
          <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
            In Review
          </span>
        </div>
      </div>

      {/* Footer Navigation Tabs */}
      <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center space-x-3">
          <span className="text-cyan-400 font-medium flex items-center space-x-1">
            <LayoutGrid className="h-3 w-3" />
            <span>Kanban</span>
          </span>
          <span className="text-slate-400 flex items-center space-x-1">
            <CheckSquare className="h-3 w-3" />
            <span>Tasks</span>
          </span>
          <span className="text-slate-400 flex items-center space-x-1">
            <MessageSquare className="h-3 w-3" />
            <span>Chat</span>
          </span>
        </div>
        <div className="flex items-center space-x-1 text-[9px] text-slate-500">
          <Sparkles className="h-2.5 w-2.5 text-indigo-400" />
          <span>Synced</span>
        </div>
      </div>
    </div>
  );
}
