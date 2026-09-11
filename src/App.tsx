import React, { useEffect, useState } from "react";
import { useChatStore, API_BASE } from "./store/chatStore.ts";
import AuthScreen from "./components/AuthScreen.tsx";
import LandingPage from "./components/LandingPage.tsx";
import AppHeader from "./components/AppHeader.tsx";
import MainSidebar, { NavItem } from "./components/MainSidebar.tsx";
import Sidebar from "./components/Sidebar.tsx";
import ChatArea from "./components/ChatArea.tsx";
import AdminDashboard from "./components/AdminDashboard.tsx";
import SettingsModal from "./components/SettingsModal.tsx";
import NotificationsModal from "./components/NotificationsModal.tsx";
import CommandPalette from "./components/CommandPalette.tsx";
import KeyboardShortcutsModal from "./components/KeyboardShortcutsModal.tsx";
import WorkspaceView from "./components/workspace/WorkspaceView.tsx";
import WorkspaceModal from "./components/workspace/WorkspaceModal.tsx";
import OnboardingModal from "./components/workspace/OnboardingModal.tsx";
import { useWorkspaceStore } from "./store/workspaceStore.ts";
import { ToastProvider } from "./components/Toast.tsx";
import { Shield, Loader2, Wifi, WifiOff } from "lucide-react";

