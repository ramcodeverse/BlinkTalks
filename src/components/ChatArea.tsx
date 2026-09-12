import React, { useState, useEffect, useRef } from "react";
import { useChatStore, API_BASE } from "../store/chatStore.ts";
import { useWorkspaceStore } from "../store/workspaceStore.ts";
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
  Search,
  X,
  ChevronUp,
  ChevronDown,
  Reply,
  Copy,
  Check,
  Edit2,
  Smile,
  ArrowLeft,
  CheckSquare,
  Plus,
  ChevronRight,
  Briefcase,
} from "lucide-react";
import GroupDetailsSidebar from "./GroupDetailsSidebar.tsx";

const DRAFT_STORAGE_KEY = "blinktalks_channel_drafts";

const getSavedDrafts = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

const persistDraft = (convId: string, text: string) => {
  try {
    const drafts = getSavedDrafts();
    if (text && text.trim()) {
      drafts[convId] = text;
    } else {
      delete drafts[convId];
    }
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
  } catch {}
};

const REACTIONS_KEY = "blinktalks_msg_reactions";

const getSavedReactions = (): Record<string, Record<string, number>> => {
  try {
    return JSON.parse(localStorage.getItem(REACTIONS_KEY) || "{}");
  } catch {
    return {};
  }
};

const persistReactions = (reactions: Record<string, Record<string, number>>) => {
  try {
    localStorage.setItem(REACTIONS_KEY, JSON.stringify(reactions));
  } catch {}
};

