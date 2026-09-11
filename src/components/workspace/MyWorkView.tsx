import React, { useState, useMemo } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore.ts";
import { useChatStore } from "../../store/chatStore.ts";
import { useToast } from "../Toast.tsx";
import { Task, TaskPriority, TaskStatus } from "../../../shared/types.ts";
import {
  CheckSquare,
  Square,
  Clock,
  AlertTriangle,
  Calendar,
  Filter,
  Plus,
  Search,
  ChevronDown,
  X,
  Flag,
  Folder,
  ArrowUpDown,
  CheckCircle2,
  ChevronRight,
  Inbox,
} from "lucide-react";

export default function MyWorkView() {
  const {
    tasks,
    projects,
    activeProject,
    setActiveTask,
    setIsTaskModalOpen,
    moveTaskStatus,
  } = useWorkspaceStore();
  const { user } = useChatStore();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterProject, setFilterProject] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<"dueDate" | "priority" | "title">("dueDate");

  // Filter tasks assigned to current user, or all if none
  const myTasks = useMemo(() => {
    return tasks.filter((t) => {
      // If user assigned or unassigned
      const isAssignedToMe = !t.assignee_id || t.assignee_id === user?.id;
      if (!isAssignedToMe) return false;

      // Project filter
      if (filterProject !== "ALL" && t.project_id !== filterProject) return false;

      // Priority filter
      if (filterPriority !== "ALL" && t.priority !== filterPriority) return false;

      // Status filter
      if (filterStatus !== "ALL" && t.status !== filterStatus) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }

      return true;
    });
  }, [tasks, user?.id, filterProject, filterPriority, filterStatus, searchQuery]);

  // Group into: Today, Upcoming, Overdue, Completed
  const { overdue, today, upcoming, completed } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 86400000;

    const overdueList: Task[] = [];
    const todayList: Task[] = [];
    const upcomingList: Task[] = [];
    const completedList: Task[] = [];

    myTasks.forEach((task) => {
      if (task.status === "COMPLETED") {
        completedList.push(task);
        return;
      }

      if (!task.due_date) {
        upcomingList.push(task);
        return;
      }

      const dueTime = new Date(task.due_date).getTime();
      if (dueTime < startOfToday) {
        overdueList.push(task);
      } else if (dueTime >= startOfToday && dueTime <= endOfToday) {
        todayList.push(task);
      } else {
        upcomingList.push(task);
      }
    });

    return {
      overdue: overdueList,
      today: todayList,
      upcoming: upcomingList,
      completed: completedList,
    };
  }, [myTasks]);

  const handleToggleComplete = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const newStatus: TaskStatus = task.status === "COMPLETED" ? "TODO" : "COMPLETED";
    const prevStatus = task.status;
    await moveTaskStatus(task.id, newStatus);

    if (newStatus === "COMPLETED") {
      addToast(`Completed "${task.title}"`, "success", {
        label: "Undo",
        onClick: () => {
          moveTaskStatus(task.id, prevStatus);
        },
      });
    }
  };

  const activeFiltersCount =
    (filterPriority !== "ALL" ? 1 : 0) +
    (filterProject !== "ALL" ? 1 : 0) +
    (filterStatus !== "ALL" ? 1 : 0);

  const clearAllFilters = () => {
    setFilterPriority("ALL");
    setFilterProject("ALL");
    setFilterStatus("ALL");
    setSearchQuery("");
  };

  const renderTaskRow = (task: Task) => {
    const isCompleted = task.status === "COMPLETED";
    const isOverdue =
      task.due_date &&
      new Date(task.due_date).getTime() < Date.now() &&
      !isCompleted;

    let priorityBadge = "bg-slate-800 text-slate-400";
    if (task.priority === "URGENT") priorityBadge = "bg-rose-500/10 text-rose-400 border-rose-500/20";
    if (task.priority === "HIGH") priorityBadge = "bg-amber-500/10 text-amber-400 border-amber-500/20";
    if (task.priority === "MEDIUM") priorityBadge = "bg-blue-500/10 text-blue-400 border-blue-500/20";

    return (
      <div
        key={task.id}
        onClick={() => setActiveTask(task)}
        className={`group flex items-center justify-between p-3 rounded-xl border transition cursor-pointer select-none ${
          isCompleted
            ? "bg-slate-950/40 border-slate-850 hover:border-slate-800 opacity-60"
            : "bg-slate-900/90 hover:bg-slate-850 border-slate-800 hover:border-slate-700 shadow-sm"
        }`}
      >
        {/* Left: Checkbox & Title */}
        <div className="flex items-center space-x-3 flex-1 min-w-0 pr-3">
          <button
            onClick={(e) => handleToggleComplete(e, task)}
            className="text-slate-500 hover:text-brand-400 p-0.5 rounded cursor-pointer transition shrink-0"
            title={isCompleted ? "Mark incomplete" : "Mark completed"}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 task-checkbox-check" />
            ) : (
              <Square className="h-4 w-4 text-slate-500 hover:text-slate-300 task-checkbox-check" />
            )}
          </button>

          <span
            className={`text-xs font-medium truncate transition ${
              isCompleted ? "line-through text-slate-500" : "text-slate-100"
            }`}
          >
            {task.title}
          </span>

          {task.labels && task.labels.length > 0 && (
            <div className="hidden sm:flex items-center space-x-1 shrink-0">
              {task.labels.slice(0, 2).map((l) => (
                <span
                  key={l}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700"
                >
                  #{l}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: Meta indicators */}
        <div className="flex items-center space-x-2.5 shrink-0">
          {/* Project tag */}
          {task.project && (
            <span
              className="hidden md:inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-medium border"
              style={{
                backgroundColor: `${task.project.color}15`,
                color: task.project.color,
                borderColor: `${task.project.color}30`,
              }}
            >
              <Folder className="h-3 w-3" />
              <span className="truncate max-w-[110px]">{task.project.name}</span>
            </span>
          )}

          {/* Priority */}
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${priorityBadge}`}
          >
            {task.priority}
          </span>

          {/* Due date */}
          {task.due_date && (
            <span
              className={`flex items-center space-x-1 text-[11px] font-mono px-2 py-0.5 rounded ${
                isOverdue
                  ? "bg-rose-500/10 text-rose-400 font-semibold"
                  : "text-slate-400 bg-slate-800/50"
              }`}
            >
              <Calendar className="h-3 w-3" />
              <span>{new Date(task.due_date).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
            </span>
          )}

          <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-400 transition" />
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Header & Filter Bar */}
      <div className="p-5 border-b border-slate-800 bg-slate-900/50 space-y-4 shrink-0 select-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-brand-400" />
              My Work & Assigned Deliverables
            </h1>
            <p className="text-xs text-slate-400">
              Personal task pipeline across all workspace projects and sprints.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="btn-interactive px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-brand-500/20 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search my tasks..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter dropdown triggers */}
          <div className="flex items-center space-x-2">
            {/* Priority filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Project filter */}
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition cursor-pointer max-w-[150px] truncate"
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Active filters clear */}
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="btn-interactive px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 hover:text-white transition flex items-center space-x-1 cursor-pointer"
              >
                <X className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 animate-fade-in pt-1">
            <span className="text-[11px] text-slate-500 font-medium">Filtering by:</span>
            {filterPriority !== "ALL" && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs">
                <span>Priority: {filterPriority}</span>
                <button onClick={() => setFilterPriority("ALL")} className="hover:text-white cursor-pointer">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filterProject !== "ALL" && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs">
                <span>Project: {projects.find((p) => p.id === filterProject)?.name || filterProject}</span>
                <button onClick={() => setFilterProject("ALL")} className="hover:text-white cursor-pointer">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filterStatus !== "ALL" && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs">
                <span>Status: {filterStatus}</span>
                <button onClick={() => setFilterStatus("ALL")} className="hover:text-white cursor-pointer">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Sections Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Empty state */}
        {myTasks.length === 0 && (
          <div className="py-16 text-center space-y-3 animate-fade-in">
            <div className="h-12 w-12 rounded-2xl bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center">
              <Inbox className="h-6 w-6 text-slate-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">No work assigned yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You are all caught up! Create a new deliverable or pick up cards from the Kanban sprint board.
            </p>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="btn-interactive inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Task</span>
            </button>
          </div>
        )}

        {/* 1. OVERDUE SECTION */}
        {overdue.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-rose-400">
              <AlertTriangle className="h-4 w-4" />
              <span>Overdue</span>
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 border border-rose-500/30 text-[10px] font-mono">
                {overdue.length}
              </span>
            </div>
            <div className="space-y-1.5">{overdue.map(renderTaskRow)}</div>
          </section>
        )}

        {/* 2. TODAY SECTION */}
        {today.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-brand-400">
              <Clock className="h-4 w-4" />
              <span>Due Today</span>
              <span className="px-1.5 py-0.2 rounded-full bg-brand-500/20 border border-brand-500/30 text-[10px] font-mono">
                {today.length}
              </span>
            </div>
            <div className="space-y-1.5">{today.map(renderTaskRow)}</div>
          </section>
        )}

        {/* 3. UPCOMING SECTION */}
        {upcoming.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>Upcoming</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono">
                {upcoming.length}
              </span>
            </div>
            <div className="space-y-1.5">{upcoming.map(renderTaskRow)}</div>
          </section>
        )}

        {/* 4. COMPLETED SECTION */}
        {completed.length > 0 && (
          <section className="space-y-2.5 pt-2 border-t border-slate-900">
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Completed</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-mono">
                {completed.length}
              </span>
            </div>
            <div className="space-y-1.5">{completed.map(renderTaskRow)}</div>
          </section>
        )}
      </div>
    </div>
  );
}
