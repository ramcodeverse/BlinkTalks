import React, { useState } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore.ts";
import { useChatStore } from "../../store/chatStore.ts";
import { Task, TaskPriority, TaskStatus, SubtaskItem } from "../../../shared/types.ts";
import {
  X,
  Calendar,
  User,
  Folder,
  Tag,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Send,
  MessageSquare,
  CheckSquare,
  Square,
  Flag,
} from "lucide-react";

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

export default function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const {
    updateTask,
    deleteTask,
    addTaskComment,
    projects,
    members,
  } = useWorkspaceStore();
  const { user } = useChatStore();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [projectId, setProjectId] = useState<string>(task.project_id || "");
  const [assigneeId, setAssigneeId] = useState<string>(task.assignee_id || "");
  const [dueDate, setDueDate] = useState<string>(
    task.due_date ? new Date(task.due_date).toISOString().split("T")[0] : ""
  );
  
  // Subtasks
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Labels
  const [labels, setLabels] = useState<string[]>(task.labels || []);
  const [newLabel, setNewLabel] = useState("");

  // Comments
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
      onClose();
    } catch (err) {
      console.error("Failed to update task:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask(task.id);
      onClose();
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const updated: SubtaskItem[] = [
      ...subtasks,
      {
        id: "st-" + Date.now(),
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ];
    setSubtasks(updated);
    setNewSubtaskTitle("");
  };

  const toggleSubtask = (stId: string) => {
    const updated = subtasks.map((st) =>
      st.id === stId ? { ...st, completed: !st.completed } : st
    );
    setSubtasks(updated);
  };

  const removeSubtask = (stId: string) => {
    const updated = subtasks.filter((st) => st.id !== stId);
    setSubtasks(updated);
  };

  const handleAddLabel = () => {
    if (!newLabel.trim()) return;
    const clean = newLabel.trim().replace(/^#/, "");
    if (!labels.includes(clean)) {
      setLabels([...labels, clean]);
    }
    setNewLabel("");
  };

  const removeLabel = (label: string) => {
    setLabels(labels.filter((l) => l !== label));
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      await addTaskComment(task.id, commentText.trim());
      setCommentText("");
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "URGENT":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "HIGH":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "MEDIUM":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      default:
        return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  const completedSubtasksCount = subtasks.filter((s) => s.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border ${getPriorityColor(
                priority
              )}`}
            >
              {priority} Priority
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="BLOCKED">Blocked</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDelete}
              title="Delete Task"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title input */}
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task name or user story..."
              className="w-full text-lg font-semibold bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          {/* Key Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Project */}
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <Folder className="h-3.5 w-3.5 text-slate-400" />
                <span>Project</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                <option value="">No Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span>Assignee</span>
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
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
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Due Date</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Description & Acceptance Criteria
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, technical requirements, or links..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition resize-y"
            />
          </div>

          {/* Subtasks Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                <CheckSquare className="h-3.5 w-3.5 text-brand-400" />
                <span>Checklist & Subtasks</span>
                {subtasks.length > 0 && (
                  <span className="text-[11px] font-mono text-slate-400">
                    ({completedSubtasksCount}/{subtasks.length})
                  </span>
                )}
              </label>
            </div>

            {/* Progress bar */}
            {subtasks.length > 0 && (
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
                <div
                  className="bg-brand-500 h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${(completedSubtasksCount / subtasks.length) * 100}%`,
                  }}
                />
              </div>
            )}

            {/* Subtasks list */}
            <div className="space-y-1.5 mb-3">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between group bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 rounded-xl px-3 py-2 transition"
                >
                  <button
                    type="button"
                    onClick={() => toggleSubtask(st.id)}
                    className="flex items-center space-x-2.5 text-left flex-1 cursor-pointer"
                  >
                    {st.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-500 shrink-0" />
                    )}
                    <span
                      className={`text-xs ${
                        st.completed
                          ? "line-through text-slate-500"
                          : "text-slate-200"
                      }`}
                    >
                      {st.title}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSubtask(st.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition p-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add subtask input */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                placeholder="Add subtask item..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center space-x-1 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Labels & Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
              <Tag className="h-3.5 w-3.5 text-slate-400" />
              <span>Labels</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {labels.map((l) => (
                <span
                  key={l}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-medium"
                >
                  <span>#{l}</span>
                  <button
                    type="button"
                    onClick={() => removeLabel(l)}
                    className="text-brand-400 hover:text-rose-400 transition cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddLabel()}
                placeholder="Add tag (e.g. Frontend, API, Sprint 14)..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={handleAddLabel}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center space-x-1 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tag</span>
              </button>
            </div>
          </div>

          {/* Discussion & Activity Thread */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center space-x-2 mb-4">
              <MessageSquare className="h-4 w-4 text-brand-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Comments & Discussion ({task.comments?.length || 0})
              </h3>
            </div>

            {/* Comment List */}
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {(!task.comments || task.comments.length === 0) ? (
                <p className="text-xs text-slate-500 italic">
                  No comments yet. Start the conversation below.
                </p>
              ) : (
                task.comments.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-brand-300">
                        {c.user?.display_name || "Team Member"}
                      </span>
                      <span className="text-slate-500 font-mono">
                        {new Date(c.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap">
                      {c.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Write comment */}
            <form onSubmit={handleAddComment} className="flex items-center space-x-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write an update, question, or link..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || isSubmittingComment}
                className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white transition cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving || !title.trim()}
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-500/20 disabled:opacity-50 transition cursor-pointer"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