const QUICK_EMOJIS = ["❤️", "👍", "🔥", "😂", "🚀", "👏"];

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
  const [showRelatedWork, setShowRelatedWork] = useState(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);

  // Workspace integration hooks
  const {
    activeWorkspace,
    tasks,
    setIsTaskModalOpen,
    setTaskModalPrefill,
    setActiveTask,
    moveTaskStatus,
  } = useWorkspaceStore();

  // In-conversation message search
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Message reply state
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    sender_name: string;
    content: string;
  } | null>(null);

  // Inline message editing
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");

  // Copy feedback state (messageId -> boolean)
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Reactions state (msgId -> { emoji: count })
  const [messageReactions, setMessageReactions] = useState<
    Record<string, Record<string, number>>
  >(getSavedReactions());

  // Mentions autocomplete
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionSuggestions, setMentionSuggestions] = useState<string[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  // Target message highlight
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  const prevConvIdRef = useRef<string | null>(null);

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const chatMessages = activeConversationId ? messages[activeConversationId] || [] : [];
  const activeTypers = activeConversationId ? typing[activeConversationId] || [] : [];

  const myMembership = activeConv?.members?.find((m) => m.user_id === user?.id);
  const isGroupAdmin = myMembership?.role === "admin";
  const isGlobalAdmin = user?.role === "admin";
  const canDeleteAny = isGlobalAdmin || isGroupAdmin;

  // 1. Draft preservation across conversation switching
  useEffect(() => {
    if (prevConvIdRef.current && prevConvIdRef.current !== activeConversationId) {
      // Save draft for previous channel
      persistDraft(prevConvIdRef.current, input);
    }

    if (activeConversationId) {
      // Restore draft for new channel
      const drafts = getSavedDrafts();
      setInput(drafts[activeConversationId] || "");
      setReplyingTo(null);
      setEditingMsgId(null);
      setShowMsgSearch(false);
      setSearchQuery("");
    }

    prevConvIdRef.current = activeConversationId;
  }, [activeConversationId]);

  // 2. Manage scrolling & Smart auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 180;

    if (isNearBottom) {
      el.scrollTop = el.scrollHeight;
      setNewMessagesCount(0);
      setIsScrolledUp(false);
    } else {
      setNewMessagesCount((prev) => prev + 1);
      setIsScrolledUp(true);
    }
  }, [chatMessages.length]);

  // Reset counters when switching channels
  useEffect(() => {
    setNewMessagesCount(0);
    setHasMoreOlder(true);
    setShowGroupSidebar(false);
    setIsScrolledUp(false);
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activeConversationId]);

  // Scroll listener for infinite scroll and jump-to-bottom button
  const handleScroll = async () => {
    const el = scrollRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsScrolledUp(distanceFromBottom > 200);

    if (distanceFromBottom <= 50) {
      setNewMessagesCount(0);
    }

    // Infinite scroll upward
    if (el.scrollTop === 0 && chatMessages.length > 0 && !loadingOlder && hasMoreOlder && activeConversationId) {
      setLoadingOlder(true);
      const firstMsg = chatMessages[0];
      const previousScrollHeight = el.scrollHeight;

      const hasMore = await fetchMessages(activeConversationId, firstMsg.created_at);
      setHasMoreOlder(hasMore);
      setLoadingOlder(false);

      setTimeout(() => {
        if (el) el.scrollTop = el.scrollHeight - previousScrollHeight;
      }, 30);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
      setNewMessagesCount(0);
      setIsScrolledUp(false);
    }
  };

  // 3. Mentions detection in input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    if (activeConversationId) {
      persistDraft(activeConversationId, val);
    }

    // Check for @ mentions in group chat
    if (activeConv?.type === "group" && activeConv.members) {
      const cursorIndex = e.target.selectionStart || val.length;
      const textBeforeCursor = val.slice(0, cursorIndex);
      const lastAt = textBeforeCursor.lastIndexOf("@");

      if (lastAt !== -1 && (lastAt === 0 || textBeforeCursor[lastAt - 1] === " ")) {
        const query = textBeforeCursor.slice(lastAt + 1).toLowerCase();
        const matches = activeConv.members
          .map((m) => m.user?.username)
          .filter((uname): uname is string => Boolean(uname && uname.toLowerCase().startsWith(query)));

        if (matches.length > 0) {
          setMentionQuery(query);
          setMentionSuggestions(matches);
          setSelectedMentionIndex(0);
        } else {
          setMentionQuery(null);
        }
      } else {
        setMentionQuery(null);
      }
    } else {
      setMentionQuery(null);
    }

    // Typing emitter
    const activeId = activeConversationId;
    if (!activeId) return;

    const now = Date.now();
    if (now - lastTypingSentRef.current > 2500) {
      sendWSMessage("typing", { conversation_id: activeId, is_typing: true });
      lastTypingSentRef.current = now;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendWSMessage("typing", { conversation_id: activeId, is_typing: false });
    }, 1500);
  };

  const insertMention = (username: string) => {
    if (!inputRef.current) return;
    const cursor = inputRef.current.selectionStart || input.length;
    const textBefore = input.slice(0, cursor);
    const textAfter = input.slice(cursor);
    const lastAt = textBefore.lastIndexOf("@");

    if (lastAt !== -1) {
      const newText = textBefore.slice(0, lastAt) + `@${username} ` + textAfter;
      setInput(newText);
      if (activeConversationId) persistDraft(activeConversationId, newText);
      setMentionQuery(null);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  };

  // 4. Send Message Handler (supports reply quoting)
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConversationId) return;

    let finalContent = input.trim();

    // If replying to a message, prepend structured quote header
    if (replyingTo) {
      const cleanQuote =
        replyingTo.content.length > 80
          ? replyingTo.content.slice(0, 80) + "..."
          : replyingTo.content;
      finalContent = `> Replying to @${replyingTo.sender_name}: "${cleanQuote}"\n\n${finalContent}`;
      setReplyingTo(null);
    }

    sendMessage(finalContent);
    setInput("");
    if (activeConversationId) persistDraft(activeConversationId, "");

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendWSMessage("typing", { conversation_id: activeConversationId, is_typing: false });

    setTimeout(() => {
      scrollToBottom();
    }, 50);
  };

  // 5. Copy Message Content
  const handleCopyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 1800);
  };

  // 6. Message Reactions
  const handleAddReaction = (msgId: string, emoji: string) => {
    setMessageReactions((prev) => {
      const currentMsgReactions = { ...(prev[msgId] || {}) };
      currentMsgReactions[emoji] = (currentMsgReactions[emoji] || 0) + 1;
      const updated = { ...prev, [msgId]: currentMsgReactions };
      persistReactions(updated);
      return updated;
    });
  };

  // 7. In-Conversation Search Matches
  const searchMatches = searchQuery.trim().length >= 2
    ? chatMessages.filter(
        (m) =>
          m.content.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !m.content.startsWith("deleted by @")
      )
    : [];

  const jumpToMatch = (index: number) => {
    if (searchMatches.length === 0) return;
    const target = searchMatches[index];
    if (!target) return;

    setCurrentMatchIndex(index);
    setHighlightedMsgId(target.id);

    const el = document.getElementById(`msg-item-${target.id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    setTimeout(() => setHighlightedMsgId(null), 2500);
  };

  // Keyboard shortcut: Up arrow in empty composer edits last own message
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp" && !input.trim() && chatMessages.length > 0) {
      const myMsgs = chatMessages.filter(
        (m) => m.sender_id === user?.id && !m.content.startsWith("deleted by @")
      );
      if (myMsgs.length > 0) {
        const lastMyMsg = myMsgs[myMsgs.length - 1];
        setEditingMsgId(lastMyMsg.id);
        setEditInput(lastMyMsg.content);
      }
    }
  };

  if (!activeConversationId || !activeConv) {
    const communityConv = conversations.find((c) => c.invite_code === "community");

    return (
      <div id="chat-empty-viewport" className="hidden md:flex flex-1 flex-col items-center justify-center bg-slate-950 p-6 sm:p-10 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 max-w-md w-full space-y-6 animate-fade-in">
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-brand-600/20 to-indigo-500/20 border border-brand-500/30 animate-pulse" />
            <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-xl">
              <Users className="h-8 w-8 text-brand-400" />
            </div>
            <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Lock className="h-3 w-3" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-2xl font-bold text-white tracking-tight">
              No conversation selected
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
              Choose a conversation or group from the sidebar to start messaging with sub-second real-time sync.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {communityConv && (
              <button
                onClick={() => setActiveConversation(communityConv.id)}
                className="btn-interactive w-full sm:w-auto px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow-lg shadow-brand-500/20 cursor-pointer flex items-center justify-center space-x-2"
              >
                <Globe className="h-4 w-4" />
                <span>Open Community Chat</span>
              </button>
            )}
            <button
              onClick={() => {
                const searchInput = document.getElementById("sidebar-search-input");
                if (searchInput) searchInput.focus();
              }}
              className="btn-interactive w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-xs transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <AtSign className="h-4 w-4 text-cyan-400" />
              <span>Search People</span>
            </button>
          </div>

          <div className="pt-6 border-t border-slate-800/60 flex items-center justify-center space-x-2 text-[11px] text-slate-500 font-mono">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            <span>256-bit Encrypted Session Active</span>
          </div>
        </div>
      </div>
    );
  }

  const isDirect = activeConv.type === "direct";
  const otherUser = activeConv.other_user;
  const isSavedContact = otherUser ? contacts.some((c) => c.id === otherUser.id) : false;

  const presenceState = otherUser ? presence[otherUser.id] : null;
  const isOnline = presenceState ? presenceState.isOnline : false;
  const lastSeenStr = presenceState?.lastSeen ? new Date(presenceState.lastSeen).toLocaleTimeString() : null;

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
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 sm:px-6 py-3.5 z-10 shrink-0">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {/* Mobile Back to Conversation List Button */}
            <button
              onClick={() => setActiveConversation(null)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Back to conversations"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

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
              
              <p className="truncate text-[11px] mt-0.5">
                {isDirect ? (
                  otherUser ? (
                    isOnline ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        online
                      </span>
                    ) : (
                      <span className="text-slate-500">last seen recently {lastSeenStr && `at ${lastSeenStr}`}</span>
                    )
                  ) : (
                    <span className="text-slate-500 italic">Deleted Account</span>
                  )
                ) : (
                  <span className="text-slate-400 flex items-center">
                    <Users className="h-3 w-3 mr-1 text-slate-500" />
                    {activeConv.members?.length || 0} members
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right Header Actions: Search in conversation, Group info, Contact toggles, Workspace Tasks */}
          <div className="flex items-center space-x-2 ml-3">
            {/* Workspace Tasks Split Panel Toggle */}
            <button
              onClick={() => setShowRelatedWork(!showRelatedWork)}
              title="Toggle Related Workspace Tasks"
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                showRelatedWork
                  ? "bg-brand-600/20 border-brand-500/50 text-cyan-300 shadow-sm"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
              }`}
            >
              <CheckSquare className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Workspace Work</span>
            </button>

            {/* Search in chat toggle */}
            <button
              onClick={() => {
                setShowMsgSearch(!showMsgSearch);
                if (!showMsgSearch) setSearchQuery("");
              }}
              title="Search messages in this conversation"
              className={`p-2 rounded-xl transition cursor-pointer ${
                showMsgSearch
                  ? "bg-brand-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Direct Chat: Add/Remove Contact */}
            {isDirect && otherUser && (
              <div>
                {isSavedContact ? (
                  <button
                    id="remove-contact-btn"
                    onClick={() => removeContact(otherUser.id)}
                    className="flex items-center space-x-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-rose-400 border border-slate-700/50 transition cursor-pointer"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Saved</span>
                  </button>
                ) : (
                  <button
                    id="add-contact-btn"
                    onClick={() => addContact(otherUser.id)}
                    className="flex items-center space-x-1.5 rounded-xl bg-brand-600/10 hover:bg-brand-600/20 px-3 py-1.5 text-xs font-semibold text-brand-400 border border-brand-500/20 transition cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Add Contact</span>
                  </button>
                )}
              </div>
            )}

            {/* Group details toggle */}
            {!isDirect && (
              <button
                id="toggle-group-sidebar-btn"
                onClick={() => setShowGroupSidebar(!showGroupSidebar)}
                className={`flex items-center space-x-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                  showGroupSidebar
                    ? "bg-brand-600 text-white border-brand-500"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/50"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Group Info</span>
              </button>
            )}
          </div>
        </div>

        {/* 1.1 In-Conversation Message Search Slide-down */}
        {showMsgSearch && (
          <div className="px-4 sm:px-6 py-2.5 bg-slate-900/95 border-b border-slate-800 flex items-center space-x-3 animate-slide-down z-10">
            <Search className="h-4 w-4 text-slate-500 shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentMatchIndex(0);
              }}
              placeholder="Search in this conversation..."
              className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            {searchMatches.length > 0 && (
              <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
                <span>
                  {currentMatchIndex + 1} of {searchMatches.length}
                </span>
                <button
                  onClick={() => {
                    const next = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
                    jumpToMatch(next);
                  }}
                  className="p-1 hover:bg-slate-800 rounded text-slate-300 cursor-pointer"
                  title="Previous match"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    const next = (currentMatchIndex + 1) % searchMatches.length;
                    jumpToMatch(next);
                  }}
                  className="p-1 hover:bg-slate-800 rounded text-slate-300 cursor-pointer"
                  title="Next match"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {searchQuery.trim().length >= 2 && searchMatches.length === 0 && (
              <span className="text-[11px] text-slate-500">No results</span>
            )}
            <button
              onClick={() => {
                setShowMsgSearch(false);
                setSearchQuery("");
              }}
              className="p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* 2. Messages List Body */}
        <div
          id="messages-scroll-window"
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6"
        >
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
                <div className="flex justify-center">
                  <span className="rounded-full bg-slate-900/80 px-3 py-1 text-[10px] font-semibold tracking-wide text-slate-400 border border-slate-800/40 font-display">
                    {date}
                  </span>
                </div>

                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {msgs.map((msg) => {
                      const isMyMessage = msg.sender_id === user?.id;
                      const isOptimistic = !!msg.temp_id;
                      const isError = (msg as any).is_error;
                      const isDeleted = msg.content.startsWith("deleted by @");
                      const isHighlighted = highlightedMsgId === msg.id;
                      const reactionsForMsg = messageReactions[msg.id] || {};
                      const isCopied = copiedMsgId === msg.id;

                      return (
                        <motion.div
                          id={`msg-item-${msg.id}`}
                          key={msg.id}
                          layout
                          initial={{ opacity: 0, scale: 0.98, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                          className={`flex w-full group relative transition-colors ${
                            isMyMessage ? "justify-end" : "justify-start"
                          } ${isHighlighted ? "highlight-target-message" : ""}`}
                        >
                          <div
                            className={`flex items-start gap-2 max-w-[85%] sm:max-w-[75%] relative ${
                              isMyMessage ? "flex-row-reverse" : "flex-row"
                            }`}
                          >
                            {/* Message Bubble */}
                            <div
                              className={`rounded-2xl px-4 py-2.5 shadow-md relative flex-1 transition-all ${
                                isMyMessage
                                  ? isError
                                    ? "bg-rose-950/40 text-rose-200 border border-rose-900/50"
                                    : isOptimistic
                                    ? "bg-brand-600/60 text-white/80 border border-brand-500/20"
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

                              {/* Quoted Message preview if reply */}
                              {msg.content.startsWith("> Replying to @") && (
                                <div className="mb-2 p-2 rounded-lg bg-black/20 border-l-2 border-white/50 text-[11px] opacity-80 leading-snug">
                                  {msg.content.split("\n\n")[0]}
                                </div>
                              )}

                              {/* Message Text or Inline Edit */}
                              {editingMsgId === msg.id ? (
                                <div className="space-y-2 py-1">
                                  <input
                                    type="text"
                                    value={editInput}
                                    onChange={(e) => setEditInput(e.target.value)}
                                    className="w-full bg-slate-950 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        msg.content = editInput;
                                        setEditingMsgId(null);
                                      } else if (e.key === "Escape") {
                                        setEditingMsgId(null);
                                      }
                                    }}
                                  />
                                  <div className="flex items-center space-x-2 text-[10px]">
                                    <button
                                      onClick={() => {
                                        msg.content = editInput;
                                        setEditingMsgId(null);
                                      }}
                                      className="px-2 py-1 rounded bg-brand-500 text-white font-semibold cursor-pointer"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingMsgId(null)}
                                      className="px-2 py-1 rounded bg-slate-800 text-slate-300 cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : isDeleted ? (
                                <p className="italic text-slate-400 text-xs font-mono py-0.5">
                                  🚫 {msg.content}
                                </p>
                              ) : (
                                <p className="text-xs break-words leading-relaxed whitespace-pre-wrap">
                                  {msg.content.startsWith("> Replying to @")
                                    ? msg.content.split("\n\n").slice(1).join("\n\n")
                                    : msg.content}
                                </p>
                              )}

                              {/* Community Group Card shortcut */}
                              {msg.content.includes("Join the Official BlinkTalk Community") && (
                                <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 shadow-inner">
                                  <div className="flex items-center space-x-2.5">
                                    <div className="h-8 w-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
                                      <Globe className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold text-white truncate">BlinkTalk Community</p>
                                      <p className="text-[10px] text-slate-400 truncate">Public Group • Official platform channel</p>
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

                              {/* Meta Timeline & delivery checks */}
                              <div className="flex items-center justify-end space-x-1.5 text-[9px] text-white/60 mt-1 select-none font-mono">
                                <span>
                                  {new Date(msg.created_at).toLocaleTimeString(undefined, {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false,
                                  })}
                                </span>
                                {isMyMessage && (
                                  <span>
                                    {isError ? (
                                      <span className="text-rose-400 font-bold">✕</span>
                                    ) : isOptimistic ? (
                                      <span className="animate-pulse">⏳</span>
                                    ) : (
                                      <span className="text-brand-300 font-bold" title="Delivered">✓✓</span>
                                    )}
                                  </span>
                                )}
                              </div>

                              {/* Reactions display pill */}
                              {Object.keys(reactionsForMsg).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5 pt-1 border-t border-white/10">
                                  {Object.entries(reactionsForMsg).map(([emoji, count]) => (
                                    <span
                                      key={emoji}
                                      onClick={() => handleAddReaction(msg.id, emoji)}
                                      className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-black/20 hover:bg-black/30 border border-white/15 text-[10px] cursor-pointer transition select-none"
                                    >
                                      <span>{emoji}</span>
                                      <span className="font-mono text-[9px] font-semibold">{count}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Floating Action Menu on Hover */}
                            {!isOptimistic && !isDeleted && (
                              <div
                                className={`flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 shadow-xl shrink-0 ${
                                  isMyMessage ? "order-first" : ""
                                }`}
                              >
                                {/* Quick reaction buttons */}
                                <div className="hidden sm:flex items-center space-x-0.5 pr-1 border-r border-slate-800">
                                  {QUICK_EMOJIS.slice(0, 3).map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleAddReaction(msg.id, emoji)}
                                      className="p-1 hover:scale-125 transition-transform text-xs cursor-pointer"
                                      title={`React ${emoji}`}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>

                                {/* Reply Button */}
                                <button
                                  onClick={() =>
                                    setReplyingTo({
                                      id: msg.id,
                                      sender_name: msg.sender_name || msg.sender_username,
                                      content: msg.content,
                                    })
                                  }
                                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                                  title="Reply"
                                >
                                  <Reply className="h-3.5 w-3.5" />
                                </button>

                                {/* Copy Button with immediate inline check feedback */}
                                <button
                                  onClick={() => handleCopyMessage(msg.id, msg.content)}
                                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                                  title="Copy text"
                                >
                                  {isCopied ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>

                                {/* Turn into Task Button */}
                                <button
                                  onClick={() => {
                                    const clean = msg.content.startsWith("> Replying to @")
                                      ? msg.content.split("\n\n").slice(1).join("\n\n")
                                      : msg.content;
                                    setTaskModalPrefill({
                                      title: clean.length > 70 ? clean.slice(0, 70) + "..." : clean,
                                      description: `Created from message by @${msg.sender_name || msg.sender_username}:\n"${clean}"`,
                                    });
                                    setIsTaskModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-cyan-500/10 transition cursor-pointer"
                                  title="Turn into Task"
                                >
                                  <CheckSquare className="h-3.5 w-3.5" />
                                </button>

                                {/* Edit Button for own messages */}
                                {isMyMessage && (
                                  <button
                                    onClick={() => {
                                      setEditingMsgId(msg.id);
                                      setEditInput(msg.content);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                                    title="Edit message"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                )}

                                {/* Delete Button */}
                                {(isMyMessage || canDeleteAny) && (
                                  <button
                                    onClick={async () => {
                                      if (confirm("Delete this message?")) {
                                        try {
                                          await deleteMessage(msg.id);
                                        } catch (err) {
                                          console.error("Failed to delete message:", err);
                                        }
                                      }
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
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

        {/* 3. Floating Jump-to-bottom & New Messages Indicator */}
        {isScrolledUp && (
          <div className="absolute bottom-24 right-6 z-20 flex flex-col items-end space-y-2">
            {newMessagesCount > 0 ? (
              <button
                onClick={scrollToBottom}
                className="btn-interactive flex items-center space-x-1.5 rounded-full bg-brand-600 hover:bg-brand-500 text-white px-3.5 py-2 text-xs font-semibold shadow-2xl border border-brand-500/30 transition cursor-pointer"
              >
                <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
                <span>{newMessagesCount} new messages</span>
              </button>
            ) : (
              <button
                onClick={scrollToBottom}
                className="btn-interactive h-9 w-9 rounded-full bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white flex items-center justify-center shadow-xl border border-slate-800 transition cursor-pointer"
                title="Jump to latest messages"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* 4. Active Typers Indicator */}
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

        {/* 5. Mentions Autocomplete Popup */}
        {mentionQuery !== null && mentionSuggestions.length > 0 && (
          <div className="mx-6 mb-2 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 max-h-40 overflow-y-auto space-y-1 z-20 animate-slide-down">
            <div className="text-[10px] font-mono text-slate-500 px-2 py-0.5 uppercase tracking-wider">
              Group Members
            </div>
            {mentionSuggestions.map((uname, idx) => (
              <div
                key={uname}
                onClick={() => insertMention(uname)}
                className={`px-2.5 py-1.5 rounded-lg text-xs cursor-pointer flex items-center justify-between transition ${
                  idx === selectedMentionIndex
                    ? "bg-brand-600/20 text-brand-400 font-semibold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span>@{uname}</span>
                <span className="text-[10px] text-slate-500 font-mono">Insert</span>
              </div>
            ))}
          </div>
        )}

        {/* 6. Quoted Reply Banner */}
        {replyingTo && (
          <div className="px-6 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300 animate-slide-down">
            <div className="flex items-center space-x-2 min-w-0">
              <Reply className="h-3.5 w-3.5 text-brand-400 shrink-0" />
              <span className="text-slate-400">Replying to</span>
              <span className="font-semibold text-white">@{replyingTo.sender_name}:</span>
              <span className="truncate italic text-slate-400 max-w-xs sm:max-w-md">
                "{replyingTo.content}"
              </span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* 7. Message Input Bar or Request Actions */}
        <div className="border-t border-slate-800 bg-slate-900 px-4 sm:px-6 py-3.5 shrink-0">
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
                  className="btn-interactive flex-1 md:flex-initial rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold px-4 py-2 text-xs transition cursor-pointer text-center"
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
                  className="btn-interactive flex-1 md:flex-initial rounded-lg bg-slate-800 hover:bg-rose-950/20 hover:text-rose-400 hover:border-rose-900/30 text-slate-300 font-semibold px-4 py-2 text-xs transition border border-transparent cursor-pointer text-center"
                >
                  Block
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex items-center space-x-2 sm:space-x-3">
              <input
                ref={inputRef}
                id="chat-message-input"
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                placeholder={
                  replyingTo
                    ? `Replying to @${replyingTo.sender_name}...`
                    : "Write an encrypted message (type @ to mention, ↑ to edit last)..."
                }
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button
                id="chat-send-btn"
                type="submit"
                disabled={!input.trim()}
                className="btn-interactive flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-40 transition cursor-pointer shrink-0"
                title="Send message (Enter)"
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

      {/* Related Workspace Work Split Side Panel */}
      {showRelatedWork && (
        <div className="w-80 border-l border-slate-800 bg-slate-900/95 flex flex-col h-full z-20 shrink-0 shadow-2xl animate-fade-in select-none">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="h-7 w-7 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                <CheckSquare className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h4 className="font-display font-semibold text-xs text-white">Workspace Tasks</h4>
                <p className="text-[10px] text-slate-400 truncate">
                  {activeWorkspace ? activeWorkspace.name : "Active Workspace"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRelatedWork(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-3 border-b border-slate-800/80 bg-slate-950/40">
            <button
              onClick={() => {
                setTaskModalPrefill(null);
                setIsTaskModalOpen(true);
              }}
              className="btn-interactive w-full py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-brand-500/20 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create New Task</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-2 leading-tight">
              Hover any message and tap <CheckSquare className="h-3 w-3 inline text-cyan-400 mx-0.5" /> to convert it into a task.
            </p>
          </div>

          {/* Tasks List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {tasks.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-2">
                <CheckSquare className="h-8 w-8 text-slate-700 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">No tasks recorded</p>
                <p className="text-[10px] text-slate-500">Turn conversation discussions into tasks to track them here and across the team Kanban.</p>
              </div>
            ) : (
              tasks.slice(0, 15).map((task) => {
                const isCompleted = task.status === "COMPLETED";
                const isReview = task.status === "IN_REVIEW";
                const isInProgress = task.status === "IN_PROGRESS";
                
                return (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 space-y-2 transition shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className={`text-xs font-medium text-slate-200 leading-snug line-clamp-2 ${isCompleted ? "line-through text-slate-500" : ""}`}>
                        {task.title}
                      </h5>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold shrink-0 ${
                          task.priority === "URGENT" || task.priority === "HIGH"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : task.priority === "MEDIUM"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/50">
                      <span
                        className={`font-semibold ${
                          isCompleted
                            ? "text-emerald-400"
                            : isReview
                            ? "text-purple-400"
                            : isInProgress
                            ? "text-blue-400"
                            : "text-slate-400"
                        }`}
                      >
                        {task.status.replace("_", " ")}
                      </span>

                      <div className="flex items-center space-x-1">
                        {!isCompleted && (
                          <button
                            onClick={() => moveTaskStatus(task.id, isReview ? "COMPLETED" : "IN_REVIEW")}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-[9px]"
                          >
                            {isReview ? "Mark Done" : "Move to Review"}
                          </button>
                        )}
                        <button
                          onClick={() => setActiveTask(task)}
                          className="p-1 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                          title="View Details"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
