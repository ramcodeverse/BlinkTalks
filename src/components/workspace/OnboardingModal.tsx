import React, { useState } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore.ts";
import { useChatStore } from "../../store/chatStore.ts";
import { useToast } from "../Toast.tsx";
import {
  X,
  CheckCircle2,
  Building,
  User,
  Users2,
  Folder,
  CheckSquare,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const { user } = useChatStore();
  const { createProject, createTask, activeWorkspace } = useWorkspaceStore();
  const { addToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [profileRole, setProfileRole] = useState("Product Engineer");
  const [inviteEmail, setInviteEmail] = useState("");
  const [projectName, setProjectName] = useState("Core Platform Sprint");
  const [taskTitle, setTaskTitle] = useState("Setup workspace roadmap and initial team sync");

  if (!isOpen) return null;

  const handleNext = async () => {
    try {
      if (currentStep === 4 && projectName.trim()) {
        await createProject({ name: projectName.trim(), color: "#3b82f6" });
      } else if (currentStep === 5 && taskTitle.trim()) {
        await createTask({ title: taskTitle.trim(), priority: "HIGH" });
        addToast("Workspace setup complete! Welcome to BlinkTalks.", "success");
        onClose();
        return;
      }

      setCurrentStep((prev) => Math.min(5, prev + 1));
    } catch (err: any) {
      console.error("Onboarding setup step error:", err);
      addToast(err?.message || "Failed to complete onboarding step", "error");
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-6 animate-scale-up">
        {/* Header with step progress */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-brand-500/20 text-brand-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Workspace Onboarding Tour
              </h3>
              <p className="text-[11px] text-slate-400">Step {currentStep} of 5</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-brand-500 h-full rounded-full progress-bar-smooth"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>

        {/* Step 1: Profile */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
                {user?.display_name?.charAt(0) || "U"}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Welcome, {user?.display_name}</h4>
                <p className="text-xs text-slate-400">Confirm your primary job title or role.</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Job Role</label>
              <input
                type="text"
                value={profileRole}
                onChange={(e) => setProfileRole(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        )}

        {/* Step 2: Workspace */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-slate-800 text-brand-400">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Active Company Workspace</h4>
                <p className="text-xs text-slate-400">
                  {activeWorkspace?.name || "Acme Innovations HQ"}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              Your company workspace connects real-time direct chat channels with your Kanban sprint board, team directory, and document archives.
            </p>
          </div>
        )}

        {/* Step 3: Invite Team */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-slate-800 text-brand-400">
                <Users2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Invite Colleague</h4>
                <p className="text-xs text-slate-400">Add teammates to this workspace.</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Colleague Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Workspace Invite Code: <span className="font-mono text-brand-300">{activeWorkspace?.invite_code || "BLINK-889"}</span>
            </p>
          </div>
        )}

        {/* Step 4: First Project */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-slate-800 text-brand-400">
                <Folder className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Create First Project</h4>
                <p className="text-xs text-slate-400">Define a milestone or deliverable initiative.</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Q4 Website Relaunch"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        )}

        {/* Step 5: First Task */}
        {currentStep === 5 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-slate-800 text-brand-400">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Create First Task</h4>
                <p className="text-xs text-slate-400">Kick off work with an actionable deliverable.</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Task Title</label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Draft architecture specifications"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        )}

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div>
            {currentStep > 1 ? (
              <button
                onClick={handlePrev}
                className="btn-interactive flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                Skip Tour
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleNext}
              className="btn-interactive flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20 cursor-pointer"
            >
              <span>{currentStep === 5 ? "Finish & Launch" : "Next"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
