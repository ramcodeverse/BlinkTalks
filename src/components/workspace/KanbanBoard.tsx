import React, { useState } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore.ts";
import { useChatStore } from "../../store/chatStore.ts";
import { Task, TaskStatus } from "../../../shared/types.ts";
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Folder,
  User,
  MessageSquare,
  CheckSquare,
  Search,
  Filter,
  ArrowRight,
  MoreVertical,
  Calendar,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import TaskDetailModal from "./TaskDetailModal.tsx";
import CreateTaskModal from "./CreateTaskModal.tsx";

interface ColumnDef {
  status: TaskStatus;
  title: string;
  badgeBg: string;
  dotColor: string;
}

const COLUMNS: ColumnDef[] = [
  { status: "TODO", title: "To Do", badgeBg: "bg-slate-800 text-slate-300", dotColor: "bg-slate-400" },
  { status: "IN_PROGRESS", title: "In Progress", badgeBg: "bg-blue-500/10 text-blue-400 border border-blue-500/20", dotColor: "bg-blue-400" },
  { status: "IN_REVIEW", title: "In Review", badgeBg: "bg-amber-500/10 text-amber-400 border border-amber-500/20", dotColor: "bg-amber-400" },
  { status: "BLOCKED", title: "Blocked", badgeBg: "bg-rose-500/10 text-rose-400 border border-rose-500/20", dotColor: "bg-rose-400" },
  { status: "COMPLETED", title: "Completed", badgeBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20", dotColor: "bg-emerald-400" },
];

export default function KanbanBoard() {
  const {
    tasks,
    projects,
    members,
    activeProject,
    setActiveProject,
    moveTaskStatus,
    taskFilterStatus,
    taskFilterPriority,
    taskFilterAssignee,
    taskSearchQuery,
    setTaskFilterPriority,
    setTaskFilterAssignee,
    setTaskSearchQuery,
    isLoadingTasks,
  } = useWorkspaceStore();
  const { user } = useChatStore();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<TaskStatus>("TODO");

  // Filtering
  const filteredTasks = tasks.filter((t) => {
    // Project filter
    if (activeProject && t.project_id !== activeProject.id) {
      return false;
    }
    // Priority filter
    if (taskFilterPriority !== "ALL" && t.priority !== taskFilterPriority) {
      return false;
    }
    // Assignee filter
    if (taskFilterAssignee !== "ALL") {
      if (taskFilterAssignee === "ME" && t.assignee_id !== user?.id) {
        return false;
      }
      if (taskFilterAssignee === "UNASSIGNED" && t.assignee_id) {
        return false;
      }
      if (
        taskFilterAssignee !== "ME" &&
        taskFilterAssignee !== "UNASSIGNED" &&
        t.assignee_id !== taskFilterAssignee
      ) {
        return false;
      }
    }
    // Search query
    if (taskSearchQuery.trim()) {
      const q = taskSearchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchLabels = t.labels?.some((l) => l.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchLabels) return false;
    }
    return true;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-rose-500/15 text-rose-300 border-rose-500/30";
      case "HIGH":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case "MEDIUM":
        return "bg-blue-500/15 text-blue-300 border-blue-500/30";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    switch (current) {
      case "TODO":
        return "IN_PROGRESS";
      case "IN_PROGRESS":
        return "IN_REVIEW";
      case "IN_REVIEW":
        return "COMPLETED";
      case "BLOCKED":
        return "IN_PROGRESS";
      default:
        return null;
    }
  };

  const getPrevStatus = (current: TaskStatus): TaskStatus | null => {
    switch (current) {
      case "IN_PROGRESS":
        return "TODO";
      case "IN_REVIEW":
        return "IN_PROGRESS";
      case "COMPLETED":
        return "IN_REVIEW";
      case "BLOCKED":
        return "TODO";
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Control / Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-b border-slate-800 bg-slate-900/40">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project filter */}
          <div className="relative">
            <select
              value={activeProject?.id || "ALL"}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "ALL") {
                  setActiveProject(null);
                } else {
                  const p = projects.find((proj) => proj.id === val);
                  if (p) setActiveProject(p);
                }
              }}
              className="bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="ALL">All Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  📁 {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority filter */}
          <select
            value={taskFilterPriority}
            onChange={(e) => setTaskFilterPriority(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-500 cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent ⚡</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Assignee filter */}
          <select
            value={taskFilterAssignee}
            onChange={(e) => setTaskFilterAssignee(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-500 cursor-pointer"
          >
            <option value="ALL">All Assignees</option>
            <option value="ME">Assigned to Me</option>
            <option value="UNASSIGNED">Unassigned</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.user.display_name}
              </option>
            ))}
          </select>

          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={taskSearchQuery}
              onChange={(e) => setTaskSearchQuery(e.target.value)}
              placeholder="Filter tasks..."
              className="bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 w-40 sm:w-52"
            />
          </div>
        </div>

        {/* Add Task Button */}
        <button
          onClick={() => {
            setCreateDefaultStatus("TODO");
            setCreateModalOpen(true);
          }}
          className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-brand-500/20 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Kanban Board Columns Grid */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex items-start space-x-4 min-w-[1100px] h-full">
          {COLUMNS.map((col) => {
            const columnTasks = filteredTasks.filter(
              (t) => t.status === col.status
            );

            return (
              <div
                key={col.status}
                className="flex-1 flex flex-col rounded-2xl bg-slate-900/60 border border-slate-800/80 p-3.5 max-h-full overflow-hidden"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      {col.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${col.badgeBg}`}>
                      {columnTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setCreateDefaultStatus(col.status);
                      setCreateModalOpen(true);
                    }}
                    title={`Add task to ${col.title}`}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Column Task Cards Stream */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {columnTasks.length === 0 ? (
                    <div className="py-8 text-center border-2 border-dashed border-slate-800/80 rounded-xl">
                      <p className="text-xs text-slate-500">No tasks in {col.title}</p>
                      <button
                        onClick={() => {
                          setCreateDefaultStatus(col.status);
                          setCreateModalOpen(true);
                        }}
                        className="mt-2 text-xs text-brand-400 hover:text-brand-300 font-medium cursor-pointer"
                      >
                        + Create one
                      </button>
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const isOverdue =
                        task.due_date &&
                        new Date(task.due_date).getTime() < Date.now() &&
                        task.status !== "COMPLETED";

                      const completedSubtasks = (task.subtasks || []).filter(
                        (s) => s.completed
                      ).length;
                      const totalSubtasks = (task.subtasks || []).length;

                      const nextStatus = getNextStatus(task.status);
                      const prevStatus = getPrevStatus(task.status);

                      return (
                        <div
                          key={task.id}
                          className="group relative rounded-xl bg-slate-900 border border-slate-800 hover:border-brand-500/40 p-3.5 shadow-sm hover:shadow-md transition-all space-y-2.5 cursor-pointer"
                          onClick={() => setSelectedTask(task)}
                        >
                          {/* Top Meta: Project & Priority */}
                          <div className="flex items-center justify-between text-[10px]">
                            {task.project ? (
                              <span
                                className="px-2 py-0.5 rounded font-semibold truncate max-w-[120px]"
                                style={{
                                  backgroundColor: `${task.project.color}20`,
                                  color: task.project.color,
                                }}
                              >
                                {task.project.name}
                              </span>
                            ) : (
                              <span className="text-slate-500">General</span>
                            )}

                            <span
                              className={`px-2 py-0.5 rounded border font-semibold ${getPriorityBadge(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>
                          </div>

                          {/* Title */}
                          <h4 className="text-xs font-semibold text-slate-100 leading-snug group-hover:text-brand-300 transition line-clamp-2">
                            {task.title}
                          </h4>

                          {/* Description excerpt */}
                          {task.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {/* Subtasks progress */}
                          {totalSubtasks > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-slate-400">
                                <span className="flex items-center space-x-1">
                                  <CheckSquare className="h-3 w-3 text-brand-400" />
                                  <span>Checklist</span>
                                </span>
                                <span className="font-mono">
                                  {completedSubtasks}/{totalSubtasks}
                                </span>
                              </div>
                              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                <div
                                  className="bg-brand-500 h-full rounded-full"
                                  style={{
                                    width: `${(completedSubtasks / totalSubtasks) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Labels */}
                          {task.labels && task.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {task.labels.slice(0, 3).map((lbl) => (
                                <span
                                  key={lbl}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400"
                                >
                                  #{lbl}
                                </span>
                              ))}
                              {task.labels.length > 3 && (
                                <span className="text-[9px] px-1 text-slate-500">
                                  +{task.labels.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Card Footer: Due Date, Assignee, Actions */}
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                            {/* Due date */}
                            {task.due_date ? (
                              <div
                                className={`flex items-center space-x-1 text-[10px] font-mono ${
                                  isOverdue
                                    ? "text-rose-400 font-bold"
                                    : "text-slate-400"
                                }`}
                              >
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {new Date(task.due_date).toLocaleDateString([], {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                                {isOverdue && <span>⚠️</span>}
                              </div>
                            ) : (
                              <div />
                            )}

                            {/* Assignee & Quick Move */}
                            <div className="flex items-center space-x-1.5">
                              {/* Quick Move Status Buttons (Prev / Next) */}
                              {prevStatus && (
                                <button
                                  type="button"
                                  title={`Move back to ${prevStatus}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveTaskStatus(task.id, prevStatus);
                                  }}
                                  className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                                >
                                  <ChevronLeft className="h-3 w-3" />
                                </button>
                              )}
                              {nextStatus && (
                                <button
                                  type="button"
                                  title={`Move forward to ${nextStatus}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveTaskStatus(task.id, nextStatus);
                                  }}
                                  className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                                >
                                  <ChevronRight className="h-3 w-3" />
                                </button>
                              )}

                              {/* Assignee Avatar */}
                              {task.assignee ? (
                                <div
                                  title={`Assigned to ${task.assignee.display_name}`}
                                  className="h-6 w-6 rounded-full bg-brand-600 text-white font-bold text-[10px] flex items-center justify-center border border-slate-700"
                                >
                                  {task.assignee.display_name[0]?.toUpperCase()}
                                </div>
                              ) : (
                                <div
                                  title="Unassigned"
                                  className="h-6 w-6 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center border border-dashed border-slate-700"
                                >
                                  <User className="h-3 w-3" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* Create Task Modal */}
      {createModalOpen && (
        <CreateTaskModal
          isOpen={createModalOpen}
          defaultStatus={createDefaultStatus}
          onClose={() => setCreateModalOpen(false)}
        />
      )}
    </div>
  );
}
