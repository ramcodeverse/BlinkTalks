import React, { useState } from "react";
import { useChatStore } from "../store/chatStore.ts";
import { X, User, AtSign, BookOpen, Shield, LogOut, Check, Loader2 } from "lucide-react";

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { user, updateProfile, logout } = useChatStore();
  
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await updateProfile(displayName.trim(), bio.trim());
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="settings-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-slate-100">
      <div id="settings-card" className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-fade-in relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2 text-brand-400">
            <User className="h-5 w-5" />
            <h2 className="font-display text-lg font-bold text-white">Profile Settings</h2>
          </div>
          <button
            id="close-settings-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-900/50 bg-green-950/20 p-3 text-xs text-green-400 flex items-center space-x-2">
            <Check className="h-4 w-4" />
            <span>Profile settings synchronized successfully!</span>
          </div>
        )}

        {/* Profile Card View */}
        <div className="flex items-center space-x-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
          <div className="h-14 w-14 rounded-2xl bg-brand-600 flex items-center justify-center font-display font-bold text-white text-xl">
            {user?.display_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-white truncate">{user?.display_name}</h3>
            <p className="font-mono text-xs text-brand-400 truncate">@{user?.username}</p>
            <div className="flex items-center space-x-1.5 mt-1">
              <Shield className="h-3 w-3 text-slate-500" />
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{user?.role} Rank</span>
            </div>
          </div>
        </div>

        {/* Form Panel */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Display Name */}
          <div className="relative">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Display Name</label>
            <div className="flex items-center">
              <User className="absolute left-3 h-4 w-4 text-slate-500" />
              <input
                id="settings-display-name"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pr-4 pl-10 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Display Name"
              />
            </div>
          </div>

          {/* Biography / Bio */}
          <div className="relative">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Bio (Biography)</label>
            <div className="flex items-start">
              <BookOpen className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <textarea
                id="settings-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pr-4 pl-10 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
                placeholder="A brief description about yourself..."
              />
            </div>
          </div>

          {/* Save Profile Button */}
          <button
            id="settings-save-btn"
            type="submit"
            disabled={loading}
            className="flex w-full justify-center items-center space-x-2 rounded-xl bg-brand-600 hover:bg-brand-500 py-2.5 text-xs font-semibold text-white transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Updating registry...</span>
              </>
            ) : (
              <span>Save Profile Settings</span>
            )}
          </button>
        </form>

        {/* LOGOUT AREA */}
        <div className="border-t border-slate-800 pt-4 mt-2">
          {showLogoutConfirm ? (
            <div className="rounded-xl border border-red-950 bg-red-950/20 p-4 space-y-3 text-xs animate-fade-in">
              <span className="font-bold text-red-400 block">⚠️ Terminate Session?</span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Are you sure you want to sign out? This will disconnect your active WebSocket connections and clear your session keys.
              </p>
              <div className="flex space-x-2">
                <button
                  id="settings-confirm-logout-btn"
                  onClick={logout}
                  className="flex-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold py-2 cursor-pointer text-xs"
                >
                  Yes, Log Out
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-2 cursor-pointer text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              id="settings-logout-trigger-btn"
              onClick={() => setShowLogoutConfirm(true)}
              className="flex w-full items-center justify-center space-x-2 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 py-2.5 text-xs font-semibold transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out / Sign Out</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
