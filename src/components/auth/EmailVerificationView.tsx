import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Mail,
  ArrowRight,
  RotateCw,
  Edit3,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface EmailVerificationViewProps {
  email: string;
  inviteWorkspaceName?: string | null;
  onOpenLogin: () => void;
  onContinueToWorkspace?: () => void;
  onChangeEmail: () => void;
  onResendEmail: () => Promise<void>;
  onSimulateVerified?: () => void;
}

export default function EmailVerificationView({
  email,
  inviteWorkspaceName,
  onOpenLogin,
  onContinueToWorkspace,
  onChangeEmail,
  onResendEmail,
  onSimulateVerified,
}: EmailVerificationViewProps) {
  const [cooldown, setCooldown] = useState(45);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // Countdown timer for resend email
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setResendMessage(null);
    try {
      await onResendEmail();
      setCooldown(60);
      setResendMessage("Verification email dispatched. Check your inbox or spam.");
    } catch (err: any) {
      setResendMessage(err.message || "Failed to resend verification email.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      id="email-verification-view"
      className="space-y-6 text-center animate-fade-in"
    >
      {/* Icon badge */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
        <CheckCircle2 className="h-8 w-8" />
      </div>

      {/* Main Heading */}
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold tracking-tight text-white">
          Check your email
        </h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          We’ve sent a verification email to:
        </p>
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm font-mono text-cyan-300">
          <Mail className="h-4 w-4 text-cyan-400 shrink-0" />
          <span className="font-semibold">{email || "your email address"}</span>
        </div>
        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed pt-1">
          {inviteWorkspaceName
            ? `Please verify your email and then continue to join ${inviteWorkspaceName}.`
            : "Please verify your email and then sign in to continue."}
        </p>
      </div>

      {/* Resend status toast */}
      {resendMessage && (
        <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-300">
          {resendMessage}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3 pt-2">
        {inviteWorkspaceName && onContinueToWorkspace ? (
          <button
            type="button"
            onClick={onContinueToWorkspace}
            className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 py-3 px-4 text-sm font-semibold text-white hover:from-blue-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition shadow-lg shadow-brand-500/20 active:scale-[0.98] cursor-pointer"
          >
            <span>Continue to Workspace</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenLogin}
            className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 py-3 px-4 text-sm font-semibold text-white hover:from-blue-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition shadow-lg shadow-brand-500/20 active:scale-[0.98] cursor-pointer"
          >
            <span>Open Login</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        )}

        {/* Resend button */}
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center space-x-2 cursor-pointer"
        >
          <RotateCw className={`h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`} />
          <span>
            {resending
              ? "Resending..."
              : cooldown > 0
              ? `Resend available in ${cooldown}s`
              : "Resend Email"}
          </span>
        </button>
      </div>

      {/* Secondary links */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <button
          type="button"
          onClick={onChangeEmail}
          className="flex items-center space-x-1.5 text-slate-400 hover:text-slate-200 transition cursor-pointer"
        >
          <Edit3 className="h-3.5 w-3.5" />
          <span>Change email</span>
        </button>

        {onSimulateVerified && (
          <button
            type="button"
            onClick={onSimulateVerified}
            className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition cursor-pointer"
          >
            Simulate Click to Verify
          </button>
        )}
      </div>
    </div>
  );
}
