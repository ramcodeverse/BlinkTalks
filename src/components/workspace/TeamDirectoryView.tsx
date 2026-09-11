import React, { useState } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore.ts";
import { useChatStore } from "../../store/chatStore.ts";
import { WorkspaceRole } from "../../../shared/types.ts";
import {
  Users2,
  Copy,
  Check,
  MessageSquare,
  Shield,
  Crown,
  Briefcase,
  Building,
  UserPlus,
  Search,
  MoreVertical,
  Trash2,
} from "lucide-react";

interface TeamDirectoryViewProps {
  onStartDirectChat?: (userId: string) => void;
}

export default function TeamDirectoryView({ onStartDirectChat }: TeamDirectoryViewProps) {
  const {
    activeWorkspace,
    members,
    departments,
    updateMemberRole,
    removeMember,
    setActiveTab,
  } = useWorkspaceStore();
  const { user, startDirectChat, setActiveConversation } = useChatStore();

  const [selectedDept, setSelectedDept] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedInvite, setCopiedInvite] = useState(false);

  const handleCopyInvite = () => {
    if (!activeWorkspace?.invite_code) return;
    navigator.clipboard.writeText(activeWorkspace.invite_code);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const handleMessageMember = async (targetUserId: string) => {
    if (targetUserId === user?.id) return;
    try {
      const convId = await startDirectChat(targetUserId);
      setActiveConversation(convId);
      if (onStartDirectChat) {
        onStartDirectChat(targetUserId);
      }
    } catch (err) {
      console.error("Failed to start chat with member:", err);
    }
  };

  // Filter members
  const filteredMembers = members.filter((m) => {
    if (selectedDept !== "ALL" && m.department !== selectedDept) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.user.display_name.toLowerCase().includes(q);
      const matchUser = m.user.username.toLowerCase().includes(q);
      const matchJob = m.user.job_title?.toLowerCase().includes(q);
      if (!matchName && !matchUser && !matchJob) return false;
    }
    return true;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case "admin":
        return "bg-brand-500/15 text-brand-300 border-brand-500/30";
      case "manager":
        return "bg-purple-500/15 text-purple-300 border-purple-500/30";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto p-6 space-y-6">
      {/* Top Header & Invite Box */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2.5">
            <Users2 className="h-6 w-6 text-brand-400" />
            <span>Team & Member Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse workspace colleagues, roles, departments, and connect instantly.
          </p>
        </div>

        {/* Invite Code Share Card */}
        {activeWorkspace && (
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2">
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Workspace Invite Code
              </span>
              <span className="text-xs font-mono font-bold text-brand-300">
                {activeWorkspace.invite_code}
              </span>
            </div>
            <button
              onClick={handleCopyInvite}
              title="Copy invite code"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            >
              {copiedInvite ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Department Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedDept("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              selectedDept === "ALL"
                ? "bg-brand-600 text-white shadow-sm shadow-brand-500/20"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            All Departments ({members.length})
          </button>
          {departments.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDept(d.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedDept === d.name
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search colleagues..."
            className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 w-52"
          />
        </div>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredMembers.map((m) => {
          const isCurrentUser = m.user_id === user?.id;

          return (
            <div
              key={m.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white font-bold text-base flex items-center justify-center shadow-md">
                    {m.user.display_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-1.5">
                      <span>{m.user.display_name}</span>
                      {isCurrentUser && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                          You
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400">@{m.user.username}</p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getRoleBadge(
                    m.role
                  )}`}
                >
                  {m.role}
                </span>
              </div>

              {/* Title & Department */}
              <div className="space-y-1 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-slate-300 font-medium">
                    {m.user.job_title || "Team Contributor"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="h-3.5 w-3.5 text-slate-500" />
                  <span>{m.department || "General"}</span>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end">
                {!isCurrentUser && (
                  <button
                    onClick={() => handleMessageMember(m.user_id)}
                    className="px-3 py-1.5 rounded-xl bg-brand-600/15 hover:bg-brand-600/25 border border-brand-500/30 text-brand-300 hover:text-brand-200 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Direct Message</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
