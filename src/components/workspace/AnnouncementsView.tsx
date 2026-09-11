import React, { useState } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore.ts";
import { useChatStore } from "../../store/chatStore.ts";
import { Megaphone, Plus, Calendar, User, X, AlertTriangle } from "lucide-react";

export default function AnnouncementsView() {
  const { announcements, createAnnouncement } = useWorkspaceStore();
  const { user } = useChatStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createAnnouncement(title.trim(), content.trim(), priority);
      setTitle("");
      setContent("");
      setPriority("NORMAL");
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to post announcement:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "URGENT":
        return "bg-rose-500/15 text-rose-300 border-rose-500/30";
      case "HIGH":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      default:
        return "bg-blue-500/15 text-blue-300 border-blue-500/30";
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2.5">
            <Megaphone className="h-6 w-6 text-amber-400" />
            <span>Company Announcements</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Important broadcasts, release notices, all-hands agendas, and company updates.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-md shadow-amber-500/20 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Announcement</span>
        </button>
      </div>

      <div className="space-y-4 max-w-4xl">
        {announcements.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-2xl">
            <Megaphone className="mx-auto h-12 w-12 text-slate-600 mb-3" />
            <p className="text-xs text-slate-400">No announcements posted yet.</p>
          </div>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityBadge(
                      ann.priority
                    )}`}
                  >
                    {ann.priority} Priority
                  </span>
                  <h2 className="text-base font-bold text-slate-100">
                    {ann.title}
                  </h2>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(ann.created_at).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {ann.content}
              </p>

              <div className="pt-3 border-t border-slate-800/80 flex items-center space-x-2 text-xs text-slate-500">
                <User className="h-3.5 w-3.5" />
                <span>Posted by {ann.author?.display_name || "Workspace Admin"}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Megaphone className="h-5 w-5 text-amber-400" />
                <span>Broadcast Announcement</span>
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
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Release v2.4 Scheduled for Maintenance"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Urgency / Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent ⚡</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Content & Announcement Details *
                </label>
                <textarea
                  rows={5}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type full announcement..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-y"
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
                  disabled={isSubmitting || !title.trim() || !content.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-500/20 disabled:opacity-50 transition cursor-pointer"
                >
                  {isSubmitting ? "Posting..." : "Post Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
