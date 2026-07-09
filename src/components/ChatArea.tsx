import React, { useState, useEffect, useRef } from "react";
import { useChatStore, API_BASE } from "../store/chatStore.ts";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  Users,
  AtSign,
  UserPlus,
  UserMinus,
  Globe,
  Lock,
  ArrowDown,
  Info,
  Trash2,
} from "lucide-react";
import GroupDetailsSidebar from "./GroupDetailsSidebar.tsx";

export default function ChatArea() {
  const {
    user,
    activeConversationId,
    conversations,
    messages,
    presence,
    typing,
    contacts,
    addContact,
    removeContact,
    sendMessage,
    deleteMessage,
    sendWSMessage,
    fetchMessages,
    joinGroup,
    setActiveConversation,
  } = useChatStore();

  const [input, setInput] = useState("");
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [showGroupSidebar, setShowGroupSidebar] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const chatMessages = activeConversationId ? messages[activeConversationId] || [] : [];
  const activeTypers = activeConversationId ? typing[activeConversationId] || [] : [];

  const myMembership = activeConv?.members?.find((m) => m.user_id === user?.id);
  const isGroupAdmin = myMembership?.role === "admin";
  const isGlobalAdmin = user?.role === "admin";
  const canDeleteAny = isGlobalAdmin || isGroupAdmin;

  // 1. Manage scrolling & Respectful Snap-to-bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Check if user is scrolled near bottom (within 200px)
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;

    if (isNearBottom) {
      el.scrollTop = el.scrollHeight;
      setNewMessagesCount(0);
    } else {
      setNewMessagesCount((prev) => prev + 1);
    }
  }, [chatMessages.length]);

  // Reset counters when switching channels
  useEffect(() => {
    setNewMessagesCount(0);
    setHasMoreOlder(true);
    setShowGroupSidebar(false);
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activeConversationId]);

  // 2. Infinite scroll upward handler
  const handleScroll = async () => {
    const el = scrollRef.current;
    if (!el || loadingOlder || !hasMoreOlder || !activeConversationId) return;

    if (el.scrollTop === 0 && chatMessages.length > 0) {
      setLoadingOlder(true);
      const firstMsg = chatMessages[0];
      const previousScrollHeight = el.scrollHeight;

      // Fetch messages before firstMsg date cursor
      const hasMore = await fetchMessages(activeConversationId, firstMsg.created_at);
      setHasMoreOlder(hasMore);
      setLoadingOlder(false);

      // Preserve scroll position relative to newly loaded historical nodes
      setTimeout(() => {
        if (el) el.scrollTop = el.scrollHeight - previousScrollHeight;
      }, 30);
    }
  };

  // 3. Debounced and Throttled Typing Emitter
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    const activeId = activeConversationId;
    if (!activeId) return;

    const now = Date.now();
    // Throttle network typing packets to every 2.5 seconds
    if (now - lastTypingSentRef.current > 2500) {
      sendWSMessage("typing", { conversation_id: activeId, is_typing: true });
      lastTypingSentRef.current = now;
    }

    // Clear previous idle timer
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Stop typing after 1.5 seconds of silence
    typingTimeoutRef.current = setTimeout(() => {
      sendWSMessage("typing", { conversation_id: activeId, is_typing: false });
    }, 1500);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConversationId) return;

    // Send message to store (instantly updates optimistically)
    sendMessage(input.trim());
    setInput("");

    // Send typing stop event
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendWSMessage("typing", { conversation_id: activeConversationId, is_typing: false });

    // Instantly snap scroll to bottom on explicit send
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 50);
  };

  if (!activeConversationId || !activeConv) {
    return (
      <div id="chat-empty-viewport" className="flex flex-1 flex-col items-center justify-center bg-slate-950 p-8 text-center text-slate-500">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 max-w-sm space-y-4 shadow-xl">
          <AtSign className="mx-auto h-12 w-12 text-slate-700 animate-pulse" />
          <h3 className="font-display font-semibold text-white">No active chat selected</h3>
          <p className="text-xs text-slate-400">
            Search for an @username or choose an existing group to start messaging in high-performance WebSockets.
          </p>
        </div>
      </div>
    );
  }

  // Determine direct chat recipient details
  const isDirect = activeConv.type === "direct";
  const otherUser = activeConv.other_user;
  const isSavedContact = otherUser ? contacts.some((c) => c.id === otherUser.id) : false;

  // Retrieve recipient presence details
  const presenceState = otherUser ? presence[otherUser.id] : null;
  const isOnline = presenceState ? presenceState.isOnline : false;
  const lastSeenStr = presenceState?.lastSeen ? new Date(presenceState.lastSeen).toLocaleTimeString() : null;

  // Group messages helper
  const groupMessagesByDate = () => {
    const groups: { [key: string]: typeof chatMessages } = {};
    chatMessages.forEach((msg) => {
      const date = new Date(msg.created_at).toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  const groupedMsgs = groupMessagesByDate();

  return (
    <div className="flex flex-1 flex-row bg-slate-950 text-slate-100 relative min-w-0 overflow-hidden h-full">
      <div id="chat-active-viewport" className="flex flex-1 flex-col bg-slate-950 min-w-0 h-full relative">
      
      {/* 1. Chat Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="truncate font-semibold text-sm text-white">{activeConv.name}</h3>
            {activeConv.type === "group" ? (
              activeConv.is_public ? (
                <span title="Public Channel"><Globe className="h-3.5 w-3.5 text-slate-500" /></span>
              ) : (
                <span title="Private Invite-only"><Lock className="h-3.5 w-3.5 text-slate-500" /></span>
              )
            ) : null}
          </div>
          
          {/* Subtitle description */}
          <p className="truncate text-[11px] mt-0.5">
            {isDirect ? (
              otherUser ? (
                isOnline ? (
                  <span className="text-green-400 font-semibold">online</span>
                ) : (
                  <span className="text-slate-500">last seen recently {lastSeenStr && `at ${lastSeenStr}`}</span>
                )
              ) : (
                <span className="text-slate-500 italic">Deleted Account</span>
              )
            ) : (
              <span className="text-slate-400 flex items-center">
                <Users className="h-3 w-3 mr-1 text-slate-500" />
                Multi-device group channel
              </span>
            )}
          </p>
        </div>

        {/* Action Tray (Add/Remove contacts for Direct Chats, or group info) */}
        {isDirect && otherUser && (
          <div className="ml-4">
            {isSavedContact ? (
              <button
                id="remove-contact-btn"
                onClick={() => removeContact(otherUser.id)}
                className="flex items-center space-x-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-red-400 border border-slate-700/50 transition cursor-pointer"
              >
                <UserMinus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Delete Contact</span>
              </button>
            ) : (
              <button
                id="add-contact-btn"
                onClick={() => addContact(otherUser.id)}
                className="flex items-center space-x-1.5 rounded-xl bg-brand-600/10 hover:bg-brand-600/20 px-3.5 py-1.5 text-xs font-semibold text-brand-400 border border-brand-500/20 transition cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add to Contacts</span>
              </button>
            )}
          </div>
        )}

        {/* Private group details toggle button & invite code */}
        {!isDirect && (
          <div className="flex items-center space-x-3.5 ml-4">
            {activeConv.invite_code && (
              <div className="text-right hidden sm:block">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Invite Code</span>
                <span className="font-mono text-xs text-brand-400 font-bold bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20 select-all">
                  {activeConv.invite_code}
                </span>
              </div>
            )}
            <button
              id="toggle-group-sidebar-btn"
              onClick={() => setShowGroupSidebar(!showGroupSidebar)}
              className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                showGroupSidebar
                  ? "bg-brand-600 text-white border-brand-500"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/50"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Group Admin</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Messages List Body */}
      <div
        id="messages-scroll-window"
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-6"
      >
        {/* Loading historical cursor loader */}
        {loadingOlder && (
          <div className="flex justify-center items-center space-x-2 py-2">
            <span className="animate-pulse text-xs text-slate-500">Decrypting previous archives...</span>
          </div>
        )}

        {chatMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 py-20 space-y-3">
            <Info className="h-8 w-8 text-slate-700" />
            <p className="text-xs">End-to-end symmetric session established.</p>
            <p className="text-[11px] text-slate-600">Your messages are encrypted at rest with AES-256-GCM before writing to storage.</p>
          </div>
        ) : (
          Object.entries(groupedMsgs).map(([date, msgs]) => (
            <div key={date} className="space-y-4">
              {/* Date Header Tag */}
              <div className="flex justify-center">
                <span className="rounded-full bg-slate-900/80 px-3 py-1 text-[10px] font-semibold tracking-wide text-slate-400 border border-slate-800/40 font-display">
                  {date}
                </span>
              </div>

              {/* Day Messages */}
              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {msgs.map((msg) => {
                    const isMyMessage = msg.sender_id === user?.id;
                    const isOptimistic = !!msg.temp_id;
                    const isError = (msg as any).is_error;
                    const isDeleted = msg.content.startsWith("deleted by @");
                    
                    return (
                      <motion.div
                        key={msg.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: -15, transition: { duration: 0.2 } }}
                        className={`flex w-full ${isMyMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`flex items-center gap-2 max-w-[75%] group relative ${isMyMessage ? "flex-row-reverse" : "flex-row"}`}>
                          
                          {/* Message Bubble */}
                          <div
                            className={`rounded-2xl px-4 py-2.5 shadow-lg relative flex-1 ${
                              isMyMessage
                                ? isError
                                  ? "bg-red-950/40 text-red-200 border border-red-900/50"
                                  : isOptimistic
                                  ? "bg-brand-600/50 text-white/70 border border-brand-500/20"
                                  : "bg-brand-600 text-white"
                                : "bg-slate-900 text-slate-100 border border-slate-800"
                            }`}
                          >
                            {/* Sender Details in group */}
                            {activeConv.type === "group" && !isMyMessage && (
                              <p className="text-[10px] font-bold text-brand-400 font-mono mb-1 truncate">
                                {msg.sender_name} (@{msg.sender_username})
                              </p>
                            )}

                            {isDeleted ? (
                              <p className="italic text-slate-400 text-xs font-mono py-0.5">
                                🚫 {msg.content}
                              </p>
                            ) : (
                              <p className="text-xs break-words leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            )}

                            {msg.content.includes("Join the Official BlinkTalk Community") && (
                              <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 shadow-inner">
                                <div className="flex items-center space-x-2.5">
                                  <div className="h-9 w-9 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
                                    <Globe className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-white truncate">BlinkTalk Community</p>
                                    <p className="text-[10px] text-slate-400 truncate">Public Group • Admin is main administrator</p>
                                  </div>
                                </div>
                                
                                {(() => {
                                  const communityConv = conversations.find((c) => c.invite_code === "community");
                                  if (communityConv) {
                                    return (
                                      <button
                                        onClick={() => setActiveConversation(communityConv.id)}
                                        className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-400 hover:text-brand-300 text-[11px] font-semibold transition cursor-pointer text-center"
                                      >
                                        Go to Community Group →
                                      </button>
                                    );
                                  } else {
                                    return (
                                      <button
                                        onClick={async () => {
                                          try {
                                            await joinGroup("community");
                                          } catch (err) {
                                            console.error("Failed to join community:", err);
                                          }
                                        }}
                                        className="w-full py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-semibold transition cursor-pointer text-center"
                                      >
                                        Join Community Group Now
                                      </button>
                                    );
                                  }
                                })()}
                              </div>
                            )}

                            {/* Msg meta timeline & checks */}
                            <div className="flex items-center justify-end space-x-1 text-[9px] text-white/50 mt-1 select-none font-mono">
                              <span>
                                {new Date(msg.created_at).toLocaleTimeString(undefined, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                  second: undefined
                                })}
                              </span>
                              {isMyMessage && (
                                <span>
                                  {isError ? (
                                    <span className="text-red-400 font-bold">✕</span>
                                  ) : isOptimistic ? (
                                    <span className="animate-pulse">⏳</span>
                                  ) : (
                                    <span className="text-brand-300 font-bold" title="Delivered successfully on socket layer">✓✓</span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Hover Delete Button */}
                          {!isOptimistic && !isError && !isDeleted && (isMyMessage || canDeleteAny) && (
                            <button
                              onClick={async () => {
                                try {
                                  if (confirm("Delete this message?")) {
                                    await deleteMessage(msg.id);
                                  }
                                } catch (err) {
                                  console.error("Failed to delete message:", err);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-red-500/10 text-slate-500 hover:text-red-400 border border-slate-800/80 transition opacity-0 group-hover:opacity-100 cursor-pointer h-7 w-7 flex items-center justify-center shrink-0 shadow-lg"
                              title="Delete Message"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}

                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Floating New Messages Pill */}
      {newMessagesCount > 0 && (
        <button
          onClick={() => {
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            setNewMessagesCount(0);
          }}
          className="absolute bottom-24 right-6 flex items-center space-x-1.5 rounded-full bg-brand-600 hover:bg-brand-500 text-white px-3.5 py-2 text-xs font-semibold shadow-2xl border border-brand-500/20 transition cursor-pointer"
        >
          <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
          <span>{newMessagesCount} new messages</span>
        </button>
      )}

      {/* 4. Active Typers Indicator Bar */}
      <div className="px-6 h-5 text-[10px] text-slate-500 font-medium">
        {activeTypers.length > 0 && (
          <p className="flex items-center space-x-1 font-mono text-brand-400">
            <span>@{activeTypers.join(", @")} typing</span>
            <span className="flex space-x-0.5 ml-1">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </span>
          </p>
        )}
      </div>

      {/* 5. Message Input Bar or Request Actions */}
      <div className="border-t border-slate-800 bg-slate-900 px-6 py-4">
        {activeConv?.type === "direct" && activeConv?.is_accepted === false ? (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800/80">
            <div className="flex items-start space-x-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex-shrink-0 flex items-center justify-center border border-amber-500/20">
                <Info className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white">Unknown Sender</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                  This person is not in your contacts list. You can accept this message request to talk, or block them.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 w-full md:w-auto flex-shrink-0">
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("tg_token");
                    const res = await fetch(`${API_BASE}/api/conversations/${activeConv.id}/accept`, {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    if (res.ok) {
                      useChatStore.getState().fetchConversations();
                    }
                  } catch (e) {
                    console.error("Failed to accept message request", e);
                  }
                }}
                className="flex-1 md:flex-initial rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold px-4 py-2 text-xs transition cursor-pointer text-center"
              >
                Accept
              </button>
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("tg_token");
                    const res = await fetch(`${API_BASE}/api/conversations/${activeConv.id}/block`, {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    if (res.ok) {
                      useChatStore.getState().fetchConversations();
                      useChatStore.getState().setActiveConversation(null);
                    }
                  } catch (e) {
                    console.error("Failed to block message request", e);
                  }
                }}
                className="flex-1 md:flex-initial rounded-lg bg-slate-800 hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/30 text-slate-300 font-semibold px-4 py-2 text-xs transition border border-transparent cursor-pointer text-center"
              >
                Block
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center space-x-3">
            <input
              id="chat-message-input"
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Write an encrypted message..."
              className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              id="chat-send-btn"
              type="submit"
              disabled={!input.trim()}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-50 transition cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>

      </div>

      {showGroupSidebar && activeConv.type === "group" && (
        <GroupDetailsSidebar
          conversation={activeConv}
          onClose={() => setShowGroupSidebar(false)}
        />
      )}
    </div>
  );
}
