import React from "react";
import {
  ShieldCheck,
  Zap,
  Lock,
  Users,
  Hash,
  Smile,
  Reply,
  Activity,
  Radio,
  Bell,
  Search,
  Pin,
} from "lucide-react";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Secure Communication",
    desc: "Payload-level symmetric encryption ensures conversations remain private between verified participants.",
    tag: "Security",
  },
  {
    icon: Zap,
    title: "Real-Time Messaging",
    desc: "Persistent WebSocket pipeline delivering frames in under 50ms with zero polling overhead.",
    tag: "Speed",
  },
  {
    icon: Lock,
    title: "Private Conversations",
    desc: "Direct 1-on-1 chats with read confirmations, saved contacts, and custom privacy controls.",
    tag: "Direct",
  },
  {
    icon: Users,
    title: "Group Chats",
    desc: "Multi-party group rooms with role-based member management and custom avatar badges.",
    tag: "Groups",
  },
  {
    icon: Hash,
    title: "Topic Channels",
    desc: "Organized public and restricted channels partitioned cleanly within each workspace.",
    tag: "Organization",
  },
  {
    icon: Smile,
    title: "Message Reactions",
    desc: "One-click emoji reactions with instant live counter updates across all active listeners.",
    tag: "Interactive",
  },
  {
    icon: Reply,
    title: "Replies & Quoted Threads",
    desc: "Contextual replies that link back to the exact source message to maintain conversational clarity.",
    tag: "Clarity",
  },
  {
    icon: Activity,
    title: "Typing Indicators",
    desc: "Fluid, debounced typing broadcasts so you know when a colleague is drafting a response.",
    tag: "Real-time",
  },
  {
    icon: Radio,
    title: "Live Presence",
    desc: "Heartbeat-driven online/offline status indicators reflecting active device connections.",
    tag: "Presence",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    desc: "Targeted mention alerts, task assignment banners, and sound preferences without spam.",
    tag: "Alerts",
  },
  {
    icon: Search,
    title: "In-Conversation Search",
    desc: "Instant client-side message search with occurrence counter, stepping navigation, and highlighting.",
    tag: "Search",
  },
  {
    icon: Pin,
    title: "Pinned Messages",
    desc: "Anchor critical project guidelines, links, and decisions directly at the top of any channel.",
    tag: "Reference",
  },
];

export default function CommunicationFeaturesGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {FEATURES.map((feat, idx) => {
        const Icon = feat.icon;
        return (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all hover:translate-y-[-2px] space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 group-hover:bg-brand-500/20 group-hover:text-cyan-300 transition-colors">
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-400">
                {feat.tag}
              </span>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-white group-hover:text-cyan-200 transition-colors">
                {feat.title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                {feat.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
