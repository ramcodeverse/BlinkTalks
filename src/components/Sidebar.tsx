import React, { useState, useEffect } from "react";
import { useChatStore, API_BASE, safeParseJson } from "../store/chatStore.ts";
import {
  Search,
  Plus,
  Users,
  UserPlus,
  LogOut,
  Hash,
  Crown,
  Lock,
  Globe,
  MessageSquare,
  UserCheck,
  UserX,
  Settings,
} from "lucide-react";

interface SidebarProps {
  onOpenAdmin: () => void;
  onOpenSettings: () => void;
}

export default function Sidebar({ onOpenAdmin, onOpenSettings }: SidebarProps) {
  const {
    user,
    logout,
    conversations,
    activeConversationId,
    setActiveConversation,
    typing,
    startDirectChat,
    createGroupChat,
    joinGroup,
    contacts,
    addContact,
    removeContact,
    connectionStatus,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ users: any[]; groups: any[] }>({ users: [], groups: [] });
  const [searching, setSearching] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupIsPublic, setGroupIsPublic] = useState(true);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [showContacts, setShowContacts] = [false, () => {}]; // legacy backup, to be removed shortly
  const [activeTab, setActiveTab] = useState<"chats" | "requests" | "contacts">("chats");
  const [error, setError] = useState<string | null>(null);

  // Debounced directory search pipeline
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults({ users: [], groups: [] });
      setSearching(false);
      return;
    }

    setSearching(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const token = localStorage.getItem("tg_token");
        const res = await fetch(`${API_BASE}/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await safeParseJson(res);
          setSearchResults(data);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createGroupChat(groupName, groupIsPublic);
      setGroupName("");
      setShowCreateGroup(false);
    } catch (err: any) {
      setError(err.message || "Failed to create channel");
    }
  };

  const handleJoinGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const convId = await joinGroup(joinCode.trim());
      setJoinCode("");
      setShowJoinGroup(false);
    } catch (err: any) {
      setError(err.message || "Failed to join channel");
    }
  };

  const handleUserResultClick = async (targetUserId: string) => {
    try {
      await startDirectChat(targetUserId);
      setSearchQuery(""); // Clear search
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="app-sidebar" className="flex h-full w-80 flex-col border-r border-slate-800 bg-slate-900 text-slate-100">
      
      {/* 1. Header Profile Box */}
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-600 font-display font-bold text-white">
            {user?.display_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-sm text-white" title={user?.display_name}>{user?.display_name}</h3>
            <p className="truncate text-xs text-slate-400 font-mono">@{user?.username}</p>
          </div>
        </div>
        
        {/* Connection status dot */}
        <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
          <div
            title={`Status: ${connectionStatus}`}
            className={`h-2.5 w-2.5 rounded-full ${
              connectionStatus === "connected"
                ? "bg-green-500"
                : connectionStatus === "reconnecting"
                ? "bg-amber-500 animate-ping"
                : "bg-red-500"
            }`}
          />
          <button
            id="sidebar-settings-btn"
            onClick={onOpenSettings}
            title="Settings"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <Settings className="h-4.5 w-4.5" />
          </button>
          <button
            id="sidebar-logout-btn"
            onClick={logout}
            title="Log Out"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* 2. Admin Badge Shortcut */}
      {user?.role === "admin" && (
        <div className="px-4 pt-3">
          <button
            id="open-admin-dashboard-btn"
            onClick={onOpenAdmin}
            className="flex w-full items-center justify-center space-x-2 rounded-xl bg-brand-600/10 hover:bg-brand-600/20 py-2 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider cursor-pointer"
          >
            <Crown className="h-4 w-4" />
            <span>Open Governance Console</span>
          </button>
        </div>
      )}

      {/* 3. Search and Discovery Input */}
      <div className="p-4 space-y-2">
        <div className="relative">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-500" />
          <input
            id="sidebar-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search @username or groups..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pr-4 pl-10 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Search Results Drawer */}
        {searchQuery.trim().length >= 2 && (
          <div id="search-results-drawer" className="max-h-60 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-2 space-y-2 shadow-lg">
            <span className="text-[10px] font-semibold text-slate-500 uppercase px-2 block">Directory Search Results</span>
            {searching ? (
              <p className="text-xs text-slate-500 px-2 animate-pulse">Searching registry...</p>
            ) : searchResults.users.length === 0 && searchResults.groups.length === 0 ? (
              <p className="text-xs text-slate-500 px-2">No users or public channels found.</p>
            ) : (
              <div className="space-y-1">
                {searchResults.users.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleUserResultClick(u.id)}
                    className="flex items-center justify-between rounded-lg p-2 hover:bg-slate-900 cursor-pointer transition text-left"
                  >
                    <div>
                      <p className="text-xs font-semibold text-white">{u.display_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">@{u.username}</p>
                    </div>
                    <UserPlus className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                ))}
                {searchResults.groups.map((g) => (
                  <div
                    key={g.id}
                    onClick={async () => {
                      try {
                        await joinGroup(g.id);
                        setSearchQuery("");
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="flex items-center justify-between rounded-lg p-2 hover:bg-slate-900 cursor-pointer transition text-left"
                  >
                    <div>
                      <p className="text-xs font-semibold text-white flex items-center">
                        <Users className="h-3 w-3 mr-1 text-brand-400" />
                        {g.name}
                      </p>
                      <p className="text-[10px] text-slate-500">{g.member_count} members • Public</p>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Controls Tabs (Chats / Requests / Contacts) */}
      {(() => {
        const requestCount = conversations.filter((c) => c.is_accepted === false && !c.is_blocked).length;
        return (
          <div className="flex border-b border-slate-800 text-[11px] font-semibold">
            <button
              onClick={() => {
                setActiveTab("chats");
                setError(null);
              }}
              className={`flex-1 py-3 text-center cursor-pointer border-b transition ${
                activeTab === "chats" ? "border-brand-500 text-brand-500 bg-slate-900" : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Active Chats
            </button>
            <button
              onClick={() => {
                setActiveTab("requests");
                setError(null);
              }}
              className={`flex-1 py-3 text-center cursor-pointer border-b transition relative ${
                activeTab === "requests" ? "border-brand-500 text-brand-500 bg-slate-900" : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Requests</span>
              {requestCount > 0 && (
                <span className="absolute top-2 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-slate-950 animate-pulse">
                  {requestCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("contacts");
                setError(null);
              }}
              className={`flex-1 py-3 text-center cursor-pointer border-b transition ${
                activeTab === "contacts" ? "border-brand-500 text-brand-500 bg-slate-900" : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Contacts
            </button>
          </div>
        );
      })()}

      {/* 5. Dynamic Content list */}
      <div className="flex-1 overflow-y-auto p-2">
        {error && (
          <div className="text-center text-[11px] text-red-400 bg-red-950/20 p-2 rounded mb-2 border border-red-900/30">
            {error}
          </div>
        )}

        {activeTab === "contacts" ? (
          /* Contacts rendering */
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase px-2 block mb-2">Saved Directory Cards</span>
            {contacts.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-6">No saved contacts yet. Search for people above to start.</p>
            ) : (
              contacts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl p-2.5 hover:bg-slate-800/50 transition group"
                >
                  <div
                    onClick={() => {
                      handleUserResultClick(c.id);
                      setActiveTab("chats");
                    }}
                    className="flex items-center space-x-3 cursor-pointer min-w-0 flex-1 text-left"
                  >
                    <div className="h-8 w-8 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-slate-200 text-xs">
                      {c.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{c.display_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">@{c.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeContact(c.id)}
                    title="Remove Contact"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    <UserX className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Conversation Thread List */
          <div className="space-y-1">
            {(() => {
              const filteredConversations = conversations.filter((c) => {
                if (activeTab === "requests") {
                  return c.is_accepted === false && !c.is_blocked;
                }
                // default is chats
                return c.is_accepted !== false && !c.is_blocked;
              });

              if (filteredConversations.length === 0) {
                if (activeTab === "requests") {
                  return (
                    <div className="text-center py-10 space-y-2">
                      <p className="text-xs text-slate-500">No pending requests.</p>
                      <p className="text-[11px] text-slate-600 px-4">
                        When someone outside your contacts messages you, it appears here.
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="text-center py-10 space-y-2">
                    <p className="text-xs text-slate-500">Your chat queue is empty.</p>
                    <p className="text-[11px] text-slate-600 px-4">
                      Type a name in search or click "New Group" below to start messaging.
                    </p>
                  </div>
                );
              }

              return filteredConversations.map((c) => {
                const isActive = c.id === activeConversationId;
                const typingUsers = typing[c.id] || [];
                
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveConversation(c.id)}
                    className={`flex w-full items-center justify-between rounded-xl p-3 transition text-left cursor-pointer ${
                      isActive ? "bg-brand-600 text-white" : "hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-display font-bold text-sm ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-300 border border-slate-700/50"
                      }`}>
                        {c.type === "group" ? <Users className="h-5 w-5" /> : c.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1">
                          <p className={`text-xs font-semibold truncate ${isActive ? "text-white" : "text-white"}`}>
                            {c.name}
                          </p>
                          {c.type === "group" && (
                            c.is_public ? (
                              <span title="Public Channel"><Globe className={`h-3 w-3 ${isActive ? "text-white/60" : "text-slate-500"}`} /></span>
                            ) : (
                              <span title="Private Invite-only"><Lock className={`h-3 w-3 ${isActive ? "text-white/60" : "text-slate-500"}`} /></span>
                            )
                          )}
                        </div>
                        
                        {/* Subtitle preview (Typing state takes priority) */}
                        <div className={`text-[11px] truncate mt-0.5 ${isActive ? "text-white/80" : "text-slate-400"}`}>
                          {typingUsers.length > 0 ? (
                            <span className="font-semibold text-brand-400 animate-pulse flex items-center">
                              <span className="mr-1">{typingUsers[0]} is typing</span>
                              <span className="flex space-x-0.5">
                                <span className="typing-dot" />
                                <span className="typing-dot" />
                                <span className="typing-dot" />
                              </span>
                            </span>
                          ) : c.last_message ? (
                            <span>
                              <span className="font-medium mr-1">
                                {c.last_message.sender_username === user?.username ? "You: " : `${c.last_message.sender_name}: `}
                              </span>
                              {c.last_message.content}
                            </span>
                          ) : (
                            <span className="italic">No messages yet</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Unread indicators and meta */}
                    <div className="ml-2 flex flex-col items-end space-y-1 text-right">
                      {(c.unread_count || 0) > 0 && (
                        <span className={`flex h-4.5 min-w-4.5 items-center justify-center rounded-full text-[10px] font-bold px-1.5 ${
                          isActive ? "bg-white text-brand-600" : "bg-brand-500 text-white"
                        }`}>
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            })()}
          </div>
        )}
      </div>

      {/* 6. Action Drawer Footer */}
      <div className="border-t border-slate-800 p-3 space-y-2 bg-slate-900/90">
        
        {/* Footer controls toggle buttons */}
        <div className="flex space-x-2">
          <button
            id="sidebar-create-group-toggle"
            onClick={() => {
              setShowCreateGroup(!showCreateGroup);
              setShowJoinGroup(false);
              setError(null);
            }}
            className="flex-1 flex items-center justify-center space-x-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-2 text-xs font-semibold transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Group</span>
          </button>
          <button
            id="sidebar-join-group-toggle"
            onClick={() => {
              setShowJoinGroup(!showJoinGroup);
              setShowCreateGroup(false);
              setError(null);
            }}
            className="flex-1 flex items-center justify-center space-x-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-2 text-xs font-semibold transition cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Join Group</span>
          </button>
        </div>

        {/* Create Group Panel */}
        {showCreateGroup && (
          <form onSubmit={handleCreateGroupSubmit} className="rounded-xl bg-slate-950 p-3 border border-slate-800 space-y-3.5 animate-fade-in">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Create Channel</span>
            <input
              type="text"
              required
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name..."
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
            <div className="flex items-center justify-between text-xs px-1">
              <label className="text-slate-400">Discoverable (Public)</label>
              <input
                type="checkbox"
                checked={groupIsPublic}
                onChange={(e) => setGroupIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-slate-800 bg-slate-900 text-brand-600 focus:ring-brand-500 focus:ring-offset-slate-950"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-brand-600 hover:bg-brand-500 text-xs font-semibold py-2 text-white transition cursor-pointer"
            >
              Build Group
            </button>
          </form>
        )}

        {/* Join Group Panel */}
        {showJoinGroup && (
          <form onSubmit={handleJoinGroupSubmit} className="rounded-xl bg-slate-950 p-3 border border-slate-800 space-y-3 animate-fade-in">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Join Conversation</span>
            <input
              type="text"
              required
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Invite code or group ID..."
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-brand-600 hover:bg-brand-500 text-xs font-semibold py-2 text-white transition cursor-pointer"
            >
              Authorize Join
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
