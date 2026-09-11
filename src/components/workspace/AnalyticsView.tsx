import React from "react";
import { useWorkspaceStore } from "../../store/workspaceStore.ts";
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Folder,
} from "lucide-react";

export default function AnalyticsView() {
  const { tasks, projects, members, analytics } = useWorkspaceStore();

  const totalTasks = tasks.length;
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const inReview = tasks.filter((t) => t.status === "IN_REVIEW").length;
  const todo = tasks.filter((t) => t.status === "TODO").length;
  const blocked = tasks.filter((t) => t.status === "BLOCKED").length;

  const urgent = tasks.filter((t) => t.priority === "URGENT").length;
  const high = tasks.filter((t) => t.priority === "HIGH").length;
  const medium = tasks.filter((t) => t.priority === "MEDIUM").length;
  const low = tasks.filter((t) => t.priority === "LOW").length;

  const completionPercent = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

  // Workload by member
  const memberWorkload = members.map((m) => {
    const assignedTasks = tasks.filter((t) => t.assignee_id === m.user_id);
    const completedTasks = assignedTasks.filter((t) => t.status === "COMPLETED");
    return {
      member: m,
      total: assignedTasks.length,
      completed: completedTasks.length,
      rate: assignedTasks.length > 0 ? Math.round((completedTasks.length / assignedTasks.length) * 100) : 0,
    };
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2.5">
            <BarChart3 className="h-6 w-6 text-brand-400" />
            <span>Workspace Analytics & Team Velocity</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time delivery throughput, status breakdowns, priority distribution, and team bandwidth.
          </p>
        </div>
      </div>

      {/* Top 3 High-Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-2">
          <span className="text-xs font-semibold text-slate-400">Total Completion Rate</span>
          <div className="flex items-baseline space-x-3">
            <span className="text-3xl font-extrabold font-mono text-emerald-400">
              {completionPercent}%
            </span>
            <span className="text-xs text-slate-400">
              {completed} of {totalTasks} finished
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-2">
          <span className="text-xs font-semibold text-slate-400">Active WIP (Work in Progress)</span>
          <div className="flex items-baseline space-x-3">
            <span className="text-3xl font-extrabold font-mono text-blue-400">
              {inProgress + inReview}
            </span>
            <span className="text-xs text-slate-400">tasks underway</span>
          </div>
          <span className="text-[11px] text-slate-500 block">
            {inProgress} active + {inReview} in code review
          </span>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-2">
          <span className="text-xs font-semibold text-slate-400">Urgent & High Priority Items</span>
          <div className="flex items-baseline space-x-3">
            <span className="text-3xl font-extrabold font-mono text-rose-400">
              {urgent + high}
            </span>
            <span className="text-xs text-slate-400">critical tasks</span>
          </div>
          <span className="text-[11px] text-slate-500 block">
            {urgent} urgent ⚡ + {high} high priority
          </span>
        </div>
      </div>

      {/* Grid: Status Breakdown & Priority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Status Breakdown
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>Completed</span>
                <span className="font-mono">{completed} ({totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${totalTasks > 0 ? (completed / totalTasks) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>In Progress</span>
                <span className="font-mono">{inProgress} ({totalTasks > 0 ? Math.round((inProgress / totalTasks) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{ width: `${totalTasks > 0 ? (inProgress / totalTasks) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>In Review</span>
                <span className="font-mono">{inReview} ({totalTasks > 0 ? Math.round((inReview / totalTasks) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${totalTasks > 0 ? (inReview / totalTasks) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>To Do (Backlog)</span>
                <span className="font-mono">{todo} ({totalTasks > 0 ? Math.round((todo / totalTasks) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-slate-500 h-full rounded-full"
                  style={{ width: `${totalTasks > 0 ? (todo / totalTasks) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>Blocked</span>
                <span className="font-mono">{blocked} ({totalTasks > 0 ? Math.round((blocked / totalTasks) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full"
                  style={{ width: `${totalTasks > 0 ? (blocked / totalTasks) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Priority Distribution
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/20 space-y-1">
              <span className="text-[10px] font-bold uppercase text-rose-400">Urgent ⚡</span>
              <p className="text-2xl font-bold font-mono text-slate-100">{urgent}</p>
              <span className="text-[11px] text-slate-500">Immediate attention</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/20 space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-400">High</span>
              <p className="text-2xl font-bold font-mono text-slate-100">{high}</p>
              <span className="text-[11px] text-slate-500">Sprint deliverable</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/20 space-y-1">
              <span className="text-[10px] font-bold uppercase text-blue-400">Medium</span>
              <p className="text-2xl font-bold font-mono text-slate-100">{medium}</p>
              <span className="text-[11px] text-slate-500">Standard priority</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Low</span>
              <p className="text-2xl font-bold font-mono text-slate-100">{low}</p>
              <span className="text-[11px] text-slate-500">Nice-to-have</span>
            </div>
          </div>
        </div>
      </div>

      {/* Team Member Workload Allocation */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
          Team Workload & Assignment Distribution
        </h3>

        <div className="divide-y divide-slate-800/80">
          {memberWorkload.map(({ member, total, completed, rate }) => (
            <div key={member.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                  {member.user.display_name[0]?.toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    {member.user.display_name}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    {member.department || "General"} • {member.role}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {completed}/{total} tasks
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {rate}% completed
                  </span>
                </div>
                <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden hidden sm:block">
                  <div
                    className="bg-brand-500 h-full rounded-full"
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
