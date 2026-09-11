import React, { useState } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore.ts";
import { TaskPriority, TaskStatus, SubtaskItem } from "../../../shared/types.ts";
import {
  X,
  Calendar,
  User,
  Folder,
  Tag,
  Plus,
  Trash2,
  CheckSquare,
} from "lucide-react";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStatus?: TaskStatus;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  defaultStatus = "TODO",
}: CreateTaskModalProps) {
  const {
    createTask,
    projects,
    members,
    activeProject,
    taskModalPrefill,
    setTaskModalPrefill,
  } = useWorkspaceStore();

  const [title, setTitle] = useState(taskModalPrefill?.title || "");
  const [description, setDescription] = useState(taskModalPrefill?.description || "");
  const [status, setStatus] = useState<TaskStatus>(
    (taskModalPrefill?.status as TaskStatus) || defaultStatus
  );
  const [priority, setPriority] = useState<TaskPriority>(
    (taskModalPrefill?.priority as TaskPriority) || "MEDIUM"
  );
  const [projectId, setProjectId] = useState<string>(
    taskModalPrefill?.project_id || activeProject?.id || ""
  );
  const [assigneeId, setAssigneeId] = useState<string>(
    taskModalPrefill?.assignee_id || ""
  );
  const [dueDate, setDueDate] = useState<string>("");

  // Subtasks
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Labels
  const [labels, setLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createTask({
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
      setTaskModalPrefill(null);
      onClose();
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: "st-" + Date.now(),
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle("");
  };

  const handleAddLabel = () => {
    if (!newLabel.trim()) return;
    const clean = newLabel.trim().replace(/^#/, "");
    if (!labels.includes(clean)) {
      setLabels([...labels, clean]);
    }
    setNewLabel("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
            <CheckSquare className="h-5 w-5 text-brand-400" />
            <span>Create New Task</span>
          </h2>
          <button
            onClick={() => {
              setTaskModalPrefill(null);
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Implement dark mode toggle or Deploy staging server"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="BLOCKED">Blocked</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent ⚡</option>
              </select>
            </div>
          </div>

          {/* Project, Assignee, Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <option value="">No Project (General)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

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
                    {m.user.display_name}
                  </option>
                ))}
              </select>
            </div>

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
              Description & Specifications
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide background info, technical requirements, or steps to reproduce..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-y"
            />
          </div>

          {/* Initial Subtasks */}
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Checklist / Subtasks
            </label>
            {subtasks.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs"
                  >
                    <span className="text-slate-200">{st.title}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSubtasks(subtasks.filter((s) => s.id !== st.id))
                      }
                      className="text-slate-500 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSubtask())}
                placeholder="Add checklist item..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
              <Tag className="h-3.5 w-3.5 text-slate-400" />
              <span>Labels</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {labels.map((l) => (
                <span
                  key={l}
                  className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs"
                >
                  <span>#{l}</span>
                  <button
                    type="button"
                    onClick={() => setLabels(labels.filter((lb) => lb !== l))}
                    className="text-brand-400 hover:text-rose-400 cursor-pointer"
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
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddLabel())}
                placeholder="Add tag (e.g. Frontend, DevOps, Bug)..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={handleAddLabel}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tag</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setTaskModalPrefill(null);
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-500/20 disabled:opacity-50 transition cursor-pointer"
            >
              {isSubmitting ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
