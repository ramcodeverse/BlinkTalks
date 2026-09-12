import React, { useState } from "react";
import {
  MessageSquare,
  CheckSquare,
  FolderKanban,
  Layers,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ArrowDown,
} from "lucide-react";

const STEPS = [
  {
    id: 1,
    title: "1. Discussion in Chat",
    badge: "Chat",
    icon: MessageSquare,
    desc: "Team collaborates and discusses feature requirements in the #engineering channel.",
    snippet: "@alex: Let's finish the authentication system and session refresh before Friday.",
    stageName: "Conversation Stage",
  },
  {
    id: 2,
    title: "2. 1-Click Task Creation",
    badge: "Task",
    icon: CheckSquare,
    desc: "Hover over the message to turn discussion directly into a prioritized, assigned task.",
    snippet: "Created: [BT-204] Complete Authentication System • Assigned to @alex • Due Friday",
    stageName: "Action Extraction",
  },
  {
    id: 3,
    title: "3. Interactive Sprint Kanban",
    badge: "Kanban",
    icon: FolderKanban,
    desc: "Card appears on the team board, smoothly advancing across To Do, In Progress, and Review.",
    snippet: "Status updated: [BT-204] moved from IN PROGRESS to IN REVIEW by @alex",
    stageName: "Sprint Execution",
  },
  {
    id: 4,
    title: "4. Project Milestone Sync",
    badge: "Project",
    icon: Layers,
    desc: "Parent project roadmap automatically updates velocity and completion statistics.",
    snippet: "Project 'BlinkTalks v2.5' reached 88% overall milestone completion.",
    stageName: "Roadmap Alignment",
  },
  {
    id: 5,
    title: "5. Collaborative Team Review",
    badge: "Team",
    icon: Users,
    desc: "Peers verify deliverables, add comments, and approve pull requests in real time.",
    snippet: "@priya: Verified token refresh and TLS barrier. Ready for deployment.",
    stageName: "Peer Sign-Off",
  },
  {
    id: 6,
    title: "6. Shipped & Notified",
    badge: "Completed",
    icon: CheckCircle2,
    desc: "Task is marked Done; real-time broadcast posts confirmation back to the channel.",
    snippet: "🎉 Shipped! @alex completed [BT-204]. Production deployment verified.",
    stageName: "Completion & Celebration",
  },
];

export default function InteractiveProductStepper() {
  const [currentStep, setCurrentStep] = useState(1);
  const activeData = STEPS.find((s) => s.id === currentStep) || STEPS[0];
  const ActiveIcon = activeData.icon;

  return (
    <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-10 backdrop-blur-sm space-y-8">
      {/* Section Header */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Complete Lifecycle Tour</span>
        </div>
        <h4 className="font-display font-bold text-2xl sm:text-3xl text-white">
          From Conversation to Completion.
        </h4>
        <p className="text-xs sm:text-sm text-slate-400">
          Click through each phase below to see how work flows seamlessly without ever leaving BlinkTalks.
        </p>
      </div>

      {/* 6-Stage Visual Stepper Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const isCurrent = s.id === currentStep;

          return (
            <button
              key={s.id}
              onClick={() => setCurrentStep(s.id)}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between space-y-2 ${
                isCurrent
                  ? "bg-brand-600/20 border-brand-500/50 text-white shadow-lg shadow-brand-500/10"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`h-4 w-4 ${isCurrent ? "text-cyan-300" : "text-slate-500"}`} />
                <span className="text-[10px] font-mono font-bold">0{s.id}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-semibold block">{s.badge}</span>
                <span className="text-[9px] text-slate-500 font-mono block truncate">
                  {s.stageName}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail Showcase Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-cyan-400">
              <ActiveIcon className="h-4.5 w-4.5" />
            </div>
            <div>
              <h5 className="font-display font-bold text-sm text-white">{activeData.title}</h5>
              <span className="text-[11px] font-mono text-slate-400">{activeData.desc}</span>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-cyan-300 font-bold shrink-0">
            Step {activeData.id} of 6
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 font-mono text-xs text-slate-200 leading-relaxed flex items-center space-x-3">
          <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <span>{activeData.snippet}</span>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setCurrentStep((prev) => (prev > 1 ? prev - 1 : 6))}
            className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
          >
            ← Previous Phase
          </button>
          <button
            onClick={() => setCurrentStep((prev) => (prev < 6 ? prev + 1 : 1))}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
          >
            <span>{currentStep === 6 ? "Restart Flow" : "Next Phase"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