export default function App() {
  const { user, initializeAuth, logout, connectionStatus } = useChatStore();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [view, setView] = useState<"landing" | "auth" | "app">("landing");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [activeNav, setActiveNav] = useState<NavItem>("workspace");
  
  // Modals & UI States
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [maintenance, setMaintenance] = useState<{ active: boolean; endTime: string | null } | null>(null);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  // Monitor connection status changes to display transient online toast
  const prevStatusRef = React.useRef(connectionStatus);
  useEffect(() => {
    if (prevStatusRef.current !== "connected" && connectionStatus === "connected") {
      setShowOnlineToast(true);
      const timer = setTimeout(() => setShowOnlineToast(false), 3000);
      return () => clearTimeout(timer);
    }
    prevStatusRef.current = connectionStatus;
  }, [connectionStatus]);

  // Global hotkey listeners for Ctrl+K and ?
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      } else if (e.key === "?" && !isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setShowShortcuts(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth().then(() => {
      setCheckingAuth(false);
    });
  }, [initializeAuth]);

  // When user is authenticated and was on landing or auth, default to app
  useEffect(() => {
    if (user && view === "auth") {
      setView("app");
    }
  }, [user, view]);

  const checkMaintenance = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/maintenance/status`);
      if (res.ok) {
        const data = await res.json();
        setMaintenance(data);
      }
    } catch (err) {
      console.error("Failed to check maintenance status:", err);
    }
  };

  useEffect(() => {
    checkMaintenance();
    const interval = setInterval(checkMaintenance, 10000);
    return () => clearInterval(interval);
  }, []);

  if (checkingAuth) {
    return (
      <div id="loading-viewport" className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="text-center space-y-4">
          <Loader2 className="mx-auto h-10 w-10 text-brand-500 animate-spin" />
          <h2 className="font-display font-semibold text-sm tracking-widest text-slate-200 uppercase">Synchronizing Credentials</h2>
          <p className="text-xs text-slate-600">Resolving secure session keys...</p>
        </div>
      </div>
    );
  }

  // If maintenance mode is active, block non-admin users
  if (maintenance?.active && (!user || user.role !== "admin")) {
    if (showAdminAuth) {
      return (
        <ToastProvider>
          <div className="relative">
            <div className="absolute top-4 left-4 z-50">
              <button
                onClick={() => setShowAdminAuth(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
              >
                ← Back to Maintenance Screen
              </button>
            </div>
            <AuthScreen defaultIsLogin={true} />
          </div>
        </ToastProvider>
      );
    }

    return (
      <div id="maintenance-viewport" className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100 p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500 animate-pulse" />
          <div className="mx-auto h-16 w-16 bg-amber-500/10 text-amber-500 flex items-center justify-center rounded-2xl border border-amber-500/20">
            <Shield className="h-8 w-8 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display font-extrabold text-2xl tracking-tight text-white">Under Update</h1>
            <p className="text-sm text-slate-400">We will be right back soon!</p>
          </div>
          
          {maintenance.endTime && (
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800/80 animate-pulse">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Expected Return Time</span>
              <span className="font-display font-bold text-amber-400 text-lg">{maintenance.endTime}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800/50">
            <button
              onClick={() => {
                logout();
                setShowAdminAuth(true);
              }}
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition cursor-pointer underline underline-offset-4"
            >
              System Administrator Login
            </button>
          </div>
          
          <div className="text-[10px] font-mono text-slate-600">
            BlinkTalk Systems Oversight
          </div>
        </div>
      </div>
    );
  }

  // Not logged in: Show landing or auth screen
  if (!user) {
    return (
      <ToastProvider>
        {view === "auth" ? (
          <AuthScreen
            onBackToLanding={() => setView("landing")}
            defaultIsLogin={authMode === "login"}
          />
        ) : (
          <LandingPage
            onGetStarted={() => {
              setAuthMode("signup");
              setView("auth");
            }}
            onSignIn={() => {
              setAuthMode("login");
              setView("auth");
            }}
          />
        )}
      </ToastProvider>
    );
  }

  // Authenticated user browsing the landing page
  if (view === "landing") {
    return (
      <ToastProvider>
        <LandingPage
          isAuthenticated={true}
          onGetStarted={() => setView("app")}
          onSignIn={() => setView("app")}
          onOpenApp={() => setView("app")}
        />
      </ToastProvider>
    );
  }

  // Authenticated Application Workspace
  return (
    <ToastProvider>
      <div id="app-viewport" className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans antialiased text-slate-100">
        
        {/* Maintenance active top banner for Admins */}
        {maintenance?.active && user.role === "admin" && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-400 text-center py-1.5 px-4 text-xs font-mono font-bold flex items-center justify-center space-x-2 animate-pulse select-none">
            <span>⚠️ SYSTEM IN MAINTENANCE MODE (ADMIN BYPASS ACTIVE) ⚠️</span>
            {maintenance.endTime && <span>• EXPECTED RETURN: {maintenance.endTime}</span>}
          </div>
        )}

        {/* Network Connection Warning Banner if offline or reconnecting */}
        {connectionStatus !== "connected" && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-center py-1 px-4 text-xs font-mono flex items-center justify-center space-x-2 select-none">
            <WifiOff className="h-3.5 w-3.5 animate-pulse text-rose-400" />
            <span>
              {connectionStatus === "reconnecting"
                ? "Reconnecting to BlinkTalks real-time gateway..."
                : "Gateway connection lost. Retrying automatically..."}
            </span>
          </div>
        )}

        {/* Transient Online Reconnected Toast */}
        {showOnlineToast && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 text-center py-1 px-4 text-xs font-mono flex items-center justify-center space-x-2 select-none animate-slide-down">
            <Wifi className="h-3.5 w-3.5 text-emerald-400" />
            <span>✓ Real-time connection restored. You are back online.</span>
          </div>
        )}

        {/* Application Header */}
        <AppHeader
          onOpenSettings={() => setShowSettings(true)}
          onOpenAdmin={() => setShowAdmin(true)}
          onOpenNotifications={() => setShowNotifications(true)}
          onGoToLanding={() => setView("landing")}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
          onOpenShortcuts={() => setShowShortcuts(true)}
          onToggleMobileSidebar={() => setMobileSidebarOpen((p) => !p)}
          onOpenTour={() => setShowTour(true)}
        />

        {/* Main Workspace Shell */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Unified Collapsible Sidebar */}
          <MainSidebar
            activeItem={activeNav}
            isMobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
            onSelect={(item: NavItem) => {
              if (item === "admin") {
                setShowAdmin(true);
              } else if (item === "settings") {
                setShowSettings(true);
              } else if (
                item === "workspace" ||
                item === "my-work" ||
                item === "kanban" ||
                item === "projects" ||
                item === "calendar" ||
                item === "team" ||
                item === "files" ||
                item === "announcements" ||
                item === "analytics"
              ) {
                setActiveNav(item);
                if (item === "workspace") {
                  useWorkspaceStore.getState().setActiveTab("dashboard");
                } else {
                  useWorkspaceStore.getState().setActiveTab(item as any);
                }
              } else {
                setActiveNav(item);
              }
            }}
            onOpenAdmin={() => setShowAdmin(true)}
            onOpenSettings={() => setShowSettings(true)}
            onOpenHelp={() => setShowShortcuts(true)}
            onOpenWorkspaceModal={() => setShowWorkspaceModal(true)}
          />

          {/* Conditional View Body: Workspace suite vs Real-time Chat Hub */}
          {activeNav === "workspace" ||
          activeNav === "my-work" ||
          activeNav === "kanban" ||
          activeNav === "projects" ||
          activeNav === "calendar" ||
          activeNav === "team" ||
          activeNav === "files" ||
          activeNav === "announcements" ||
          activeNav === "analytics" ? (
            <WorkspaceView
              onSwitchToChats={() => setActiveNav("chats")}
              onStartDirectChat={() => setActiveNav("chats")}
            />
          ) : (
            <div className="flex-1 flex overflow-hidden">
              {/* Primary Discovery & Conversation Sub-Sidebar */}
              <Sidebar 
                selectedTab={activeNav as any}
                onSelectTab={(tab) => setActiveNav(tab as any)}
                onOpenAdmin={() => setShowAdmin(true)} 
                onOpenSettings={() => setShowSettings(true)} 
              />

              {/* Main Chat Viewport Area */}
              <ChatArea />
            </div>
          )}
        </div>

        {/* Onboarding Tour Modal */}
        <OnboardingModal
          isOpen={showTour}
          onClose={() => setShowTour(false)}
        />

        {/* Workspace Switcher / Join / Create Modal */}
        <WorkspaceModal
          isOpen={showWorkspaceModal}
          onClose={() => setShowWorkspaceModal(false)}
        />

        {/* Governing Console Overlay Modal */}
        {showAdmin && user.role === "admin" && (
          <AdminDashboard onClose={() => setShowAdmin(false)} />
        )}

        {/* Profile Settings Overlay Modal */}
        {showSettings && (
          <SettingsModal onClose={() => setShowSettings(false)} />
        )}

        {/* Notifications Modal */}
        {showNotifications && (
          <NotificationsModal onClose={() => setShowNotifications(false)} />
        )}

        {/* Global Command Palette */}
        <CommandPalette
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenAdmin={() => setShowAdmin(true)}
          onOpenNotifications={() => setShowNotifications(true)}
          onOpenShortcuts={() => setShowShortcuts(true)}
          onGoToLanding={() => setView("landing")}
          onSelectNav={(item) => setActiveNav(item)}
        />

        {/* Keyboard Shortcuts Guide Modal */}
        {showShortcuts && (
          <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
        )}

      </div>
    </ToastProvider>
  );
}
