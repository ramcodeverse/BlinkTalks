import React, { useState } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore.ts";
import { useChatStore } from "../../store/chatStore.ts";
import { Meeting } from "../../../shared/types.ts";
import {
  Calendar as CalendarIcon,
  Plus,
  Video,
  Clock,
  Trash2,
  X,
  ExternalLink,
  CheckCircle2,
  Folder,
} from "lucide-react";

export default function CalendarMeetingsView() {
  const {
    meetings,
    tasks,
    projects,
    createMeeting,
    deleteMeeting,
  } = useWorkspaceStore();
  const { user } = useChatStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [link, setLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenModal = () => {
    setTitle("");
    setDescription("");
    setProjectId("");
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    setStartTime(now.toISOString().slice(0, 16));
    const later = new Date(now.getTime() + 3600000);
    setEndTime(later.toISOString().slice(0, 16));
    setLink("https://meet.google.com/new");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createMeeting({
        title: title.trim(),
        description: description.trim(),
        project_id: projectId || null,
        start_time: new Date(startTime).toISOString(),
        end_time: endTime ? new Date(endTime).toISOString() : null,
        link: link.trim() || null,
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to create meeting:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sort meetings chronologically
  const sortedMeetings = [...meetings].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  // Deadlines in the future
  const upcomingDeadlines = tasks
    .filter((t) => t.due_date && t.status !== "COMPLETED")
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto p-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2.5">
            <CalendarIcon className="h-6 w-6 text-emerald-400" />
            <span>Calendar, Meetings & Deadlines</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Keep track of standups, roadmap reviews, sprint kickoffs, and milestone targets.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-md shadow-emerald-500/20 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Schedule Meeting</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meetings List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Scheduled Video Syncs ({sortedMeetings.length})
          </h2>

          {sortedMeetings.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-800">
              <CalendarIcon className="mx-auto h-10 w-10 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400">No meetings currently scheduled.</p>
              <button
                onClick={handleOpenModal}
                className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
              >
                + Schedule one now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedMeetings.map((m) => {
                const start = new Date(m.start_time);
                const isToday =
                  start.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={m.id}
                    className={`p-5 rounded-2xl bg-slate-900 border transition-all space-y-3 ${
                      isToday
                        ? "border-emerald-500/40 shadow-lg shadow-emerald-500/5"
                        : "border-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          {isToday && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Today
                            </span>
                          )}
                          <h3 className="text-sm font-bold text-slate-100">
                            {m.title}
                          </h3>
                        </div>
                        {m.description && (
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {m.description}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => deleteMeeting(m.id)}
                        className="text-slate-500 hover:text-rose-400 transition p-1 cursor-pointer"
                        title="Delete Meeting"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center space-x-4 text-slate-400 font-mono text-[11px]">
                        <span className="flex items-center space-x-1">
                          <CalendarIcon className="h-3.5 w-3.5 text-slate-500" />
                          <span>
                            {start.toLocaleDateString([], {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3.5 w-3.5 text-slate-500" />
                          <span>
                            {start.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </span>
                      </div>

                      {m.link && (
                        <a
                          href={m.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm transition"
                        >
                          <Video className="h-3.5 w-3.5" />
                          <span>Join Video Meeting</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Deliverable Deadlines Sidebar (1 col) */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 h-fit">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 text-xs font-bold text-slate-200 uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4 text-brand-400" />
            <span>Upcoming Task Deadlines</span>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">
              No tasks with upcoming due dates.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-200 truncate max-w-[160px]">
                      {t.title}
                    </span>
                    <span className="text-amber-400 font-mono text-[10px] font-bold">
                      {new Date(t.due_date!).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  {t.project && (
                    <span
                      className="inline-block text-[9px] px-1.5 py-0.5 rounded font-medium"
                      style={{
                        backgroundColor: `${t.project.color}20`,
                        color: t.project.color,
                      }}
                    >
                      {t.project.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-emerald-400" />
                <span>Schedule New Meeting</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Sprint 14 Planning & Demo"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Agenda / Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Items to discuss..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Linked Project
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">No Project (General Sync)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Video Call Link (Google Meet, Zoom)
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-500/20 disabled:opacity-50 transition cursor-pointer"
                >
                  {isSubmitting ? "Scheduling..." : "Schedule Meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
