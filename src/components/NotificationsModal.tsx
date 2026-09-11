import React from "react";
import { useChatStore } from "../store/chatStore.ts";
import { Bell, X, Check, MessageSquare, Shield, Users, ArrowRight } from "lucide-react";

interface NotificationsModalProps {
  onClose: () => void;
}

export default function NotificationsModal({ onClose }: NotificationsModalProps) {
  const { conversations, setActiveConversation } = useChatStore();

  // Find conversations with unread counts or pending message requests
  const pendingRequests = conversations.filter((c) => c.is_accepted === false && !c.is_blocked);
  const unreadChats = conversations.filter((c) => (c.unread_count || 0) > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-xl bg-brand-600/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">Notifications</h3>
              <p className="text-xs text-slate-400">Activity and incoming requests</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {pendingRequests.length === 0 && unreadChats.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-slate-800/80 border border-slate-700/50 mx-auto flex items-center justify-center text-slate-500">
                <Check className="h-6 w-6 text-emerald-400" />
              </div>
              <p className="font-semibold text-sm text-slate-200">All caught up!</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                You have no pending direct message requests or unread notifications at this time.
              </p>
            </div>
          ) : (
            <>
              {/* Pending Requests Section */}
              {pendingRequests.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                    Pending Direct Requests ({pendingRequests.length})
                  </span>
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      onClick={() => {
                        setActiveConversation(req.id);
                        onClose();
                      }}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/20 hover:border-amber-500/40 cursor-pointer transition group"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
                          {req.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{req.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {req.last_message?.content || "Sent you a message request"}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              {/* Unread Conversations Section */}
              {unreadChats.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
                    Unread Messages ({unreadChats.length})
                  </span>
                  {unreadChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => {
                        setActiveConversation(chat.id);
                        onClose();
                      }}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer transition group"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center text-xs font-bold shrink-0">
                          {chat.type === "group" ? <Users className="h-4 w-4" /> : chat.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{chat.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {chat.last_message?.content || "New unread activity"}
                          </p>
                        </div>
                      </div>
                      <span className="h-5 min-w-5 px-1.5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {chat.unread_count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* System status notification card */}
          <div className="mt-4 p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>Gateway Socket: Secure Encrypted Sync</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">ONLINE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
