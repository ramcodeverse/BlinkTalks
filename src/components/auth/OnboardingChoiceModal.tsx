import React, { useState } from "react";
import {
  MessageSquare,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  Building2,
  Plus,
} from "lucide-react";

export type OnboardingUsageChoice = "personal" | "team" | "both";

interface OnboardingChoiceModalProps {
  displayName: string;
  onComplete: (choice: OnboardingUsageChoice, action?: "explore" | "create_ws" | "join_ws") => void;
}

export default function OnboardingChoiceModal({
  displayName,
  onComplete,
}: OnboardingChoiceModalProps) {
  const [selectedChoice, setSelectedChoice] = useState<OnboardingUsageChoice>("both");
  const [step, setStep] = useState<"choice" | "welcome">("choice");

  const CHOICES: Array<{
    id: OnboardingUsageChoice;
    title: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
    tag: string;
  }> = [
    {
      id: "personal",
      title: "Personal Communication",
      desc: "Fast, distraction-free direct messages, group chats, and voice channels.",
      icon: MessageSquare,
      tag: "Direct & Groups",
    },
    {
      id: "team",
      title: "Team Collaboration",
      desc: "Organized workspaces, shared channels, tasks, kanban boards, and project tracking.",
      icon: Users,
      tag: "Workspaces & Tasks",
    },
    {
      id: "both",
      title: "Both (Recommended)",
      desc: "Unified experience combining real-time communication and synchronized task workflows.",
      icon: Sparkles,
      tag: "Complete Platform",
    },
  ];

  if (step === "welcome") {
    return (
      <div className="space-y-6 text-center animate-fade-in">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 text-cyan-400 border border-blue-500/30 shadow-lg shadow-blue-500/10">
          <Sparkles className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold tracking-tight text-white">
            Welcome to BlinkTalks, {displayName || "there"}!
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Your connected workspace is ready. You can now chat, join communities, manage tasks, and collaborate on projects seamlessly.
          </p>
        </div>

        {/* Feature summary pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 py-1 text-xs text-slate-300">
          <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center space-x-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Chat & Channels</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center space-x-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
            <span>Task Management</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center space-x-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
            <span>Kanban Boards</span>
          </span>
        </div>

        {/* Action options (No forced company workspace) */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={() => onComplete(selectedChoice, "explore")}
            className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 py-3 px-4 text-sm font-semibold text-white hover:from-blue-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition shadow-lg shadow-brand-500/20 active:scale-[0.98] cursor-pointer"
          >
            <span>Explore BlinkTalks</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => onComplete(selectedChoice, "create_ws")}
              className="py-2.5 px-3 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-blue-400" />
              <span>Create Workspace</span>
            </button>
            <button
              type="button"
              onClick={() => onComplete(selectedChoice, "join_ws")}
              className="py-2.5 px-3 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Building2 className="h-3.5 w-3.5 text-indigo-400" />
              <span>Join Workspace</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center space-y-1.5">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
          What will you use BlinkTalks for?
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
          We’ll tailor your workspace view. You can change this at any time.
        </p>
      </div>

      <div className="space-y-2.5 pt-1">
        {CHOICES.map((choice) => {
          const Icon = choice.icon;
          const isSelected = selectedChoice === choice.id;

          return (
            <button
              key={choice.id}
              type="button"
              onClick={() => setSelectedChoice(choice.id)}
              className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-180 flex items-start space-x-3 cursor-pointer ${
                isSelected
                  ? "bg-slate-900/90 border-blue-500/60 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/30"
                  : "bg-slate-950/60 hover:bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80"
              }`}
            >
              <div
                className={`p-2 rounded-xl border shrink-0 mt-0.5 ${
                  isSelected
                    ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                    : "bg-slate-900 border-slate-800 text-slate-400"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">
                    {choice.title}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      isSelected
                        ? "bg-blue-500/20 text-cyan-300 border-blue-500/30"
                        : "bg-slate-900 text-slate-400 border-slate-800"
                    }`}
                  >
                    {choice.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-normal">
                  {choice.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setStep("welcome")}
        className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 py-3 px-4 text-sm font-semibold text-white hover:from-blue-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition shadow-lg shadow-brand-500/20 active:scale-[0.98] cursor-pointer mt-3"
      >
        <span>Continue</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
