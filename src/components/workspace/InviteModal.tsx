import React, { useState } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore.ts";
import {
  X,
  UserPlus,
  Link,
  Users,
  Copy,
  Check,
  Clock,
  Shield,
  Send,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToPending?: () => void;
}

export default function InviteModal({ isOpen, onClose, onSwitchToPending }: InviteModalProps) {
  const { activeWorkspace, createInviteLink, batchInvite } = useWorkspaceStore();

  const [activeTab, setActiveTab] = useState<"link" | "batch">("link");

  // Link Generator State
  const [role, setRole] = useState("MEMBER");
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [targetHandle, setTargetHandle] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Batch Invite State
  const [batchInput, setBatchInput] = useState("");
  const [batchRole, setBatchRole] = useState("MEMBER");
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);
  const [batchResult, setBatchResult] = useState<{
    createdCount: number;
    skipped: string[];
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !activeWorkspace) return null;

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setErrorMsg("");
    try {
      const inv = await createInviteLink(
        role,
        expiresInDays,
        targetHandle.trim() || undefined
      );
      setGeneratedCode(inv.invite_code);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to generate invite link");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchInput.trim() || isSubmittingBatch) return;

    // Parse targets by commas, whitespace, or newlines
    const targets = batchInput
      .split(/[\n,]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (targets.length === 0) {
      setErrorMsg("Please enter at least one username or email address.");
      return;
    }

    setIsSubmittingBatch(true);
    setErrorMsg("");
    setBatchResult(null);

    try {
      const res = await batchInvite(targets, batchRole);
      setBatchResult({
        createdCount: res.created?.length || 0,
        skipped: res.skipped || [],
      });
      setBatchInput("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process batch invitations");
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  const getFullInviteUrl = (code: string) => {
    const origin = window.location.origin;
    return `${origin}/#invite=${code}`;
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = (code: string) => {
    navigator.clipboard.writeText(getFullInviteUrl(code));
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
              <UserPlus className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Invite Teammates
              </h2>
              <p className="text-xs text-slate-400">
                to <span className="font-semibold text-slate-200">{activeWorkspace.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => {
              setActiveTab("link");
              setErrorMsg("");
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer ${
              activeTab === "link"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Link className="h-3.5 w-3.5" />
            <span>Generate Link / Code</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("batch");
              setErrorMsg("");
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer ${
              activeTab === "batch"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Batch Invite</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: Link Generator */}
        {activeTab === "link" && (
          <form onSubmit={handleGenerateLink} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Assigned Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
                >
                  <option value="MEMBER">Member (Standard)</option>
                  <option value="MANAGER">Manager (Projects & Tasks)</option>
                  <option value="ADMIN">Admin (Workspace Admin)</option>
                  <option value="GUEST">Guest (Restricted)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Link Expiration
                </label>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
                >
                  <option value={1}>24 Hours</option>
                  <option value={7}>7 Days</option>
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days</option>
                  <option value={365}>No Expiry (1 Year)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Target User or Email (Optional)
              </label>
              <input
                type="text"
                value={targetHandle}
                onChange={(e) => setTargetHandle(e.target.value)}
                placeholder="e.g. @alex or alex@company.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Restrict this invitation specifically to a colleague's handle or email.
              </span>
            </div>

            {/* Generated Code Result Box */}
            {generatedCode && (
              <div className="p-4 rounded-xl bg-slate-950 border border-brand-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs text-brand-400 font-semibold">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Invitation Ready</span>
                  </div>
                  <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>Expires in {expiresInDays} days</span>
                  </span>
                </div>

                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
                  <span className="font-mono text-xs font-bold text-white tracking-wider">
                    {generatedCode}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyCode(generatedCode)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium flex items-center space-x-1 transition cursor-pointer"
                    >
                      {copiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(generatedCode)}
                      className="px-2.5 py-1 rounded bg-brand-600 hover:bg-brand-500 text-white text-[10px] font-semibold flex items-center space-x-1 shadow-sm transition cursor-pointer"
                    >
                      {copiedLink ? <Check className="h-3 w-3" /> : <Link className="h-3 w-3" />}
                      <span>{copiedLink ? "Link Copied" : "Copy Link"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              {onSwitchToPending ? (
                <button
                  type="button"
                  onClick={onSwitchToPending}
                  className="text-xs text-brand-400 hover:underline cursor-pointer"
                >
                  Manage Pending Invites →
                </button>
              ) : (
                <div />
              )}
              <button
                type="submit"
                disabled={isGenerating}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20 disabled:opacity-50 transition cursor-pointer flex items-center space-x-1.5"
              >
                <Link className="h-3.5 w-3.5" />
                <span>{isGenerating ? "Generating..." : "Generate Invite"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Batch Invite */}
        {activeTab === "batch" && (
          <form onSubmit={handleBatchSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Default Role for Batch
              </label>
              <select
                value={batchRole}
                onChange={(e) => setBatchRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                <option value="MEMBER">Member (Standard)</option>
                <option value="MANAGER">Manager (Projects & Tasks)</option>
                <option value="ADMIN">Admin (Workspace Admin)</option>
                <option value="GUEST">Guest (Restricted)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Teammate Handles or Emails *
              </label>
              <textarea
                rows={4}
                required
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                placeholder="Enter handles or emails separated by commas or lines:&#10;@sarah, @mark, alex@company.com, dev@acme.org"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono resize-y"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Each invitee receives an invitation granting the chosen role upon entry.
              </span>
            </div>

            {batchResult && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium">
                  <Check className="h-4 w-4" />
                  <span>
                    Successfully created {batchResult.createdCount} invitation
                    {batchResult.createdCount !== 1 ? "s" : ""}!
                  </span>
                </div>

                {batchResult.skipped.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <span className="text-[10px] font-semibold uppercase text-amber-400 block">
                      Skipped ({batchResult.skipped.length}):
                    </span>
                    <ul className="text-[11px] text-slate-400 space-y-0.5">
                      {batchResult.skipped.map((s, idx) => (
                        <li key={idx} className="line-clamp-1">• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              {onSwitchToPending ? (
                <button
                  type="button"
                  onClick={onSwitchToPending}
                  className="text-xs text-brand-400 hover:underline cursor-pointer"
                >
                  Manage Pending Invites →
                </button>
              ) : (
                <div />
              )}
              <button
                type="submit"
                disabled={isSubmittingBatch || !batchInput.trim()}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20 disabled:opacity-50 transition cursor-pointer flex items-center space-x-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSubmittingBatch ? "Sending..." : "Send Invitations"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
