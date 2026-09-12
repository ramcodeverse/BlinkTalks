import React, { useEffect, useState } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore.ts";
import {
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  UserPlus,
  RefreshCw,
  Crown,
  Key,
  Clock,
  Filter,
} from "lucide-react";

export default function AuditLogView() {
  const { auditLogs, isLoadingAuditLogs, fetchAuditLogs } = useWorkspaceStore();
  const [selectedFilter, setSelectedFilter] = useState("ALL");

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const filteredLogs = auditLogs.filter((log) => {
    if (selectedFilter === "ALL") return true;
    if (selectedFilter === "INVITE" && log.action.includes("invite")) return true;
    if (selectedFilter === "ROLE" && (log.action.includes("role") || log.action.includes("ownership"))) return true;
    if (selectedFilter === "SUSPEND" && (log.action.includes("suspend") || log.action.includes("restore"))) return true;
    if (selectedFilter === "REMOVE" && log.action.includes("remove")) return true;
    return false;
  });

  const getActionBadge = (action: string) => {
    if (action.includes("suspend")) {
      return {
        icon: <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />,
        badge: "bg-rose-500/10 text-rose-300 border-rose-500/20",
      };
    }
    if (action.includes("restore")) {
      return {
        icon: <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />,
        badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
      };
    }
    if (action.includes("ownership")) {
      return {
        icon: <Crown className="h-3.5 w-3.5 text-amber-400" />,
        badge: "bg-amber-500/10 text-amber-300 border-amber-500/20",
      };
    }
    if (action.includes("invite")) {
      return {
        icon: <UserPlus className="h-3.5 w-3.5 text-brand-400" />,
        badge: "bg-brand-500/10 text-brand-300 border-brand-500/20",
      };
    }
    if (action.includes("remove")) {
      return {
        icon: <UserX className="h-3.5 w-3.5 text-rose-400" />,
        badge: "bg-rose-500/10 text-rose-300 border-rose-500/20",
      };
    }
    return {
      icon: <Key className="h-3.5 w-3.5 text-blue-400" />,
      badge: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    };
  };

  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
        <div className="flex items-center space-x-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-300">Filter Trail:</span>
          <div className="flex flex-wrap gap-1">
            {[
              { id: "ALL", label: "All Events" },
              { id: "INVITE", label: "Invitations" },
              { id: "ROLE", label: "Roles & Ownership" },
              { id: "SUSPEND", label: "Suspensions" },
              { id: "REMOVE", label: "Removals" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                  selectedFilter === f.id
                    ? "bg-brand-600 text-white"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => fetchAuditLogs()}
          disabled={isLoadingAuditLogs}
          className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer"
        >
          <RefreshCw className={`h-3 w-3 ${isLoadingAuditLogs ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Log Entries */}
      {isLoadingAuditLogs && auditLogs.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500">
          Loading audit logs...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
          No audit log records match the selected filter.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log) => {
            const { icon, badge } = getActionBadge(log.action);

            return (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between space-x-3 hover:border-slate-700 transition"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0 mt-0.5">
                    {icon}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-200">
                        {log.actor_name}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${badge}`}
                      >
                        {log.action.replace(/_/g, " ")}
                      </span>
                      {log.target_name && (
                        <span className="text-xs text-slate-300">
                          → <strong className="font-semibold">{log.target_name}</strong>
                        </span>
                      )}
                    </div>
                    {log.details && (
                      <p className="text-xs text-slate-400">{log.details}</p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center space-x-1 text-[11px] text-slate-500">
                  <Clock className="h-3 w-3" />
                  <span>{formatTimestamp(log.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
