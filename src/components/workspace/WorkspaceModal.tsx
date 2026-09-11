import React, { useState } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore.ts";
import {
  Building,
  Plus,
  ArrowRight,
  X,
  Check,
  KeyRound,
  Shield,
  Layers,
} from "lucide-react";

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WorkspaceModal({ isOpen, onClose }: WorkspaceModalProps) {
  const {
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
    createWorkspace,
    joinWorkspace,
  } = useWorkspaceStore();

  const [mode, setMode] = useState<"switch" | "create" | "join">("switch");

  // Create form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Technology");

  // Join form
  const [inviteCode, setInviteCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      await createWorkspace(name.trim(), description.trim(), category);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create workspace");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      await joinWorkspace(inviteCode.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid workspace invite code");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Building className="h-5 w-5 text-brand-400" />
            <h2 className="text-base font-bold text-slate-100">
              {mode === "switch" && "Workspaces"}
              {mode === "create" && "Create Workspace"}
              {mode === "join" && "Join Workspace"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Switch Mode: List existing workspaces */}
        {mode === "switch" && (
          <div className="space-y-4">
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {workspaces.map((ws) => {
                const isSelected = activeWorkspace?.id === ws.id;

                return (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setActiveWorkspace(ws);
                      onClose();
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-brand-600/20 border-brand-500/40 text-white"
                        : "bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-200"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs">{ws.name}</span>
                        {isSelected && (
                          <span className="text-[10px] bg-brand-500/20 text-brand-300 px-1.5 py-0.2 rounded font-semibold">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {ws.description || "Company workspace"}
                      </p>
                    </div>

                    {isSelected ? (
                      <Check className="h-4 w-4 text-brand-400" />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-slate-500" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setMode("create")}
                className="px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Workspace</span>
              </button>
              <button
                onClick={() => setMode("join")}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Join with Code</span>
              </button>
            </div>
          </div>
        )}

        {/* Create Mode */}
        {mode === "create" && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                Workspace Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Acme Innovations HQ"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Team mission or scope..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500 resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                <option value="Technology">Technology & Software</option>
                <option value="Product">Product & Design</option>
                <option value="Marketing">Marketing & Growth</option>
                <option value="Operations">Operations & Business</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setMode("switch")}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20 disabled:opacity-50 transition cursor-pointer"
              >
                {isSubmitting ? "Creating..." : "Create Workspace"}
              </button>
            </div>
          </form>
        )}

        {/* Join Mode */}
        {mode === "join" && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                Workspace Invite Code *
              </label>
              <input
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="e.g., acme-workspace"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-brand-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Ask your workspace admin for their invite code.
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setMode("switch")}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !inviteCode.trim()}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20 disabled:opacity-50 transition cursor-pointer"
              >
                {isSubmitting ? "Joining..." : "Join Workspace"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
