import React, { useState } from "react";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  User,
  Plus,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface DemoTask {
  id: string;
  title: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  assignee: string;
  due: string;
  status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
  subtasks: string;
}

const INITIAL_TASKS: DemoTask[] = [
  {
    id: "t1",
    title: "Implement AES-256 chat payload encryption",
    priority: "HIGH",
    assignee: "Alex",
    due: "Tomorrow",
    status: "IN_REVIEW",
    subtasks: "3/3",
  },
  {
    id: "t2",
    title: "Add WebSocket reconnect state machine",
    priority: "HIGH",
    assignee: "Rahul",
    due: "In 2 days",
    status: "IN_PROGRESS",
    subtasks: "2/4",
  },
  {
    id: "t3",
    title: "Design team workspace settings drawer",
    priority: "MEDIUM",
    assignee: "Sarah",
    due: "Friday",
    status: "TODO",
    subtasks: "1/2",
  },
  {
    id: "t4",
    title: "Database schema migration for notes & docs",
    priority: "LOW",
    assignee: "Devon",
    due: "Next week",
    status: "DONE",
    subtasks: "2/2",
  },
];

export default function InteractiveKanbanPreview() {
  const [tasks, setTasks] = useState<DemoTask[]>(INITIAL_TASKS);

  const moveTask = (taskId: string, newStatus: DemoTask["status"]) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  const resetBoard = () => {
    setTasks(INITIAL_TASKS);
  };

  const columns = [
    { key: "TODO", label: "TO DO", color: "text-slate-400", border: "border-slate-800" },
    { key: "IN_PROGRESS", label: "IN PROGRESS", color: "text-blue-400", border: "border-blue-900/50" },
    { key: "IN_REVIEW", label: "IN REVIEW", color: "text-purple-400", border: "border-purple-900/50" },
    { key: "DONE", label: "DONE", color: "text-emerald-400", border: "border-emerald-900/50" },
  ];

  return (
    <div className="space-y-6">
      {/* Board Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <FolderKanban className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-white">Project: BlinkTalks Core Sprint</h4>
            <p className="text-[11px] text-slate-400">Interactive live board — click actions on cards to advance</p>
          </div>
        </div>

        <button
          onClick={resetBoard}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition cursor-pointer flex items-center space-x-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Board</span>
        </button>
      </div>

      {/* 4-Column Board Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);

          return (
            <div
              key={col.key}
              className={`rounded-2xl bg-slate-950/60 border ${col.border} p-3 flex flex-col min-h-[280px] space-y-3`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-1">
                <span className={`text-[11px] font-mono font-bold tracking-wider ${col.color}`}>
                  {col.label} ({colTasks.length})
                </span>
                <span className="h-2 w-2 rounded-full bg-slate-700" />
              </div>

              {/* Tasks List */}
              <div className="flex-1 space-y-2.5">
                {colTasks.length === 0 ? (
                  <div className="h-32 flex items-center justify-center border border-dashed border-slate-800/80 rounded-xl text-[11px] text-slate-600">
                    Drop items here
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isDone = task.status === "DONE";

                    return (
                      <div
                        key={task.id}
                        className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow-sm space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5
                            className={`text-xs font-semibold text-slate-200 leading-snug ${
                              isDone ? "line-through text-slate-500" : ""
                            }`}
                          >
                            {task.title}
                          </h5>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ${
                              task.priority === "HIGH"
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : task.priority === "MEDIUM"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/60">
                          <span className="flex items-center gap-1 font-medium text-slate-300">
                            <User className="h-3 w-3 text-cyan-400" /> {task.assignee}
                          </span>
                          <span className="font-mono text-slate-500">{task.subtasks} subtasks</span>
                        </div>

                        {/* Interactive Action Move Buttons */}
                        <div className="flex items-center justify-between pt-1 gap-1.5">
                          {task.status === "TODO" && (
                            <button
                              onClick={() => moveTask(task.id, "IN_PROGRESS")}
                              className="w-full py-1 rounded-lg bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 border border-blue-800/40 text-[10px] font-semibold transition cursor-pointer flex items-center justify-center gap-1"
                            >
                              <span>Start Task</span>
                              <ArrowRight className="h-2.5 w-2.5" />
                            </button>
                          )}
                          {task.status === "IN_PROGRESS" && (
                            <button
                              onClick={() => moveTask(task.id, "IN_REVIEW")}
                              className="w-full py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-800/40 text-[10px] font-semibold transition cursor-pointer flex items-center justify-center gap-1"
                            >
                              <span>Submit Review</span>
                              <ArrowRight className="h-2.5 w-2.5" />
                            </button>
                          )}
                          {task.status === "IN_REVIEW" && (
                            <button
                              onClick={() => moveTask(task.id, "DONE")}
                              className="w-full py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/40 text-[10px] font-semibold transition cursor-pointer flex items-center justify-center gap-1"
                            >
                              <span>Approve & Done</span>
                              <CheckCircle2 className="h-2.5 w-2.5" />
                            </button>
                          )}
                          {task.status === "DONE" && (
                            <span className="w-full py-1 text-center text-[10px] text-emerald-400 font-mono font-medium flex items-center justify-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Shipped</span>
                            </span>
                          )}
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
  );
}
