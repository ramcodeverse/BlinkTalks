import React, { useEffect, useState } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore.ts";
import { WorkspaceMember } from "../../../shared/types.ts";
import {
  X,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  CheckSquare,
  Building,
} from "lucide-react";

interface MemberWorkloadModalProps {
  member: WorkspaceMember | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MemberWorkloadModal({
  member,
  isOpen,
  onClose,
}: MemberWorkloadModalProps) {
  const { fetchMemberWorkload } = useWorkspaceStore();
  const [workload, setWorkload] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && member) {
      setIsLoading(true);
      fetchMemberWorkload(member.user_id)
        .then((data) => {
          setWorkload(data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load member workload:", err);
          setIsLoading(false);
        });
    } else {
      setWorkload(null);
    }
  }, [isOpen, member, fetchMemberWorkload]);

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden p-6 space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-bold text-lg flex items-center justify-center shadow-md">
              {member.user.display_name[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <span>{member.user.display_name}</span>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {member.role}
                </span>
              </h2>
              <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
                <span>@{member.user.username}</span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Building className="h-3 w-3 text-slate-500" />
                  <span>{member.department || "General"}</span>
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Loading member workload and assignments...
          </div>
        ) : workload ? (
          <div className="space-y-4 overflow-y-auto pr-1">
            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Assigned
                </span>
                <span className="text-lg font-extrabold text-white">
                  {workload.stats?.total_assigned ?? 0}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-500 block mb-1">
                  Active
                </span>
                <span className="text-lg font-extrabold text-amber-300">
                  {workload.stats?.in_progress ?? 0}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-500 block mb-1">
                  Done
                </span>
                <span className="text-lg font-extrabold text-emerald-400">
                  {workload.stats?.completed ?? 0}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-rose-500 block mb-1">
                  Overdue
                </span>
                <span className="text-lg font-extrabold text-rose-400">
                  {workload.stats?.overdue ?? 0}
                </span>
              </div>
            </div>

            {/* Active Projects */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
                <FolderKanban className="h-3.5 w-3.5 text-brand-400" />
                <span>Associated Projects</span>
              </h3>
              {workload.projects && workload.projects.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {workload.projects.map((p: any) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-2"
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: p.color || "#6366f1" }}
                      />
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {p.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No assigned projects yet.</p>
              )}
            </div>

            {/* Recent Tasks */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
                <CheckSquare className="h-3.5 w-3.5 text-brand-400" />
                <span>Recent Assigned Tasks</span>
              </h3>
              {workload.tasks && workload.tasks.length > 0 ? (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {workload.tasks.map((t: any) => (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="space-y-0.5 truncate mr-2">
                        <p className="text-xs font-medium text-slate-200 truncate">
                          {t.title}
                        </p>
                        <span className="text-[10px] text-slate-500">
                          {t.project?.name || "General"}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${
                          t.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : t.status === "IN_PROGRESS"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {t.status.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No tasks assigned.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            No workload data available for this member.
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
