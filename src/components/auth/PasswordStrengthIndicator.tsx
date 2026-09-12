import React from "react";
import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export type PasswordStrength = "empty" | "weak" | "fair" | "strong";

export function evaluatePasswordStrength(password: string): {
  strength: PasswordStrength;
  score: number; // 0 to 4
  hasMinLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
} {
  if (!password) {
    return {
      strength: "empty",
      score: 0,
      hasMinLength: false,
      hasLetter: false,
      hasNumber: false,
      hasSpecial: false,
    };
  }

  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  let score = 0;
  if (hasMinLength) score += 1;
  if (hasLetter) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecial) score += 1;

  let strength: PasswordStrength = "weak";
  if (score >= 4 && password.length >= 10) {
    strength = "strong";
  } else if (score >= 3 && hasMinLength) {
    strength = "strong";
  } else if (score >= 2 && password.length >= 6) {
    strength = "fair";
  } else {
    strength = "weak";
  }

  return {
    strength,
    score,
    hasMinLength,
    hasLetter,
    hasNumber,
    hasSpecial,
  };
}

export default function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const { strength, hasMinLength, hasNumber, hasSpecial, score } =
    evaluatePasswordStrength(password);

  const getLabel = () => {
    switch (strength) {
      case "strong":
        return { text: "Strong", color: "text-emerald-400", bg: "bg-emerald-500", percent: 100 };
      case "fair":
        return { text: "Fair", color: "text-amber-400", bg: "bg-amber-500", percent: 66 };
      case "weak":
      default:
        return { text: "Weak", color: "text-rose-400", bg: "bg-rose-500", percent: 33 };
    }
  };

  const status = getLabel();

  return (
    <div className="space-y-1.5 pt-1 animate-fade-in" aria-live="polite">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-400 font-medium">Password strength</span>
        <span className={`font-semibold font-mono ${status.color}`}>
          {status.text}
        </span>
      </div>

      {/* Visual meter bar with smooth transition */}
      <div className="h-1 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800/80">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${status.bg}`}
          style={{ width: `${status.percent}%` }}
        />
      </div>

      {/* Compact subtle requirements checklist */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 pt-0.5 font-mono">
        <span
          className={`flex items-center space-x-1 ${
            hasMinLength ? "text-emerald-400" : "text-slate-400"
          }`}
        >
          {hasMinLength ? <Check className="h-3 w-3 shrink-0" /> : <span className="h-1 w-1 rounded-full bg-slate-600 inline-block mr-1" />}
          <span>8+ chars</span>
        </span>
        <span
          className={`flex items-center space-x-1 ${
            hasNumber ? "text-emerald-400" : "text-slate-400"
          }`}
        >
          {hasNumber ? <Check className="h-3 w-3 shrink-0" /> : <span className="h-1 w-1 rounded-full bg-slate-600 inline-block mr-1" />}
          <span>Number</span>
        </span>
        <span
          className={`flex items-center space-x-1 ${
            hasSpecial ? "text-emerald-400" : "text-slate-400"
          }`}
        >
          {hasSpecial ? <Check className="h-3 w-3 shrink-0" /> : <span className="h-1 w-1 rounded-full bg-slate-600 inline-block mr-1" />}
          <span>Symbol</span>
        </span>
      </div>
    </div>
  );
}
