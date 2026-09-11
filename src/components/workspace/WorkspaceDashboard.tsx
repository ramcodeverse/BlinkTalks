import React from "react";
import { useWorkspaceStore } from "../../store/workspaceStore.ts";
import { useChatStore } from "../../store/chatStore.ts";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Folder,
  Calendar,
  Megaphone,
  Plus,
  ArrowRight,
  TrendingUp,
  Activity,
  Video,
  FileText,
  Shield,
  Kanban,
} from "lucide-react";

export default function WorkspaceDashboard() {
  const {
    activeWorkspace,
    tasks,
    projects,
    members,
    announcements,
    meetings,
    activities,
    setActiveTab,
    setActiveProject,
    setIsTaskModalOpen,
  } = useWorkspaceStore();
  const { user } = useChatStore();

  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const overdueTasks = tasks.filter(
    (t) =>
      t.due_date &&
      new Date(t.due_date).getTime() < Date.now() &&
      t.status !== "COMPLETED"
  ).length;

  const completionRate =
    tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Recent 2 announcements
  const recentAnnouncements = announcements.slice(0, 2);

  // Upcoming meetings
  const upcomingMeetings = meetings.slice(0, 3);

  // Recent 6 activities
  const recentActivities = activities.slice(0, 6);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto p-6 space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-brand-950/60 via-slate-900 to-slate-900 border border-brand-500/20 shadow-lg relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30">
              Workspace Overview
            </span>
            <span className="text-xs text-slate-400">
              {activeWorkspace?.name || "Acme Innovations HQ"}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.display_name || "Team Member"} 👋
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Here is what's happening across projects, active sprint tasks, team deliverables, and announcements today.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2 z-10">
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-md shadow-brand-500/20 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Task</span>
          </button>
          <button
            onClick={() => setActiveTab("kanban")}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center space-x-2 transition cursor-pointer"
          >
            <Kanban className="h-4 w-4 text-brand-400" />
            <span>Open Board</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Tasks</span>
            <CheckCircle2 className="h-4 w-4 text-brand-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-slate-100">
              {tasks.length}
            </span>
            <span className="text-xs text-slate-400">tasks logged</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div
              className="bg-brand-500 h-full rounded-full"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* In Progress */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>In Progress</span>
            <Clock className="h-4 w-4 text-blue-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-blue-400">
              {inProgressTasks}
            </span>
            <span className="text-xs text-slate-400">underway</span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            Active deliverables
          </span>
        </div>

        {/* Completed */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {completedTasks}
            </span>
            <span className="text-xs text-emerald-500 font-semibold">
              ({completionRate}%)
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            Velocity completion rate
          </span>
        </div>

        {/* Overdue / Attention */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overdue Tasks</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-2xl font-bold font-mono ${overdueTasks > 0 ? "text-rose-400" : "text-slate-300"}`}>
              {overdueTasks}
            </span>
            <span className="text-xs text-slate-400">need action</span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            Target deadlines missed
          </span>
        </div>
      </div>

      {/* Announcements Alert Banner */}
      {recentAnnouncements.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-400">
              <Megaphone className="h-4 w-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider">
                Company Announcements
              </h2>
            </div>
            <button
              onClick={() => setActiveTab("announcements")}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <span>View all</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-100 line-clamp-1">
                    {ann.title}
                  </h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-amber-500/20 text-amber-300">
                    {ann.priority}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {ann.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Active Projects & Upcoming Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Folder className="h-4 w-4 text-brand-400" />
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Active Projects & Roadmaps ({projects.length})
              </h2>
            </div>
            <button
              onClick={() => setActiveTab("projects")}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <span>All Projects</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {projects.slice(0, 4).map((proj) => {
              const percent = proj.completion_percentage || 0;

              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    setActiveProject(proj);
                    setActiveTab("kanban");
                  }}
                  className="rounded-xl bg-slate-950 hover:bg-slate-950/80 border border-slate-800 hover:border-brand-500/30 p-4 transition-all space-y-2.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                        style={{ backgroundColor: proj.color }}
                      >
                        <Folder className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-100">
                          {proj.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 line-clamp-1">
                          {proj.description || "Active collaboration stream"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-slate-200">
                        {percent}%
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {proj.completed_tasks_count || 0}/{proj.tasks_count || 0} tasks
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: proj.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Meetings & Syncs (1 Col) */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-emerald-400" />
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Upcoming Syncs
              </h2>
            </div>
            <button
              onClick={() => setActiveTab("calendar")}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <span>Calendar</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {upcomingMeetings.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">
                No meetings scheduled for this week.
              </p>
            ) : (
              upcomingMeetings.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-xs font-bold text-slate-100 line-clamp-1">
                      {m.title}
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      {new Date(m.start_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {m.description || "Team sync session"}
                  </p>

                  {m.link && (
                    <a
                      href={m.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 text-xs text-brand-400 hover:text-brand-300 font-semibold transition"
                    >
                      <Video className="h-3.5 w-3.5" />
                      <span>Join Meeting Link</span>
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Real-time Workspace Activity Stream */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-blue-400" />
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Recent Workspace Activity
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Real-time audit log
          </span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {recentActivities.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">
              No recent activity recorded yet.
            </p>
          ) : (
            recentActivities.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="h-7 w-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px] border border-slate-700">
                    {act.user_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200">
                      {act.user_name}
                    </span>{" "}
                    <span className="text-slate-400">
                      {act.action.replace(/_/g, " ")}:
                    </span>{" "}
                    <span className="font-medium text-brand-300">
                      {act.object_title}
                    </span>
                    {act.details && (
                      <span className="text-slate-500 ml-1 text-[11px]">
                        ({act.details})
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {new Date(act.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
