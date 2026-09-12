import React from "react";
import {
  MessageSquare,
  CheckSquare,
  LayoutGrid,
  Users,
  FolderKanban,
} from "lucide-react";

interface CapabilityItem {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const CAPABILITIES: CapabilityItem[] = [
  {
    id: "chat",
    title: "CHAT",
    desc: "Real-time conversations",
    icon: MessageSquare,
    accentColor: "text-blue-400 group-hover:text-blue-300",
  },
  {
    id: "work",
    title: "WORK",
    desc: "Tasks & assignments",
    icon: CheckSquare,
    accentColor: "text-indigo-400 group-hover:text-indigo-300",
  },
  {
    id: "kanban",
    title: "KANBAN",
    desc: "Visual workflow",
    icon: LayoutGrid,
    accentColor: "text-cyan-400 group-hover:text-cyan-300",
  },
  {
    id: "teams",
    title: "TEAMS",
    desc: "People & communities",
    icon: Users,
    accentColor: "text-emerald-400 group-hover:text-emerald-300",
  },
  {
    id: "projects",
    title: "PROJECTS",
    desc: "Everything organized",
    icon: FolderKanban,
    accentColor: "text-violet-400 group-hover:text-violet-300",
  },
];

interface CapabilityStripProps {
  activeCapability?: string;
  onSelect?: (id: string) => void;
}

export default function CapabilityStrip({
  activeCapability,
  onSelect,
}: CapabilityStripProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
        {CAPABILITIES.map((cap) => {
          const Icon = cap.icon;
          const isActive = activeCapability === cap.id;

          return (
            <button
              key={cap.id}
              type="button"
              onClick={() => onSelect?.(cap.id)}
              className={`group relative text-left p-2.5 rounded-xl border transition-all duration-180 cursor-pointer ${
                isActive
                  ? "bg-slate-900/90 border-blue-500/50 shadow-sm shadow-blue-500/10"
                  : "bg-slate-900/50 hover:bg-slate-900/80 border-slate-800/80 hover:border-slate-700/80 hover:-translate-y-0.5"
              }`}
            >
              <div className="flex items-start space-x-2.5">
                <div
                  className={`p-1.5 rounded-lg bg-slate-950/80 border border-slate-800/70 shrink-0 transition-transform duration-180 group-hover:scale-105`}
                >
                  <Icon className={`h-3.5 w-3.5 ${cap.accentColor} transition-colors`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono text-[10px] font-bold tracking-wider text-slate-200">
                      {cap.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5 leading-tight">
                    {cap.desc}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
