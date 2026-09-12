import React, { useEffect, useState } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore.ts";
import { useChatStore } from "../../store/chatStore.ts";
import { WorkspaceMember, WorkspaceInvitation } from "../../../shared/types.ts";
import InviteModal from "./InviteModal.tsx";
import MemberWorkloadModal from "./MemberWorkloadModal.tsx";
import AuditLogView from "./AuditLogView.tsx";
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
  ShieldAlert,
  ShieldCheck,
  Clock,
  RotateCw,
  Ban,
  Activity,
  UserX,
  Sparkles,
  Link,
  ChevronDown,
  Layers,
  AlertCircle,
  FileText,
} from "lucide-react";

interface TeamDirectoryViewProps {
  onStartDirectChat?: (userId: string) => void;
}

export default function TeamDirectoryView({ onStartDirectChat }: TeamDirectoryViewProps) {
  const {
    activeWorkspace,
    members,
    departments,
    invitations,
    isLoadingMembers,
    isLoadingInvitations,
    fetchMembers,
    fetchInvitations,
    updateMemberRole,
    suspendMember,
    restoreMember,
    removeMemberWithReason,
    bulkRemoveMembers,
    bulkUpdateMemberRoles,
    transferOwnership,
    revokeInvitation,
    resendInvitation,
  } = useWorkspaceStore();

  const { user, startDirectChat, setActiveConversation, presence } = useChatStore();

  // Active view tab: "members" | "invitations" | "audit"
  const [viewTab, setViewTab] = useState<"members" | "invitations" | "audit">("members");

  // Filter & Search states
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteStatusFilter, setInviteStatusFilter] = useState("ALL");

  // Selection for bulk operations
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [bulkRole, setBulkRole] = useState("MEMBER");

  // Modals & action states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [workloadMember, setWorkloadMember] = useState<WorkspaceMember | null>(null);
  const [activeDropdownMemberId, setActiveDropdownMemberId] = useState<string | null>(null);

  // Transfer Ownership dialog
  const [transferTarget, setTransferTarget] = useState<WorkspaceMember | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  // Soft remove dialog
  const [removeTarget, setRemoveTarget] = useState<WorkspaceMember | null>(null);
  const [removalReason, setRemovalReason] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);

  // Suspend dialog
  const [suspendTarget, setSuspendTarget] = useState<WorkspaceMember | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [isSuspending, setIsSuspending] = useState(false);

  // Copy feedbacks
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedGeneralInvite, setCopiedGeneralInvite] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    fetchMembers();
    fetchInvitations();
  }, [fetchMembers, fetchInvitations]);

  // Current user's role in the active workspace
  const currentUserMember = members.find((m) => m.user_id === user?.id);
  const currentUserRole = currentUserMember?.role?.toLowerCase() || "member";
  const isOwner = currentUserRole === "owner";
  const isAdmin = isOwner || currentUserRole === "admin";
  const isManager = isAdmin || currentUserRole === "manager";

  const handleCopyGeneralInvite = () => {
    if (!activeWorkspace?.invite_code) return;
    navigator.clipboard.writeText(activeWorkspace.invite_code);
    setCopiedGeneralInvite(true);
    setTimeout(() => setCopiedGeneralInvite(false), 2500);
  };

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
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
      console.error("Failed to start direct chat:", err);
    }
  };

  // Filter members
  const filteredMembers = members.filter((m) => {
    if (selectedDept !== "ALL" && m.department !== selectedDept) {
      return false;
    }
    if (selectedStatus !== "ALL" && m.status !== selectedStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.user.display_name?.toLowerCase().includes(q);
      const matchUser = m.user.username?.toLowerCase().includes(q);
      const matchJob = m.user.job_title?.toLowerCase().includes(q);
      if (!matchName && !matchUser && !matchJob) return false;
    }
    return true;
  });

  // Filter invitations
  const filteredInvitations = invitations.filter((inv) => {
    if (inviteStatusFilter === "ALL") return true;
    return inv.status === inviteStatusFilter;
  });

  const pendingInvitesCount = invitations.filter((i) => i.status === "PENDING").length;

  // Bulk selection toggles
  const toggleSelectMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedMemberIds.length === filteredMembers.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(filteredMembers.map((m) => m.user_id));
    }
  };

  const handleBulkRoleApply = async () => {
    if (selectedMemberIds.length === 0) return;
    try {
      await bulkUpdateMemberRoles(selectedMemberIds, bulkRole);
      setSelectedMemberIds([]);
    } catch (err: any) {
      setActionError(err.message || "Failed to update member roles");
    }
  };

  const handleBulkRemoveApply = async () => {
    if (selectedMemberIds.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to remove ${selectedMemberIds.length} selected member(s) from this workspace?`
      )
    ) {
      return;
    }
    try {
      await bulkRemoveMembers(selectedMemberIds, "Bulk administrator removal");
      setSelectedMemberIds([]);
    } catch (err: any) {
      setActionError(err.message || "Failed to remove members");
    }
  };

  // Suspend action
  const confirmSuspend = async () => {
    if (!suspendTarget) return;
    setIsSuspending(true);
    setActionError("");
    try {
      await suspendMember(suspendTarget.user_id, suspendReason.trim() || undefined);
      setSuspendTarget(null);
      setSuspendReason("");
    } catch (err: any) {
      setActionError(err.message || "Failed to suspend member");
    } finally {
      setIsSuspending(false);
    }
  };

  // Soft remove action
  const confirmRemove = async () => {
    if (!removeTarget) return;
    setIsRemoving(true);
    setActionError("");
    try {
      await removeMemberWithReason(removeTarget.user_id, removalReason.trim() || undefined);
      setRemoveTarget(null);
      setRemovalReason("");
    } catch (err: any) {
      setActionError(err.message || "Failed to remove member");
    } finally {
      setIsRemoving(false);
    }
  };

  // Transfer ownership action
  const confirmTransferOwnership = async () => {
    if (!transferTarget) return;
    setIsTransferring(true);
    setActionError("");
    try {
      await transferOwnership(transferTarget.user_id);
      setTransferTarget(null);
    } catch (err: any) {
      setActionError(err.message || "Failed to transfer ownership");
    } finally {
      setIsTransferring(false);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role.toLowerCase()) {
      case "owner":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case "admin":
        return "bg-brand-500/15 text-brand-300 border-brand-500/30";
      case "manager":
        return "bg-purple-500/15 text-purple-300 border-purple-500/30";
      case "guest":
        return "bg-slate-800 text-slate-400 border-slate-700";
      default:
        return "bg-blue-500/10 text-blue-300 border-blue-500/20";
    }
  };

  const getInvitationBadgeStyle = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-brand-500/15 text-brand-300 border-brand-500/30";
      case "ACCEPTED":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
      case "REVOKED":
        return "bg-rose-500/15 text-rose-300 border-rose-500/30";
      case "EXPIRED":
        return "bg-slate-800 text-slate-400 border-slate-700";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto p-6 space-y-6">
      {/* Top Header & Workspace Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2.5">
            <Users2 className="h-6 w-6 text-brand-400" />
            <span>Team & Member Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Directory, roles, secure invite links, and activity audit for{" "}
            <span className="text-slate-200 font-semibold">{activeWorkspace?.name}</span>.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Invite Button */}
          {isAdmin && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-md shadow-brand-500/20 transition cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Invite Teammates</span>
            </button>
          )}

          {/* Quick Primary Invite Code */}
          {activeWorkspace && (
            <div className="hidden sm:flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
              <div className="text-left">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">
                  Workspace Code
                </span>
                <span className="text-xs font-mono font-bold text-brand-300">
                  {activeWorkspace.invite_code}
                </span>
              </div>
              <button
                onClick={handleCopyGeneralInvite}
                title="Copy primary invite code"
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              >
                {copiedGeneralInvite ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError("")}
            className="text-xs text-rose-300 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main View Tabs: Members | Pending Invites | Audit Trail */}
      <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 w-fit">
        <button
          onClick={() => setViewTab("members")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition cursor-pointer ${
            viewTab === "members"
              ? "bg-brand-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users2 className="h-4 w-4" />
          <span>Members ({members.length})</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setViewTab("invitations")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition cursor-pointer ${
              viewTab === "invitations"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Link className="h-4 w-4" />
            <span>Invitations</span>
            {pendingInvitesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-brand-400/20 text-brand-200 text-[10px] font-bold">
                {pendingInvitesCount}
              </span>
            )}
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => setViewTab("audit")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition cursor-pointer ${
              viewTab === "audit"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Audit Trail</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MEMBERS DIRECTORY VIEW */}
      {/* ========================================================================= */}
      {viewTab === "members" && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            {/* Left: Department & Status Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1 border-r border-slate-800 pr-3 mr-1">
                <button
                  onClick={() => setSelectedStatus("ALL")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedStatus === "ALL"
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  All Status
                </button>
                <button
                  onClick={() => setSelectedStatus("ACTIVE")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedStatus === "ACTIVE"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setSelectedStatus("SUSPENDED")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedStatus === "SUSPENDED"
                      ? "bg-rose-500/20 text-rose-300"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Suspended
                </button>
              </div>

              {/* Department Pills */}
              <button
                onClick={() => setSelectedDept("ALL")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedDept === "ALL"
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                All Depts
              </button>
              {departments.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDept(d.name)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedDept === d.name
                      ? "bg-brand-600 text-white shadow-sm"
                      : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>

            {/* Right: Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search colleagues..."
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 w-56"
              />
            </div>
          </div>

          {/* Bulk Action Bar (when 1+ selected) */}
          {isAdmin && selectedMemberIds.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-brand-950/40 border border-brand-500/30 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-brand-300">
                  {selectedMemberIds.length} member{selectedMemberIds.length > 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={() => setSelectedMemberIds([])}
                  className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                >
                  Clear
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={bulkRole}
                  onChange={(e) => setBulkRole(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
                >
                  <option value="MEMBER">Set as Member</option>
                  <option value="MANAGER">Set as Manager</option>
                  <option value="ADMIN">Set as Admin</option>
                  <option value="GUEST">Set as Guest</option>
                </select>
                <button
                  onClick={handleBulkRoleApply}
                  className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition cursor-pointer"
                >
                  Apply Role
                </button>
                <button
                  onClick={handleBulkRemoveApply}
                  className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove Selected</span>
                </button>
              </div>
            </div>
          )}

          {/* Select all bar */}
          {isAdmin && filteredMembers.length > 0 && (
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    selectedMemberIds.length > 0 &&
                    selectedMemberIds.length === filteredMembers.length
                  }
                  onChange={toggleSelectAll}
                  className="rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-0 cursor-pointer"
                />
                <span>Select all displayed members ({filteredMembers.length})</span>
              </label>
            </div>
          )}

          {/* Member Cards Grid */}
          {filteredMembers.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
              No team members match your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMembers.map((m) => {
                const isCurrentUser = m.user_id === user?.id;
                const isTargetOwner = m.role?.toLowerCase() === "owner";
                const isSuspended = m.status === "SUSPENDED";
                const isSelected = selectedMemberIds.includes(m.user_id);
                const isOnline = presence[m.user_id]?.isOnline;

                return (
                  <div
                    key={m.user_id}
                    className={`rounded-2xl border p-5 space-y-4 transition relative ${
                      isSuspended
                        ? "bg-slate-900/60 border-rose-500/30 opacity-80"
                        : isSelected
                        ? "bg-slate-900 border-brand-500/60 shadow-md"
                        : "bg-slate-900 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3.5">
                        {/* Checkbox for bulk select */}
                        {isAdmin && !isCurrentUser && !isTargetOwner && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectMember(m.user_id)}
                            className="rounded border-slate-700 bg-slate-950 text-brand-600 focus:ring-0 cursor-pointer mt-0.5"
                          />
                        )}

                        {/* Avatar */}
                        <div className="relative">
                          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-700 to-indigo-500 text-white font-bold text-base flex items-center justify-center shadow-md">
                            {m.user.display_name?.[0]?.toUpperCase() || "U"}
                          </div>
                          {isOnline && (
                            <span
                              title="Online"
                              className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-900"
                            />
                          )}
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

                      {/* Status & Role Badges */}
                      <div className="flex flex-col items-end space-y-1">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getRoleBadgeStyle(
                            m.role
                          )}`}
                        >
                          {m.role}
                        </span>
                        {isSuspended && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Suspended
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title & Department */}
                    <div className="space-y-1 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center space-x-2">
                        <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                        <span className="text-slate-300 font-medium truncate">
                          {m.user.job_title || "Team Contributor"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Building className="h-3.5 w-3.5 text-slate-500" />
                        <span className="truncate">{m.department || "General"}</span>
                      </div>
                    </div>

                    {/* Suspension reason if applicable */}
                    {isSuspended && m.removal_reason && (
                      <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300">
                        Reason: {m.removal_reason}
                      </div>
                    )}

                    {/* Bottom Action Bar */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      {/* Workload button */}
                      <button
                        onClick={() => setWorkloadMember(m)}
                        className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center space-x-1 transition cursor-pointer"
                      >
                        <FileText className="h-3 w-3" />
                        <span>Workload</span>
                      </button>

                      <div className="flex items-center space-x-2">
                        {!isCurrentUser && (
                          <button
                            onClick={() => handleMessageMember(m.user_id)}
                            className="px-2.5 py-1.5 rounded-xl bg-brand-600/15 hover:bg-brand-600/25 border border-brand-500/30 text-brand-300 hover:text-brand-200 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>Message</span>
                          </button>
                        )}

                        {/* Admin Action Menu */}
                        {isAdmin && !isCurrentUser && !isTargetOwner && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdownMemberId(
                                  activeDropdownMemberId === m.user_id ? null : m.user_id
                                );
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {/* Dropdown Options */}
                            {activeDropdownMemberId === m.user_id && (
                              <>
                                <div
                                  className="fixed inset-0 z-20 cursor-default"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdownMemberId(null);
                                  }}
                                />
                                <div className="absolute right-0 bottom-full mb-1 w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1 z-30 space-y-0.5">
                                  {/* Role Changes */}
                                  <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-800">
                                    Change Role
                                  </div>
                                  {["MEMBER", "MANAGER", "ADMIN", "GUEST"].map((r) => (
                                    <button
                                      key={r}
                                      onClick={() => {
                                        updateMemberRole(m.user_id, r);
                                        setActiveDropdownMemberId(null);
                                      }}
                                      className={`w-full text-left px-3 py-1.5 text-xs transition cursor-pointer flex items-center justify-between ${
                                        m.role?.toUpperCase() === r
                                          ? "text-brand-400 font-semibold"
                                          : "text-slate-300 hover:bg-slate-800"
                                      }`}
                                    >
                                      <span>{r}</span>
                                      {m.role?.toUpperCase() === r && (
                                        <Check className="h-3 w-3 text-brand-400" />
                                      )}
                                    </button>
                                  ))}

                                  <div className="border-t border-slate-800 my-1" />

                                  {/* Suspend / Restore */}
                                  {isSuspended ? (
                                    <button
                                      onClick={() => {
                                        restoreMember(m.user_id);
                                        setActiveDropdownMemberId(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/10 flex items-center space-x-2 transition cursor-pointer"
                                    >
                                      <ShieldCheck className="h-3.5 w-3.5" />
                                      <span>Restore Member</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setSuspendTarget(m);
                                        setActiveDropdownMemberId(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-xs text-amber-400 hover:bg-amber-500/10 flex items-center space-x-2 transition cursor-pointer"
                                    >
                                      <ShieldAlert className="h-3.5 w-3.5" />
                                      <span>Suspend Member</span>
                                    </button>
                                  )}

                                  {/* Transfer Ownership (Owner only) */}
                                  {isOwner && (
                                    <button
                                      onClick={() => {
                                        setTransferTarget(m);
                                        setActiveDropdownMemberId(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-500/10 flex items-center space-x-2 transition cursor-pointer"
                                    >
                                      <Crown className="h-3.5 w-3.5" />
                                      <span>Transfer Ownership</span>
                                    </button>
                                  )}

                                  {/* Remove Member */}
                                  <button
                                    onClick={() => {
                                      setRemoveTarget(m);
                                      setActiveDropdownMemberId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2 transition cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Remove from Workspace</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INVITATIONS MANAGEMENT VIEW */}
      {/* ========================================================================= */}
      {viewTab === "invitations" && (
        <div className="space-y-4">
          {/* Top Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-400">Filter Status:</span>
              <div className="flex items-center space-x-1">
                {["ALL", "PENDING", "ACCEPTED", "REVOKED", "EXPIRED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setInviteStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      inviteStatusFilter === st
                        ? "bg-brand-600 text-white"
                        : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer shadow-sm shadow-brand-500/20"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Create New Invite</span>
            </button>
          </div>

          {/* Invitations List */}
          {isLoadingInvitations && invitations.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Loading invitations...
            </div>
          ) : filteredInvitations.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
              No invitations found matching the selected filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredInvitations.map((inv) => {
                const isPending = inv.status === "PENDING";
                const isExpired = inv.status === "EXPIRED";
                const isRevoked = inv.status === "REVOKED";

                const inviteUrl = `${window.location.origin}/#invite=${inv.invite_code}`;

                return (
                  <div
                    key={inv.id}
                    className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3.5 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-white tracking-wider bg-slate-950 px-2 py-1 rounded border border-slate-800">
                            {inv.invite_code}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getInvitationBadgeStyle(
                              inv.status
                            )}`}
                          >
                            {inv.status}
                          </span>
                        </div>
                        {inv.invited_email && (
                          <p className="text-xs text-brand-300 font-medium">
                            Target: {inv.invited_email}
                          </p>
                        )}
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getRoleBadgeStyle(
                          inv.role
                        )}`}
                      >
                        Grants {inv.role}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-800/80">
                      {inv.inviter && (
                        <p className="flex items-center space-x-1">
                          <span className="text-slate-500">Created by:</span>
                          <span className="text-slate-300 font-medium">
                            {inv.inviter.display_name} (@{inv.inviter.username})
                          </span>
                        </p>
                      )}
                      {inv.expires_at && (
                        <p className="flex items-center space-x-1 text-slate-500">
                          <Clock className="h-3 w-3 text-slate-500" />
                          <span>Expires: {new Date(inv.expires_at).toLocaleDateString()}</span>
                        </p>
                      )}
                    </div>

                    {/* Invitation Actions */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleCopyCode(inv.id, inv.invite_code)}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-medium flex items-center space-x-1 transition cursor-pointer"
                        >
                          {copiedCodeId === inv.id ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>{copiedCodeId === inv.id ? "Copied" : "Copy Code"}</span>
                        </button>

                        <button
                          onClick={() => handleCopyCode(`${inv.id}-url`, inviteUrl)}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-medium flex items-center space-x-1 transition cursor-pointer"
                        >
                          {copiedCodeId === `${inv.id}-url` ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Link className="h-3 w-3" />
                          )}
                          <span>{copiedCodeId === `${inv.id}-url` ? "Link Copied" : "Copy Link"}</span>
                        </button>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center space-x-1.5">
                          {(isPending || isExpired) && (
                            <button
                              onClick={() => resendInvitation(inv.id)}
                              title="Renew / Resend invitation (+7 days)"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                            >
                              <RotateCw className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {isPending && (
                            <button
                              onClick={() => revokeInvitation(inv.id)}
                              title="Revoke this invite code"
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AUDIT TRAIL VIEW */}
      {/* ========================================================================= */}
      {viewTab === "audit" && <AuditLogView />}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Invite Modal */}
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSwitchToPending={() => {
          setIsInviteModalOpen(false);
          setViewTab("invitations");
        }}
      />

      {/* Member Workload Modal */}
      <MemberWorkloadModal
        member={workloadMember}
        isOpen={!!workloadMember}
        onClose={() => setWorkloadMember(null)}
      />

      {/* Suspend Confirmation Dialog */}
      {suspendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-amber-400">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-base font-bold text-white">Suspend Team Member</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to suspend{" "}
              <strong className="text-white">{suspendTarget.user.display_name}</strong> (@{suspendTarget.user.username})?
              Suspended members cannot view workspace tasks, files, or messages until restored.
            </p>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Reason for suspension (optional)
              </label>
              <input
                type="text"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g. Leave of absence, policy violation..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSuspendTarget(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSuspending}
                onClick={confirmSuspend}
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-500/20 disabled:opacity-50 transition cursor-pointer"
              >
                {isSuspending ? "Suspending..." : "Confirm Suspension"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Dialog */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <UserX className="h-6 w-6" />
              <h3 className="text-base font-bold text-white">Remove Team Member</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to remove{" "}
              <strong className="text-white">{removeTarget.user.display_name}</strong> (@{removeTarget.user.username})
              from this workspace? Their task history will be preserved.
            </p>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Removal reason (optional)
              </label>
              <input
                type="text"
                value={removalReason}
                onChange={(e) => setRemovalReason(e.target.value)}
                placeholder="e.g. Project reassignment, role deprecation..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRemoveTarget(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRemoving}
                onClick={confirmRemove}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-500/20 disabled:opacity-50 transition cursor-pointer"
              >
                {isRemoving ? "Removing..." : "Remove Member"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Ownership Confirmation Dialog */}
      {transferTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-amber-500/30 bg-slate-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-amber-400">
              <Crown className="h-6 w-6" />
              <h3 className="text-base font-bold text-white">Transfer Workspace Ownership</h3>
            </div>
            <p className="text-xs text-slate-300">
              You are about to transfer Primary Ownership of{" "}
              <strong className="text-white">{activeWorkspace?.name}</strong> to{" "}
              <strong className="text-white">{transferTarget.user.display_name}</strong> (@{transferTarget.user.username}).
            </p>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              ⚠️ You will become an Administrator and will no longer have exclusive ownership over workspace deletion and ownership reassignment.
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setTransferTarget(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isTransferring}
                onClick={confirmTransferOwnership}
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-500/20 disabled:opacity-50 transition cursor-pointer"
              >
                {isTransferring ? "Transferring..." : "Confirm Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
