import React, { useState } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore.ts";
import { Note } from "../../../shared/types.ts";
import {
  FileText,
  Plus,
  Pin,
  Trash2,
  Edit,
  X,
  Search,
  Check,
} from "lucide-react";

export default function NotesDocsView() {
  const { notes, createNote, updateNote, deleteNote } = useWorkspaceStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  const handleStartCreate = () => {
    setSelectedNote(null);
    setEditTitle("");
    setEditContent("");
    setIsPinned(false);
    setIsEditing(true);
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsPinned(note.is_pinned);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    if (selectedNote) {
      await updateNote(selectedNote.id, {
        title: editTitle.trim(),
        content: editContent,
        is_pinned: isPinned,
      });
      setIsEditing(false);
    } else {
      const created = await createNote(editTitle.trim(), editContent, isPinned);
      setSelectedNote(created);
      setIsEditing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this document?")) {
      await deleteNote(id);
      if (selectedNote?.id === id) {
        setSelectedNote(null);
        setIsEditing(false);
      }
    }
  };

  const filteredNotes = notes.filter((n) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.is_pinned);
  const otherNotes = filteredNotes.filter((n) => !n.is_pinned);

  return (
    <div className="flex-1 flex h-full bg-slate-950 overflow-hidden">
      {/* Sidebar List */}
      <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-900/40 shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <FileText className="h-4 w-4 text-brand-400" />
              <span>Workspace Docs</span>
            </h2>
            <button
              onClick={handleStartCreate}
              className="p-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition cursor-pointer"
              title="New Note"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Notes Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {notes.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              No notes yet. Click + to create one.
            </p>
          ) : (
            <>
              {pinnedNotes.length > 0 && (
                <div className="space-y-1 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 flex items-center space-x-1">
                    <Pin className="h-3 w-3" />
                    <span>Pinned</span>
                  </span>
                  {pinnedNotes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => handleSelectNote(note)}
                      className={`w-full text-left p-3 rounded-xl transition cursor-pointer ${
                        selectedNote?.id === note.id
                          ? "bg-brand-600/20 border border-brand-500/30 text-white"
                          : "bg-slate-900 hover:bg-slate-850 border border-slate-800/80 text-slate-300"
                      }`}
                    >
                      <h4 className="text-xs font-bold line-clamp-1">
                        {note.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                        {note.content || "Empty document"}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {otherNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={`w-full text-left p-3 rounded-xl transition cursor-pointer ${
                    selectedNote?.id === note.id
                      ? "bg-brand-600/20 border border-brand-500/30 text-white"
                      : "bg-slate-900 hover:bg-slate-850 border border-slate-800/80 text-slate-300"
                  }`}
                >
                  <h4 className="text-xs font-bold line-clamp-1">
                    {note.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    {note.content || "Empty document"}
                  </p>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
        {selectedNote || isEditing ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden p-6 space-y-4">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsPinned(!isPinned)}
                  className={`p-1.5 rounded-lg border transition cursor-pointer ${
                    isPinned
                      ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                  title={isPinned ? "Unpin document" : "Pin to top"}
                >
                  <Pin className="h-4 w-4" />
                </button>
                {selectedNote && !isEditing && (
                  <span className="text-xs text-slate-500 font-mono">
                    Last updated{" "}
                    {new Date(selectedNote.updated_at).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <button
                    onClick={handleSave}
                    disabled={!editTitle.trim()}
                    className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Save Note</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                )}

                {selectedNote && (
                  <button
                    onClick={() => handleDelete(selectedNote.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    title="Delete Note"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Note Body */}
            <div className="flex-1 flex flex-col space-y-4 overflow-y-auto">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Document Title..."
                    className="text-xl font-bold bg-transparent border-none text-slate-100 placeholder-slate-600 focus:outline-none"
                  />
                  <textarea
                    rows={18}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Write specifications, meeting summaries, engineering notes..."
                    className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 leading-relaxed resize-none"
                  />
                </>
              ) : (
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold text-slate-100">
                    {selectedNote?.title}
                  </h1>
                  <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
                    <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedNote?.content || "No content in this document."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div className="space-y-3 max-w-sm">
              <FileText className="mx-auto h-12 w-12 text-slate-700" />
              <h3 className="text-sm font-semibold text-slate-300">
                Select a document or create a new note
              </h3>
              <p className="text-xs text-slate-500">
                Draft meeting minutes, PRDs, sprint retrospective notes, and architecture diagrams.
              </p>
              <button
                onClick={handleStartCreate}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition cursor-pointer"
              >
                + New Document
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
