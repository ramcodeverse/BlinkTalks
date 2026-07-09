import React, { useState, useEffect } from "react";
import { useChatStore } from "../store/chatStore.ts";
import {
  ShieldAlert,
  Users,
  Activity,
  MessageSquare,
  Search,
  Filter,
  UserMinus,
  Ban,
  UserCheck,
  Key,
  ShieldAlert as Trash,
  Lock,
  Globe,
  Trash2,
  FileText,
  X,
} from "lucide-react";

interface AdminDashboardProps {
  onClose: () => void;
}

export default function AdminDashboard({ onClose }: AdminDashboardProps) {
  const { token, user: currentUser } = useChatStore();

  // Metrics states
  const [metrics, setMetrics] = useState<any>({
    total_registered_ids: 0,
    live_active_connections: 0,
    total_messages: 0,
    total_groups: 0,
    public_groups: 0,
    private_groups: 0,
    total_direct_chats: 0,
    pending_message_requests: 0,
  });
  const [signupsOverTime, setSignupsOverTime] = useState<any[]>([]);
  const [messagesOverTime, setMessagesOverTime] = useState<any[]>([]);

  // User list states
  const [users, setUsers] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all"); // "all" | "suspended" | "admin"
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [userLimit] = useState(10);
  const [userSkip, setUserSkip] = useState(0);

  // Group oversight states
  const [groups, setGroups] = useState<any[]>([]);

  // Audit logs states
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Modal active states
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Active section state
  const [activeTab, setActiveTab] = useState<"users" | "groups" | "audit">("users");

  // Maintenance mode state
  const [maintActive, setMaintActive] = useState(false);
  const [maintTime, setMaintTime] = useState("");
  const [maintLoading, setMaintLoading] = useState(false);

  // Fetch current maintenance status
  const fetchMaintStatus = async () => {
    try {
      const res = await fetch("/api/maintenance/status");
      if (res.ok) {
        const data = await res.json();
        setMaintActive(data.active);
        setMaintTime(data.endTime || "");
      }
    } catch (err) {
      console.error("Failed to load maintenance status:", err);
    }
  };

  const handleSaveMaintenance = async () => {
    setMaintLoading(true);
    try {
      const res = await fetch("/api/maintenance/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          active: maintActive,
          endTime: maintTime.trim() || null,
        }),
      });
      if (res.ok) {
        alert("Maintenance settings updated successfully!");
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || "Failed to save"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Network error updating maintenance settings.");
    } finally {
      setMaintLoading(false);
    }
  };

  // Load Overview Metrics
  const loadOverview = async () => {
    try {
      const res = await fetch("/api/admin/overview", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setSignupsOverTime(data.signupsOverTime || []);
        setMessagesOverTime(data.messagesOverTime || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load User Registry Table
  const loadUserRegistry = async () => {
    try {
      const query = new URLSearchParams({
        search: userSearch,
        filterStatus: userFilter,
        sortBy,
        order: sortOrder,
        limit: userLimit.toString(),
        skip: userSkip.toString(),
      });
      const res = await fetch(`/api/admin/users?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalUsers(data.total);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load Public Groups Oversight
  const loadGroups = async () => {
    try {
      const res = await fetch("/api/admin/groups", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load Audit Trail Logs
  const loadAuditLogs = async () => {
    try {
      const res = await fetch("/api/admin/audit", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load everything on mount
  useEffect(() => {
    loadOverview();
    loadUserRegistry();
    loadGroups();
    loadAuditLogs();
    fetchMaintStatus();
  }, [userSearch, userFilter, sortBy, sortOrder, userSkip]);

  // View individual Profile card details
  const viewUserDetails = async (userId: string) => {
    setUserDetailLoading(true);
    setTempPassword(null);
    setShowDeleteConfirm(false);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedUser(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUserDetailLoading(false);
    }
  };

  // Admin Actions
  const handleSuspendToggle = async (userId: string, isCurrentlySuspended: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ suspend: !isCurrentlySuspended }),
      });
      if (res.ok) {
        // Reload detail context
        await viewUserDetails(userId);
        await loadUserRegistry();
        await loadAuditLogs();
        await loadOverview();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === "admin" ? "user" : "admin";
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: nextRole }),
      });
      if (res.ok) {
        await viewUserDetails(userId);
        await loadUserRegistry();
        await loadAuditLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTempPassword(data.tempPassword);
        await loadAuditLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSoftDelete = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/delete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSelectedUser(null);
        await loadUserRegistry();
        await loadAuditLogs();
        await loadOverview();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGroupUnlistToggle = async (groupId: string, isCurrentlyPublic: boolean) => {
    try {
      const res = await fetch(`/api/admin/groups/${groupId}/unlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ unlist: isCurrentlyPublic }),
      });
      if (res.ok) {
        await loadGroups();
        await loadAuditLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGroupDelete = async (groupId: string) => {
    try {
      const res = await fetch(`/api/admin/groups/${groupId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await loadGroups();
        await loadAuditLogs();
        await loadOverview();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="admin-governance-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-slate-100 overflow-y-auto">
      <div id="admin-portal" className="flex h-[90vh] w-full max-w-6xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl animate-fade-in relative">
        
        {/* Portal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/40 rounded-t-2xl">
          <div className="flex items-center space-x-3 text-brand-400">
            <ShieldAlert className="h-6 w-6" />
            <div>
              <h2 className="font-display text-lg font-bold text-white tracking-wide">Flat Identity Governance Console</h2>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Attributable Management System</p>
            </div>
          </div>
          <button
            id="close-admin-portal-btn"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Portal Body (Bento layout + Navigation tabs) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: Bento Analytics Sidebar & Controls navigation */}
          <div className="w-80 border-r border-slate-800 bg-slate-950/30 p-5 overflow-y-auto space-y-6">
            
            {/* Nav Tabs */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block px-1.5 mb-1.5">Directory Indexes</span>
              <button
                onClick={() => setActiveTab("users")}
                className={`flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-left text-xs font-semibold tracking-wide transition cursor-pointer ${
                  activeTab === "users" ? "bg-brand-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <Users className="h-4.5 w-4.5" />
                <span>Registered IDs Registry</span>
              </button>
              <button
                onClick={() => setActiveTab("groups")}
                className={`flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-left text-xs font-semibold tracking-wide transition cursor-pointer ${
                  activeTab === "groups" ? "bg-brand-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <MessageSquare className="h-4.5 w-4.5" />
                <span>Public Channels Oversight</span>
              </button>
              <button
                onClick={() => setActiveTab("audit")}
                className={`flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-left text-xs font-semibold tracking-wide transition cursor-pointer ${
                  activeTab === "audit" ? "bg-brand-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <FileText className="h-4.5 w-4.5" />
                <span>Audit Logs History</span>
              </button>
            </div>

            {/* bento metric blocks */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block px-1.5 mb-1">Live Metrics Engine</span>
              
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Registered IDs</span>
                  <span className="font-display font-bold text-white text-sm">{metrics.total_registered_ids}</span>
                </div>
                <Users className="h-4 w-4 text-brand-400" />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Live Sockets</span>
                  <span className="font-display font-bold text-green-400 text-sm">{metrics.live_active_connections}</span>
                </div>
                <Activity className="h-4 w-4 text-green-400 animate-pulse" />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Archived Content</span>
                  <span className="font-display font-bold text-white text-sm">{metrics.total_messages}</span>
                </div>
                <MessageSquare className="h-4 w-4 text-brand-400" />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Groups Created</span>
                  <span className="font-display font-bold text-white text-sm">
                    {metrics.total_groups} <span className="text-[10px] font-medium text-slate-500">({metrics.public_groups} pub, {metrics.private_groups} priv)</span>
                  </span>
                </div>
                <Users className="h-4 w-4 text-brand-400" />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Direct Chats</span>
                  <span className="font-display font-bold text-white text-sm">{metrics.total_direct_chats}</span>
                </div>
                <MessageSquare className="h-4 w-4 text-brand-400" />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Pending Requests</span>
                  <span className={`font-display font-bold text-sm ${metrics.pending_message_requests > 0 ? "text-amber-400" : "text-white"}`}>
                    {metrics.pending_message_requests}
                  </span>
                </div>
                <ShieldAlert className="h-4 w-4 text-amber-500" />
              </div>
            </div>

            {/* Custom SVG line-trend diagram mimicking message logs */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Relative Traffic Trend</span>
              <div className="h-16 flex items-end justify-between px-1 bg-slate-950 rounded-lg p-2 border border-slate-800">
                <div className="h-1/5 w-2 bg-brand-500/80 rounded" />
                <div className="h-2/5 w-2 bg-brand-500/80 rounded" />
                <div className="h-3/5 w-2 bg-brand-500/80 rounded" />
                <div className="h-2/5 w-2 bg-brand-500/80 rounded" />
                <div className="h-4/5 w-2 bg-brand-500/80 rounded animate-pulse" />
                <div className="h-full w-2 bg-brand-500 rounded animate-pulse" />
              </div>
              <p className="text-[9px] text-slate-500 leading-relaxed text-center">Real-time socket messaging load (24h period)</p>
            </div>

            {/* System Maintenance Controls */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">System Maintenance Controls</span>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-300 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maintActive}
                    onChange={(e) => setMaintActive(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-brand-600 focus:ring-brand-500 cursor-pointer h-4 w-4"
                  />
                  <span>Enable Maintenance Mode</span>
                </label>
                
                <p className="text-[10px] text-slate-500 leading-tight">
                  Activating maintenance blocks non-admin access immediately.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                  Expected Return Time (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., 2 Hours, 03:00 PM"
                  value={maintTime}
                  onChange={(e) => setMaintTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition"
                />
              </div>

              <button
                onClick={handleSaveMaintenance}
                disabled={maintLoading}
                className="w-full rounded-lg bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:text-slate-500 py-1.5 text-center text-xs font-semibold text-white tracking-wide shadow-md transition cursor-pointer"
              >
                {maintLoading ? "Applying Changes..." : "Apply Maintenance"}
              </button>
            </div>

          </div>

          {/* RIGHT: Content Viewboards */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            
            {/* TAB 1: Registered User Registry */}
            {activeTab === "users" && (
              <div className="space-y-6">
                
                {/* Search & filters controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/20 p-3.5 border border-slate-800 rounded-xl">
                  <div className="relative flex-1">
                    <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        setUserSkip(0);
                      }}
                      placeholder="Filter usernames/names..."
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pr-4 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <select
                      value={userFilter}
                      onChange={(e) => {
                        setUserFilter(e.target.value);
                        setUserSkip(0);
                      }}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="all">Show All IDs</option>
                      <option value="suspended">Suspended IDs</option>
                      <option value="admin">Administrators</option>
                    </select>
                  </div>
                </div>

                {/* Registry Table */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/30 overflow-hidden shadow-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                        <th className="p-4">Unique Identity</th>
                        <th className="p-4">Display Name</th>
                        <th className="p-4">Access Level</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Registered On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {users.map((u) => (
                        <tr
                          key={u.id}
                          onClick={() => viewUserDetails(u.id)}
                          className="hover:bg-slate-800/40 cursor-pointer transition"
                        >
                          <td className="p-4 font-mono font-bold text-brand-400">@{u.username}</td>
                          <td className="p-4 font-semibold text-white">{u.display_name}</td>
                          <td className="p-4 uppercase font-bold text-[10px] tracking-wide text-slate-400">{u.role}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              u.is_suspended ? "bg-red-950 text-red-400 border border-red-900/50" : "bg-green-950 text-green-400 border border-green-900/50"
                            }`}>
                              {u.is_suspended ? "SUSPENDED" : "ACTIVE"}
                            </span>
                          </td>
                          <td className="p-4 text-right text-slate-500 font-mono">{new Date(u.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cursor Pagination navigation */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 px-1">
                  <span>Showing {users.length} of {totalUsers} registered identities</span>
                  <div className="flex space-x-2">
                    <button
                      disabled={userSkip === 0}
                      onClick={() => setUserSkip(Math.max(0, userSkip - userLimit))}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 hover:bg-slate-700 disabled:opacity-40 font-semibold cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      disabled={userSkip + userLimit >= totalUsers}
                      onClick={() => setUserSkip(userSkip + userLimit)}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 hover:bg-slate-700 disabled:opacity-40 font-semibold cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: Public Groups Oversight */}
            {activeTab === "groups" && (
              <div className="space-y-4">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Public Channels Register</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groups.map((g) => (
                    <div key={g.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col justify-between space-y-4 shadow-lg">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-white flex items-center">
                            <Users className="h-4 w-4 mr-1.5 text-brand-400" />
                            {g.name}
                          </span>
                          <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                            g.is_public ? "bg-green-950 text-green-400 border border-green-900/30" : "bg-slate-950 text-slate-400 border border-slate-800"
                          }`}>
                            {g.is_public ? "PUBLIC" : "PRIVATE/UNLISTED"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">Member enrollment: {g.member_count} connections</p>
                        <p className="text-[10px] text-slate-500 font-mono">ID: {g.id}</p>
                      </div>

                      {/* Channel Oversight control buttons */}
                      <div className="flex space-x-2 border-t border-slate-800 pt-3">
                        <button
                          onClick={() => handleGroupUnlistToggle(g.id, g.is_public)}
                          className="flex-1 flex items-center justify-center space-x-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold py-2 border border-slate-700/50 cursor-pointer"
                        >
                          {g.is_public ? <Lock className="h-3.5 w-3.5 text-amber-400" /> : <Globe className="h-3.5 w-3.5 text-green-400" />}
                          <span>{g.is_public ? "Unlist channel" : "Publish channel"}</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Permanently delete group channel "${g.name}"? This wipes all histories.`)) {
                              handleGroupDelete(g.id);
                            }
                          }}
                          className="flex items-center justify-center rounded-lg bg-red-950/20 hover:bg-red-950/50 border border-red-900/30 text-red-400 p-2 cursor-pointer"
                          title="Permanently erase group"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {groups.length === 0 && (
                    <p className="text-center text-xs text-slate-500 py-10 col-span-2">No public channels found in registry.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Immutable Audit Trail */}
            {activeTab === "audit" && (
              <div className="space-y-4">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Immutable Accountability Logs</span>
                
                <div className="rounded-xl border border-slate-800 bg-slate-950/30 overflow-hidden shadow-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                        <th className="p-4">Administrator</th>
                        <th className="p-4">Event Type</th>
                        <th className="p-4">Log Details</th>
                        <th className="p-4 text-right">Executed At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 font-mono text-[11px]">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/20">
                          <td className="p-4 text-white">@{log.admin?.username}</td>
                          <td className="p-4">
                            <span className="font-bold text-brand-400 uppercase">{log.action}</span>
                          </td>
                          <td className="p-4 text-slate-300">{log.details}</td>
                          <td className="p-4 text-right text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {auditLogs.length === 0 && (
                    <p className="text-center text-xs text-slate-500 py-10">No governing actions logged yet.</p>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* SIDE-DRAWER PANEL: ID Profile activity cards */}
        {selectedUser && (
          <div id="id-detail-drawer" className="absolute top-0 right-0 bottom-0 w-96 border-l border-slate-800 bg-slate-950/95 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto z-10 animate-fade-in">
            <div className="space-y-6">
              
              {/* Profile Card Header */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Identity card</span>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {userDetailLoading ? (
                <p className="text-xs text-slate-500 animate-pulse">Loading identity detail context...</p>
              ) : (
                <div className="space-y-6">
                  
                  {/* Identity visual head */}
                  <div className="flex items-center space-x-3.5">
                    <div className="h-12 w-12 rounded-2xl bg-brand-600 flex items-center justify-center font-display font-bold text-white text-lg">
                      {selectedUser.profile.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm text-white truncate">{selectedUser.profile.display_name}</h4>
                      <p className="font-mono text-xs text-brand-400 truncate">@{selectedUser.profile.username}</p>
                    </div>
                  </div>

                  {/* Stats ledger */}
                  <div className="grid grid-cols-2 gap-3.5 bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">Connection status</span>
                      <span className={`text-xs font-semibold ${selectedUser.stats.is_online ? "text-green-400" : "text-slate-400"}`}>
                        {selectedUser.stats.is_online ? "ONLINE" : "OFFLINE"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">Archived messages</span>
                      <span className="text-xs font-semibold text-slate-200">{selectedUser.stats.message_count} messages</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">Channels enrolled</span>
                      <span className="text-xs font-semibold text-slate-200">{selectedUser.stats.group_count} channels</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">Access level</span>
                      <span className="text-xs font-bold text-slate-200 uppercase">{selectedUser.profile.role}</span>
                    </div>
                  </div>

                  {/* Profile info fields */}
                  <div className="space-y-3 bg-slate-900/40 p-4 border border-slate-800/50 rounded-xl text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider mb-0.5">Biographical info</span>
                      <p className="text-slate-300 italic">{selectedUser.profile.bio || "No biography provided."}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider mb-0.5">System Identifier (UUID)</span>
                      <p className="font-mono text-[10px] text-slate-500">{selectedUser.profile.id}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider mb-0.5">Registration date</span>
                      <p className="text-slate-400">{new Date(selectedUser.profile.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* ACTION TRIGGERS IN FOOTER */}
            {!userDetailLoading && selectedUser && (
              <div className="border-t border-slate-800 pt-5 mt-6 space-y-3.5">
                
                {/* Temporary Password Reset visual output */}
                {tempPassword && (
                  <div className="rounded-xl border border-amber-950 bg-amber-950/20 p-3.5 text-xs text-amber-400 space-y-1">
                    <span className="font-semibold block">Password Reset Key Generated</span>
                    <p className="text-[10px] text-slate-400 leading-relaxed">Provide this temporary credential to the owner securely:</p>
                    <span className="font-mono bg-slate-950 p-2 border border-slate-800 rounded text-center block select-all font-bold text-slate-100 my-1">{tempPassword}</span>
                  </div>
                )}

                {/* Confirm Soft-delete Panel */}
                {showDeleteConfirm ? (
                  <div className="rounded-xl border border-red-950 bg-red-950/20 p-4 space-y-3 text-xs animate-fade-in">
                    <span className="font-bold text-red-400 block">⚠️ Security confirmation</span>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      This soft-deletes/anonymizes the identity. Sensitive profile attributes are wiped, and their username is randomized and freed.
                      History blocks are retained as "Deleted Account" to avoid breaking active threads.
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSoftDelete(selectedUser.profile.id)}
                        className="flex-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold py-2 cursor-pointer"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-2 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    
                    {/* Secondary action tools */}
                    <div className="flex space-x-2">
                      <button
                        disabled={selectedUser.profile.id === currentUser?.id}
                        onClick={() => handleSuspendToggle(selectedUser.profile.id, selectedUser.profile.is_suspended)}
                        className={`flex-1 flex items-center justify-center space-x-1.5 rounded-xl border py-2.5 text-xs font-semibold cursor-pointer transition ${
                          selectedUser.profile.is_suspended
                            ? "bg-green-600/10 hover:bg-green-600/20 text-green-400 border-green-500/20"
                            : "bg-red-600/10 hover:bg-red-600/20 text-red-400 border-red-500/20"
                        } disabled:opacity-40`}
                      >
                        <Ban className="h-4 w-4" />
                        <span>{selectedUser.profile.is_suspended ? "Reinstate Account" : "Suspend ID"}</span>
                      </button>

                      <button
                        disabled={selectedUser.profile.id === currentUser?.id}
                        onClick={() => handleRoleToggle(selectedUser.profile.id, selectedUser.profile.role)}
                        className="flex-1 flex items-center justify-center space-x-1.5 rounded-xl border border-slate-800 hover:bg-slate-850 py-2.5 text-xs font-semibold cursor-pointer text-slate-300 disabled:opacity-40"
                      >
                        <ShieldAlert className="h-4 w-4" />
                        <span>{selectedUser.profile.role === "admin" ? "Demote Role" : "Promote Admin"}</span>
                      </button>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleResetPassword(selectedUser.profile.id)}
                        className="flex-1 flex items-center justify-center space-x-1.5 rounded-xl border border-slate-800 hover:bg-slate-850 py-2.5 text-xs font-semibold cursor-pointer text-slate-300"
                      >
                        <Key className="h-4 w-4" />
                        <span>Force password reset</span>
                      </button>

                      <button
                        disabled={selectedUser.profile.id === currentUser?.id}
                        onClick={() => setShowDeleteConfirm(true)}
                        className="rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 p-2.5 disabled:opacity-40 cursor-pointer"
                        title="Soft delete ID"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
