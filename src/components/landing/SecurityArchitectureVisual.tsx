import React from "react";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Layers,
  Server,
  Database,
  ArrowRight,
  CheckCircle,
  FileKey,
  Cpu,
} from "lucide-react";

export default function SecurityArchitectureVisual() {
  const steps = [
    {
      title: "1. Device Transport",
      desc: "WSS / TLS 1.3 encrypted frame pipe",
      icon: Lock,
      color: "text-brand-400",
      border: "border-brand-500/30",
      bg: "bg-brand-500/10",
    },
    {
      title: "2. Identity Verification",
      desc: "Bcrypt salted credentials + JWT claims",
      icon: KeyRound,
      color: "text-cyan-400",
      border: "border-cyan-500/30",
      bg: "bg-cyan-500/10",
    },
    {
      title: "3. Tenant Isolation",
      desc: "Workspace scoped SQL & socket barriers",
      icon: Layers,
      color: "text-indigo-400",
      border: "border-indigo-500/30",
      bg: "bg-indigo-500/10",
    },
    {
      title: "4. RBAC Gatekeeper",
      desc: "Owner, Admin, Manager, Member permissions",
      icon: ShieldCheck,
      color: "text-purple-400",
      border: "border-purple-500/30",
      bg: "bg-purple-500/10",
    },
    {
      title: "5. Payload Security",
      desc: "AES-256-CBC message payload protection",
      icon: Database,
      color: "text-emerald-400",
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
    },
  ];

  const guarantees = [
    {
      title: "Bcrypt Cryptographic Hashing",
      detail: "Passwords are salted and hashed using standard bcrypt algorithms before ever touching persistent storage.",
    },
    {
      title: "AES-256-CBC Message Encryption",
      detail: "Chat messages are encrypted server-side with initialization vectors before storage, guarding data at rest.",
    },
    {
      title: "Strict Workspace Boundaries",
      detail: "Data queries are partitioned strictly by workspace ID with zero cross-tenant query leakage.",
    },
    {
      title: "Zero Third-Party Ad Trackers",
      detail: "No advertising scripts, no telemetry trackers, no selling of user messages or profile metadata.",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Visual Pipeline Flow */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 sm:p-8 backdrop-blur-sm">
        <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Multi-Layered Security Architecture</span>
          </div>
          <h4 className="font-display font-bold text-xl sm:text-2xl text-white">
            How BlinkTalks Guards Every Byte
          </h4>
          <p className="text-xs text-slate-400">
            From client keystroke to server database, every packet traverses five deterministic security layers.
          </p>
        </div>

        {/* Horizontal Flow Steps */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl bg-slate-950 border ${step.border} flex flex-col justify-between space-y-3 relative group hover:scale-[1.02] transition-transform`}
              >
                <div className="flex items-center justify-between">
                  <div className={`h-8 w-8 rounded-xl ${step.bg} flex items-center justify-center ${step.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">0{idx + 1}</span>
                </div>

                <div>
                  <h5 className="font-semibold text-xs text-white leading-tight mb-1">{step.title}</h5>
                  <p className="text-[11px] text-slate-400 leading-snug">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verified Guarantees Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {guarantees.map((item, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition space-y-2"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <h5 className="font-semibold text-sm text-white">{item.title}</h5>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pl-6">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
