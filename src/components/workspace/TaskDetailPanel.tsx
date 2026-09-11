import React, { useState, useEffect } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore.ts";
import { useChatStore } from "../../store/chatStore.ts";
import { useToast } from "../Toast.tsx";
import { Task, TaskPriority, TaskStatus, SubtaskItem } from "../../../shared/types.ts";
import {
  X,
  Calendar,
  User,
  Folder,
  Tag,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Send,
  MessageSquare,
  CheckSquare,
  Square,
  Flag,
  AlertCircle,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

interface TaskDetailPanelProps {
  task: Task | null;
  onClose: () => void;
}

export default function TaskDetailPanel({ task, onClose }: TaskDetailPanelProps) {
  const {
    updateTask,
    deleteTask,
    moveTaskStatus,
    addTaskComment,
    projects,
    members,
  } = useWorkspaceStore();
  const { user } = useChatStore();
  const { addToast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [projectId, setProjectId] = useState<string>("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  
  // Subtasks
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Labels
  const [labels, setLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState("");

  // Comments
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when active task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setProjectId(task.project_id || "");
      setAssigneeId(task.assignee_id || "");
      setDueDate(
        task.due_date ? new Date(task.due_date).toISOString().split("T")[0] : ""
      );
      setSubtasks(task.subtasks || []);
      setLabels(task.labels || []);
    }
  }, [task]);

  if (!task) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        project_id: projectId || null,
        assignee_id: assigneeId || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        subtasks,
        labels,
      });
      addToast("Task updated successfully", "success");
    } catch (err) {
      console.error("Failed to update task:", err);
      addToast("Failed to save task changes", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    setStatus(newStatus);
    const prevStatus = task.status;
    await moveTaskStatus(task.id, newStatus);
    addToast(
      `Task status updated to ${newStatus.replace("_", " ")}`,
      "info",
      {
        label: "Undo",
        onClick: () => {
          moveTaskStatus(task.id, prevStatus);
          setStatus(prevStatus);
        },
      }
    );
  };

  const handleDelete = async () => {
    const taskBackup = { ...task };
    await deleteTask(task.id);
    onClose();
    addToast("Task deleted", "info", {
      label: "Undo",
      onClick: async () => {
        // Re-create task with previous data
        await useWorkspaceStore.getState().createTask(taskBackup);
        addToast("Task restored", "success");
      },
    });
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newItem: SubtaskItem = {
      id: Math.random().toString(36).substring(2, 9),
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    const updated = [...subtasks, newItem];
    setSubtasks(updated);
    setNewSubtaskTitle("");
    updateTask(task.id, { subtasks: updated });
  };

  const handleToggleSubtask = (subId: string) => {
    const updated = subtasks.map((s) =>
      s.id === subId ? { ...s, completed: !s.completed } : s
    );
    setSubtasks(updated);
    updateTask(task.id, { subtasks: updated });
  };

  const handleDeleteSubtask = (subId: string) => {
    const updated = subtasks.filter((s) => s.id !== subId);
    setSubtasks(updated);
    updateTask(task.id, { subtasks: updated });
  };

  const handleAddLabel = () => {
    if (!newLabel.trim()) return;
    const cleanLabel = newLabel.trim().toLowerCase();
    if (!labels.includes(cleanLabel)) {
      const updated = [...labels, cleanLabel];
      setLabels(updated);
      updateTask(task.id, { labels: updated });
    }
    setNewLabel("");
  };

  const handleRemoveLabel = (lbl: string) => {
    const updated = labels.filter((l) => l !== lbl);
    setLabels(updated);
    updateTask(task.id, { labels: updated });
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      await addTaskComment(task.id, commentText.trim());
      setCommentText("");
      addToast("Comment posted", "success");
    } catch (err) {
      console.error("Failed to post comment:", err);
      addToast("Failed to post comment", "error");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const completedSubtasksCount = subtasks.filter((s) => s.completed).length;

  return (
    <>
      {/* Backdrop for mobile or click-outside */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-[1px] z-40 lg:hidden transition-opacity"
      />

      {/* Sliding Task Detail Container */}
      <aside
        id="task-detail-panel"
        className="fixed top-0 bottom-0 right-0 w-full sm:w-[480px] lg:w-[460px] bg-slate-900 border-l border-slate-800 shadow-2xl z-40 flex flex-col overflow-hidden animate-panel-right select-none"
      >
        {/* Panel Header */}
        <div className="h-14 px-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-md shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              TASK-{task.id.slice(0, 6)}
            </span>
            <span className="text-xs text-slate-400">
              {task.project?.name || "No Project"}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={handleDelete}
              className="btn-interactive p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
              title="Delete Task"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="btn-interactive p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close Panel (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Editable Title */}
          <div className="space-y-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              placeholder="Task title..."
              className="w-full bg-transparent text-lg font-bold text-white tracking-tight border-b border-transparent focus:border-brand-500/50 focus:outline-none transition py-1"
            />
          </div>

          {/* Quick Properties Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
            {/* Status Selector */}
            <div className="space-y-1">
              <label className="text-slate-400 text-[11px] flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-500" />
                Status
              </label>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition cursor-pointer"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="BLOCKED">Blocked</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            {/* Priority Selector */}
            <div className="space-y-1">
              <label className="text-slate-400 text-[11px] flex items-center gap-1">
                <Flag className="h-3 w-3 text-slate-500" />
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value as TaskPriority);
                  updateTask(task.id, { priority: e.target.value as TaskPriority });
                }}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition cursor-pointer"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* Assignee */}
            <div className="space-y-1">
              <label className="text-slate-400 text-[11px] flex items-center gap-1">
                <User className="h-3 w-3 text-slate-500" />
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => {
                  setAssigneeId(e.target.value);
                  updateTask(task.id, { assignee_id: e.target.value || null });
                }}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition cursor-pointer"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.user.display_name} (@{m.user.username})
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div className="space-y-1">
              <label className="text-slate-400 text-[11px] flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-500" />
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  updateTask(task.id, {
                    due_date: e.target.value ? new Date(e.target.value).toISOString() : null,
                  });
                }}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition cursor-pointer"
              />
            </div>
          </div>

          {/* Project association */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Folder className="h-3.5 w-3.5 text-brand-400" />
              Project Initiative
            </label>
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                updateTask(task.id, { project_id: e.target.value || null });
              }}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition cursor-pointer"
            >
              <option value="">No Project Assigned</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.status})
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Description & Specifications
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSave}
              placeholder="Add technical context, deliverable criteria, or checklist instructions..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-brand-500/60 placeholder:text-slate-500 transition"
            />
          </div>

          {/* Subtasks Checklist */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <CheckSquare className="h-3.5 w-3.5 text-brand-400" />
                Checklist Subtasks
                {subtasks.length > 0 && (
                  <span className="text-[11px] text-slate-400 font-mono font-normal">
                    ({completedSubtasksCount}/{subtasks.length})
                  </span>
                )}
              </label>
            </div>

            {/* Checklist progress meter */}
            {subtasks.length > 0 && (
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-brand-500 h-full rounded-full progress-bar-smooth"
                  style={{
                    width: `${Math.round(
                      (completedSubtasksCount / subtasks.length) * 100
                    )}%`,
                  }}
                />
              </div>
            )}

            {/* Subtasks List */}
            <div className="space-y-1.5">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 hover:bg-slate-950 border border-slate-800/80 group transition"
                >
                  <button
                    onClick={() => handleToggleSubtask(st.id)}
                    className="flex items-center space-x-2.5 flex-1 min-w-0 text-left cursor-pointer"
                  >
                    {st.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 task-checkbox-check" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-500 shrink-0 task-checkbox-check hover:text-slate-300" />
                    )}
                    <span
                      className={`text-xs truncate transition ${
                        st.completed
                          ? "line-through text-slate-500"
                          : "text-slate-200"
                      }`}
                    >
                      {st.title}
                    </span>
                  </button>

                  <button
                    onClick={() => handleDeleteSubtask(st.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Subtask Input */}
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add checklist item..."
                className="flex-1 bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="btn-interactive px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Tags & Labels */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-brand-400" />
              Tags & Labels
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {labels.map((lbl) => (
                <span
                  key={lbl}
                  className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono flex items-center space-x-1"
                >
                  <span>#{lbl}</span>
                  <button
                    onClick={() => handleRemoveLabel(lbl)}
                    className="hover:text-rose-400 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}

              <div className="flex items-center space-x-1">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddLabel();
                    }
                  }}
                  placeholder="new-tag"
                  className="w-20 bg-slate-950/60 border border-slate-800 rounded-md px-2 py-0.5 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-brand-500 transition"
                />
                <button
                  type="button"
                  onClick={handleAddLabel}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Discussion & Comments Activity */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-brand-400" />
              Comments & Activity ({task.comments?.length || 0})
            </label>

            {/* Comments Stream */}
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {(!task.comments || task.comments.length === 0) && (
                <p className="text-xs text-slate-500 italic py-2">
                  No comments yet. Start the conversation below.
                </p>
              )}

              {task.comments?.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1 animate-fade-in"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-brand-400">
                      {c.user?.display_name || "Team Member"}
                    </span>
                    <span className="text-slate-500 font-mono">
                      {new Date(c.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {c.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Comment composer */}
            <form onSubmit={handlePostComment} className="flex items-center space-x-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition placeholder:text-slate-600"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || isSubmittingComment}
                className="btn-interactive p-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-40 transition cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Panel Footer */}
        <div className="h-12 px-5 border-t border-slate-800 flex items-center justify-between bg-slate-950/90 text-xs shrink-0">
          <span className="text-slate-500 text-[11px]">
            {isSaving ? "Saving..." : "All changes saved ✓"}
          </span>
          <button
            onClick={onClose}
            className="btn-interactive px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </aside>
    </>
  );
}
