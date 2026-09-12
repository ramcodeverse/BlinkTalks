import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  FileText,
  Activity,
  Bell,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Plus,
  ArrowRight,
  Sparkles,
  Folder,
  FileImage,
  FileCode,
  Users,
  Video,
  ExternalLink,
} from "lucide-react";

export default function CalendarFilesActivitySection() {
  const [activeSubTab, setActiveSubTab] = useState<"calendar" | "files" | "activity" | "notifications">("calendar");

  return (
    <div className="space-y-8">
      {/* Navigation Subtabs Bar */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {[
          { key: "calendar", label: "Calendar & Deadlines", icon: CalendarIcon },
          { key: "files", label: "Centralized Files", icon: FileText },
          { key: "activity", label: "Real-Time Activity", icon: Activity },
          { key: "notifications", label: "Live Notifications", icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                isSelected
                  ? "bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-500/20"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
              }`}
            >
              <Icon className={`h-4 w-4 ${isSelected ? "text-cyan-300" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Pane */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 backdrop-blur-sm shadow-xl">
        {/* 22. CALENDAR: Deadlines. Meetings. Milestones. */}
        {activeSubTab === "calendar" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-cyan-400">Integrated Scheduler</span>
                <h4 className="font-display font-bold text-xl text-white">Deadlines. Meetings. Milestones.</h4>
                <p className="text-xs text-slate-400">Tasks, team meetings, and deliverables synchronized on one unified calendar.</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => alert("Event scheduling opened in active workspace")}
                  className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Event</span>
                </button>
                <button
                  onClick={() => alert("Task creator opened")}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Task</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Meeting Item */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    TEAM MEETING
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Today, 3:00 PM</span>
                </div>
                <div>
                  <h5 className="font-bold text-sm text-white">Sprint 24 Architecture Sync</h5>
                  <p className="text-xs text-slate-400 mt-0.5">Review token refresh & real-time socket cluster.</p>
                </div>
                <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Video className="h-3.5 w-3.5 text-blue-400" /> Google Meet / Built-in
                  </span>
                  <span className="text-brand-400 font-semibold cursor-pointer hover:underline text-xs">
                    Join Room
                  </span>
                </div>
              </div>

              {/* Task Deadline Item */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    TASK DEADLINE
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">Tomorrow, 5:00 PM</span>
                </div>
                <div>
                  <h5 className="font-bold text-sm text-white">Authentication & Session Refresh</h5>
                  <p className="text-xs text-slate-400 mt-0.5">Assigned to Alex Miller • BlinkTalks v2.5</p>
                </div>
                <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> In Progress (3/4)
                  </span>
                  <span className="text-brand-400 font-semibold cursor-pointer hover:underline text-xs">
                    View Task
                  </span>
                </div>
              </div>

              {/* Milestone Item */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    SPRINT MILESTONE
                  </span>
                  <span className="text-[10px] font-mono text-purple-400">Friday, Sep 25</span>
                </div>
                <div>
                  <h5 className="font-bold text-sm text-white">Security Audit Sign-Off</h5>
                  <p className="text-xs text-slate-400 mt-0.5">Final gate check prior to staging release.</p>
                </div>
                <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-purple-300 font-mono">82% Completed</span>
                  <span className="text-brand-400 font-semibold cursor-pointer hover:underline text-xs">
                    Open Project
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 23. FILES: Everything Your Team Shares. */}
        {activeSubTab === "files" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-cyan-400">Asset Management</span>
                <h4 className="font-display font-bold text-xl text-white">Everything Your Team Shares.</h4>
                <p className="text-xs text-slate-400">Design specs, architecture diagrams, API docs, and release sheets stored securely.</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => alert("Upload dialog active")}
                  className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Upload File</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  name: "Design-System-v2.fig",
                  ext: "FIGMA",
                  size: "14.2 MB",
                  uploader: "Sarah Jenkins",
                  date: "2 hours ago",
                  project: "Website Redesign",
                  icon: FileImage,
                  color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
                },
                {
                  name: "API-Documentation.pdf",
                  ext: "PDF",
                  size: "2.8 MB",
                  uploader: "Priya Sharma",
                  date: "Yesterday",
                  project: "BlinkTalks v2.5",
                  icon: FileText,
                  color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
                },
                {
                  name: "Architecture-Diagram.png",
                  ext: "PNG",
                  size: "5.4 MB",
                  uploader: "Rahul Verma",
                  date: "Sep 18, 2026",
                  project: "Security Audit",
                  icon: FileCode,
                  color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
                },
                {
                  name: "Release-Notes-v2.5.md",
                  ext: "DOC",
                  size: "140 KB",
                  uploader: "Alex Miller",
                  date: "Sep 16, 2026",
                  project: "BlinkTalks v2.5",
                  icon: FileText,
                  color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                },
              ].map((file, idx) => {
                const Icon = file.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`h-8 w-8 rounded-xl border flex items-center justify-center ${file.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{file.size}</span>
                    </div>

                    <div>
                      <h5 className="font-bold text-xs text-white line-clamp-1">{file.name}</h5>
                      <p className="text-[10px] text-brand-300 font-medium mt-0.5">{file.project}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-850 text-[10px] text-slate-400 space-y-0.5">
                      <div className="flex justify-between">
                        <span>By {file.uploader}</span>
                        <span>{file.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => alert(`Viewing preview of ${file.name}`)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="h-3 w-3" /> Preview
                      </button>
                      <button
                        onClick={() => alert(`Downloading ${file.name}`)}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="h-3 w-3" /> Get
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 24. TEAM ACTIVITY: Live Timeline */}
        {activeSubTab === "activity" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-cyan-400">Team Audit Stream</span>
                <h4 className="font-display font-bold text-xl text-white">Live Activity Timeline</h4>
                <p className="text-xs text-slate-400">Instant visibility into every action, task state change, and milestone completion.</p>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                AUDIT LOG ACTIVE
              </span>
            </div>

            <div className="space-y-3">
              {[
                {
                  actor: "Alex Miller",
                  action: "created task",
                  target: "Authentication Task #BT-204",
                  time: "4 minutes ago",
                  icon: Plus,
                  color: "text-blue-400 bg-blue-500/10",
                },
                {
                  actor: "Priya Sharma",
                  action: "moved to review",
                  target: "API Security Audit #BT-209",
                  time: "24 minutes ago",
                  icon: Activity,
                  color: "text-purple-400 bg-purple-500/10",
                },
                {
                  actor: "Rahul Verma",
                  action: "completed sprint task",
                  target: "Dashboard WebSocket State Engine",
                  time: "1 hour ago",
                  icon: CheckCircle2,
                  color: "text-emerald-400 bg-emerald-500/10",
                },
                {
                  actor: "Admin (System)",
                  action: "added new workspace member",
                  target: "Sarah Jenkins (UI/UX Design)",
                  time: "3 hours ago",
                  icon: Users,
                  color: "text-amber-400 bg-amber-500/10",
                },
                {
                  actor: "BlinkTalks v2.5",
                  action: "project milestone updated",
                  target: "Reached 75% overall completion",
                  time: "Today, 10:15 AM",
                  icon: Sparkles,
                  color: "text-cyan-400 bg-cyan-500/10",
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${item.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white">{item.actor}</span>{" "}
                        <span className="text-slate-400">{item.action}</span>{" "}
                        <span className="font-semibold text-cyan-300">"{item.target}"</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-2">{item.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 25. NOTIFICATIONS: Real-Time Alerts */}
        {activeSubTab === "notifications" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-cyan-400">Contextual In-App Alerts</span>
                <h4 className="font-display font-bold text-xl text-white">Smart Action Notifications</h4>
                <p className="text-xs text-slate-400">Never miss an assignment, review request, channel mention, or due date.</p>
              </div>
              <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                3 UNREAD ALERTS
              </span>
            </div>

            <div className="space-y-3">
              {[
                {
                  title: "Task Assigned to You",
                  desc: "Alex Miller assigned you to 'Implement token refresh logic' in BlinkTalks v2.5.",
                  time: "5m ago",
                  unread: true,
                },
                {
                  title: "Mentioned in #engineering",
                  desc: "Priya Sharma mentioned @you: 'Can you verify the API security test results?'",
                  time: "20m ago",
                  unread: true,
                },
                {
                  title: "Deadline Approaching",
                  desc: "Authentication & Session Refresh is due tomorrow at 5:00 PM.",
                  time: "1h ago",
                  unread: true,
                },
                {
                  title: "Project Milestone Reached",
                  desc: "BlinkTalks v2.5 reached 80% sprint velocity completion.",
                  time: "3h ago",
                  unread: false,
                },
                {
                  title: "Workspace Invitation Accepted",
                  desc: "Sarah Jenkins joined workspace 'BlinkTalks Engineering' as Member.",
                  time: "Yesterday",
                  unread: false,
                },
              ].map((notif, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition ${
                    notif.unread
                      ? "bg-slate-950 border-brand-500/40 shadow-sm"
                      : "bg-slate-950/50 border-slate-800/80 opacity-70"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative mt-0.5">
                      <Bell className={`h-4 w-4 ${notif.unread ? "text-cyan-400" : "text-slate-500"}`} />
                      {notif.unread && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500" />
                      )}
                    </div>
                    <div>
                      <h5 className="font-bold text-white text-xs">{notif.title}</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">{notif.desc}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-2">{notif.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
