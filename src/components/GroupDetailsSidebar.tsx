import React, { useState, useEffect } from "react";
import { useChatStore } from "../store/chatStore.ts";
import { 
  X, 
  Users, 
  Shield, 
  Edit2, 
  Check, 
  LogOut, 
  Trash2, 
  Copy, 
  Globe, 
  Lock, 
  Loader2, 
  Info,
  UserMinus
} from "lucide-react";

interface GroupDetailsSidebarProps {
  conversation: any;
  onClose: () => void;
}

export default function GroupDetailsSidebar({ conversation, onClose }: GroupDetailsSidebarProps) {
  const { token, user, leaveGroupChat, deleteGroupChat, renameGroupChat } = useChatStore();

  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(conversation.name);
  const [renaming, setRenaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  const isAdmin = conversation.role === "admin";

  // 1. Fetch group members
  useEffect(() => {
    let active = true;
    const fetchMembers = async () => {
      if (!token) return;
      setLoadingMembers(true);
      setError(null);
      try {
        const res = await fetch(`/api/conversations/${conversation.id}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load group members.");
        if (active) {
          setMembers(data.members || []);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || "Failed to load members.");
        }
      } finally {
        if (active) {
          setLoadingMembers(false);
        }
      }
    };

    fetchMembers();
    return () => {
      active = false;
    };
  }, [conversation.id, token]);

  // Handle remove member
  const handleRemoveMember = async (memberId: string) => {
    if (!token) return;
    setError(null);
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/members/${memberId}/remove`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove member.");
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err: any) {
      setError(err.message || "Failed to remove member.");
    }
  };

  // 2. Handle group rename
  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newName.trim() === conversation.name) {
      setEditingName(false);
      return;
    }

    setRenaming(true);
    setError(null);
    try {
      await renameGroupChat(conversation.id, newName.trim());
      setEditingName(false);
    } catch (err: any) {
      setError(err.message || "Failed to rename group.");
    } finally {
      setRenaming(false);
    }
  };

  // 3. Handle leave group
  const handleLeave = async () => {
    setSubmittingAction(true);
    setError(null);
    try {
      await leaveGroupChat(conversation.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to leave group.");
      setSubmittingAction(false);
      setShowLeaveConfirm(false);
    }
  };

  // 4. Handle delete group
  const handleDelete = async () => {
    setSubmittingAction(true);
    setError(null);
    try {
      await deleteGroupChat(conversation.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete group.");
      setSubmittingAction(false);
      setShowDeleteConfirm(false);
    }
  };

  // 5. Copy invite code
  const copyInviteCode = () => {
    if (!conversation.invite_code) return;
    navigator.clipboard.writeText(conversation.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="group-details-sidebar" className="w-80 border-l border-slate-800 bg-slate-900/95 backdrop-blur-sm h-full flex flex-col text-slate-100 animate-slide-in relative flex-shrink-0">
      
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center space-x-2 text-brand-400">
          <Users className="h-4.5 w-4.5" />
          <span className="font-display font-bold text-sm text-white">Group Administration</span>
        </div>
        <button
          id="close-group-sidebar-btn"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Status Error Banner */}
        {error && (
          <div className="rounded-lg border border-red-950 bg-red-950/20 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Group Hero Info card */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-950/40 rounded-2xl border border-slate-800/60 text-center">
          <div className="h-16 w-16 rounded-2xl bg-brand-600/20 text-brand-400 border border-brand-500/10 flex items-center justify-center font-display font-bold text-2xl mb-3">
            {conversation.name.charAt(0).toUpperCase()}
          </div>

          {editingName ? (
            <form onSubmit={handleRename} className="w-full flex items-center space-x-1.5 mt-1">
              <input
                id="rename-group-input"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={renaming}
                required
                className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Group Name"
              />
              <button
                id="save-group-name-btn"
                type="submit"
                disabled={renaming}
                className="rounded-lg p-1.5 bg-brand-600 hover:bg-brand-500 text-white transition disabled:opacity-50 cursor-pointer"
              >
                {renaming ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewName(conversation.name);
                  setEditingName(false);
                }}
                className="rounded-lg p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 transition cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </form>
          ) : (
            <div className="flex items-center space-x-1.5 max-w-full">
              <h4 className="font-semibold text-white text-base truncate" title={conversation.name}>
                {conversation.name}
              </h4>
              {isAdmin && (
                <button
                  id="trigger-rename-btn"
                  onClick={() => setEditingName(true)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                  title="Rename Group"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Type Badge */}
          <div className="flex items-center space-x-1.5 mt-2 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800 text-[10px] text-slate-400">
            {conversation.is_public ? (
              <>
                <Globe className="h-3 w-3 text-slate-500" />
                <span>Public Group</span>
              </>
            ) : (
              <>
                <Lock className="h-3 w-3 text-slate-500" />
                <span>Private Group</span>
              </>
            )}
          </div>
        </div>

        {/* Invite Code block */}
        {conversation.invite_code && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Invite Code</span>
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 font-mono text-xs">
              <span className="text-brand-400 font-semibold select-all">{conversation.invite_code}</span>
              <button
                id="copy-invite-code-btn"
                onClick={copyInviteCode}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                title="Copy Invite Code"
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Members Present ({members.length})
            </span>
            {loadingMembers && <Loader2 className="h-3 w-3 text-slate-400 animate-spin" />}
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {members.map((member) => (
              <div 
                key={member.id} 
                className="flex items-center justify-between p-2 rounded-xl bg-slate-950/20 border border-slate-800/40 hover:border-slate-800 transition"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-brand-600 flex-shrink-0 flex items-center justify-center font-display font-bold text-white text-xs">
                    {member.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-white block truncate" title={member.display_name}>
                      {member.display_name}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">@{member.username}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  {member.role === "admin" && (
                    <div className="flex items-center space-x-1 bg-brand-500/10 text-brand-400 px-1.5 py-0.5 rounded border border-brand-500/20 text-[9px] font-bold uppercase tracking-wide">
                      <Shield className="h-2.5 w-2.5" />
                      <span>Creator</span>
                    </div>
                  )}

                  {isAdmin && member.id !== user?.id && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-1.5 rounded hover:bg-red-950/40 hover:text-red-400 text-slate-500 transition cursor-pointer"
                      title="Remove Member"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {members.length === 0 && !loadingMembers && (
              <p className="text-[11px] text-slate-500 italic text-center py-2">No other members inside this group.</p>
            )}
          </div>
        </div>

        {/* Administration Danger actions */}
        <div className="border-t border-slate-800 pt-4 space-y-3">
          
          {/* Leave group option */}
          {showLeaveConfirm ? (
            <div className="rounded-xl border border-red-950 bg-red-950/20 p-3 space-y-2.5 text-xs animate-fade-in">
              <span className="font-bold text-red-400 block">⚠️ Exit group channel?</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Are you sure you want to exit? You won't receive messages here unless you are invited back or join using code.
              </p>
              <div className="flex space-x-2">
                <button
                  id="confirm-leave-group-btn"
                  onClick={handleLeave}
                  disabled={submittingAction}
                  className="flex-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold py-1.5 text-xs cursor-pointer flex items-center justify-center space-x-1"
                >
                  {submittingAction ? <Loader2 className="h-3 w-3 animate-spin" /> : <span>Yes, Leave</span>}
                </button>
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  disabled={submittingAction}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              id="leave-group-btn"
              onClick={() => setShowLeaveConfirm(true)}
              className="flex w-full items-center justify-center space-x-2 rounded-xl bg-slate-950/40 hover:bg-red-950/10 hover:text-red-400 border border-slate-800/60 hover:border-red-900/30 py-2 text-xs font-semibold text-slate-300 transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Exit Group Channel</span>
            </button>
          )}

          {/* Delete group (strictly creator/admin only) */}
          {isAdmin && (
            <>
              {showDeleteConfirm ? (
                <div className="rounded-xl border border-red-950 bg-red-950/30 p-3 space-y-2.5 text-xs animate-fade-in">
                  <span className="font-bold text-red-400 block">🚨 Delete Group permanently?</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    This is an irreversible system action. It will delete all stored message history and sever everyone's active membership.
                  </p>
                  <div className="flex space-x-2">
                    <button
                      id="confirm-delete-group-btn"
                      onClick={handleDelete}
                      disabled={submittingAction}
                      className="flex-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold py-1.5 text-xs cursor-pointer flex items-center justify-center space-x-1"
                    >
                      {submittingAction ? <Loader2 className="h-3 w-3 animate-spin" /> : <span>Yes, Delete</span>}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={submittingAction}
                      className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  id="delete-group-btn"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex w-full items-center justify-center space-x-2 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 py-2 text-xs font-semibold transition cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Group (Admin)</span>
                </button>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
}
