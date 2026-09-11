import React, { useState } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore.ts";
import { useToast } from "../Toast.tsx";
import { Megaphone, X } from "lucide-react";

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateAnnouncementModal({ isOpen, onClose }: CreateAnnouncementModalProps) {
  const { createAnnouncement } = useWorkspaceStore();
  const { addToast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("normal");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await createAnnouncement(title.trim(), content.trim(), priority);
      addToast("Announcement published across workspace", "success");
      onClose();
    } catch (err) {
      console.error("Failed to post announcement:", err);
      addToast("Failed to post announcement", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4 animate-scale-up">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Megaphone className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight">Post Company Announcement</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-medium">Headline</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. All-Hands Workspace Sync & Release Notes"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-medium">Broadcast Level</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="normal">Normal Broadcast</option>
              <option value="important">Important (Team Alert)</option>
              <option value="urgent">Urgent (Immediate Action)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-medium">Announcement Body</label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Detailed communication, dates, links, and operational updates..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-brand-500 placeholder:text-slate-600"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="btn-interactive px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="btn-interactive px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs text-white font-semibold disabled:opacity-40 cursor-pointer shadow-md shadow-amber-500/20"
            >
              Publish Announcement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
