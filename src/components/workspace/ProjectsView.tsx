import React, { useState } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore.ts";
import { Project, ProjectStatus, TaskPriority } from "../../../shared/types.ts";
import {
  Folder,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MoreVertical,
  Trash2,
  Edit,
  ExternalLink,
  Kanban,
  X,
} from "lucide-react";

export default function ProjectsView() {
  const {
    projects,
    createProject,
    updateProject,
    deleteProject,
    setActiveProject,
    setActiveTab,
    isLoadingProjects,
  } = useWorkspaceStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [priority, setPriority] = useState<TaskPriority>("HIGH");
  const [status, setStatus] = useState<ProjectStatus>("Active");
  const [dueDate, setDueDate] = useState("");

  const handleOpenCreate = () => {
    setName("");
    setDescription("");
    setColor("#3b82f6");
    setPriority("HIGH");
    setStatus("Active");
    setDueDate("");
    setEditingProject(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (p: Project) => {
    setEditingProject(p);
    setName(p.name);
    setDescription(p.description || "");
    setColor(p.color);
    setPriority(p.priority);
    setStatus(p.status);
    setDueDate(p.due_date ? new Date(p.due_date).toISOString().split("T")[0] : "");
    setIsCreateModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingProject) {
      await updateProject(editingProject.id, {
        name: name.trim(),
        description: description.trim(),
        color,
        priority,
        status,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      });
    } else {
      await createProject({
        name: name.trim(),
        description: description.trim(),
        color,
        priority,
        status,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      });
    }
    setIsCreateModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this project and all its associated tasks?")) {
      await deleteProject(id);
    }
  };

  const PRESET_COLORS = [
    "#3b82f6", // Blue
    "#8b5cf6", // Purple
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ef4444", // Rose
    "#06b6d4", // Cyan
    "#ec4899", // Pink
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto p-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2.5">
            <Folder className="h-6 w-6 text-brand-400" />
            <span>Workspace Projects</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize roadmaps, sprint deliverables, milestones, and cross-functional teams.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-md shadow-brand-500/20 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-2xl max-w-lg mx-auto">
          <Folder className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No projects yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Create your first project to track roadmaps, milestones, and tasks.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition cursor-pointer"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((proj) => {
            const completionPercent = proj.completion_percentage || 0;

            return (
              <div
                key={proj.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                {/* Top Section */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white shadow-inner"
                        style={{ backgroundColor: proj.color }}
                      >
                        <Folder className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100 line-clamp-1">
                          {proj.name}
                        </h3>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-[10px] uppercase font-semibold text-slate-400">
                            {proj.status}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-[10px] font-semibold text-amber-400">
                            {proj.priority} Priority
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(proj)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        title="Edit Project"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(proj.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {proj.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {proj.description}
                    </p>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Task Progress</span>
                    <span className="font-mono font-bold text-slate-200">
                      {completionPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${completionPercent}%`,
                        backgroundColor: proj.color,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>{proj.completed_tasks_count || 0} completed</span>
                    <span>{proj.tasks_count || 0} total tasks</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  {proj.due_date ? (
                    <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-mono">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        Due {new Date(proj.due_date).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  ) : (
                    <div />
                  )}

                  <button
                    onClick={() => {
                      setActiveProject(proj);
                      setActiveTab("kanban");
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Kanban className="h-3.5 w-3.5 text-brand-400" />
                    <span>View Board</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Folder className="h-5 w-5 text-brand-400" />
                <span>{editingProject ? "Edit Project" : "Create New Project"}</span>
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Mobile Redesign, Q4 Growth Sprint..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe project objectives and scope..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-y"
                />
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Theme Accent Color
                </label>
                <div className="flex items-center space-x-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-lg transition-transform cursor-pointer ${
                        color === c ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Priority & Status */}
              <div className="grid grid-cols-2 gap-3">
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

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Planning">Planning</option>
                    <option value="On_Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Target Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-500/20 transition cursor-pointer"
                >
                  {editingProject ? "Save Changes" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
