import React, { useEffect, useState } from "react";
import { useChatStore, API_BASE } from "./store/chatStore.ts";
import AuthScreen from "./components/AuthScreen.tsx";
import Sidebar from "./components/Sidebar.tsx";
import ChatArea from "./components/ChatArea.tsx";
import AdminDashboard from "./components/AdminDashboard.tsx";
import SettingsModal from "./components/SettingsModal.tsx";
import { Shield, AtSign, Loader2 } from "lucide-react";

export default function App() {
  const { user, initializeAuth, connectionStatus, logout } = useChatStore();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [maintenance, setMaintenance] = useState<{ active: boolean; endTime: string | null } | null>(null);
  const [showAdminAuth, setShowAdminAuth] = useState(false);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth().then(() => {
      setCheckingAuth(false);
    });
  }, [initializeAuth]);

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
        <div className="relative">
          <div className="absolute top-4 left-4 z-50">
            <button
              onClick={() => setShowAdminAuth(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
            >
              ← Back to Maintenance Screen
            </button>
          </div>
          <AuthScreen />
        </div>
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

  // If user is not authenticated, lock into Auth screen
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div id="app-viewport" className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans antialiased text-slate-100">
      
      {/* Maintenance active top banner for Admins */}
      {maintenance?.active && user.role === "admin" && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-400 text-center py-1.5 px-4 text-xs font-mono font-bold flex items-center justify-center space-x-2 animate-pulse select-none">
          <span>⚠️ SYSTEM IN MAINTENANCE MODE (ADMIN BYPASS ACTIVE) ⚠️</span>
          {maintenance.endTime && <span>• EXPECTED RETURN: {maintenance.endTime}</span>}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Primary Discovery Sidebar */}
        <Sidebar 
          onOpenAdmin={() => setShowAdmin(true)} 
          onOpenSettings={() => setShowSettings(true)} 
        />

        {/* Main chat viewport area */}
        <ChatArea />
      </div>

      {/* Governing Console Overlay Modal */}
      {showAdmin && user.role === "admin" && (
        <AdminDashboard onClose={() => setShowAdmin(false)} />
      )}

      {/* Profile Settings Overlay Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

    </div>
  );
}
