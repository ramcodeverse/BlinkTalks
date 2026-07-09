import React, { useState, useEffect, useRef } from "react";
import { useChatStore, API_BASE, safeParseJson } from "../store/chatStore.ts";
import { Shield, Key, AtSign, User, Activity } from "lucide-react";

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUsernameManuallyEdited, setIsUsernameManuallyEdited] = useState(false);

  // Username availability check states
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  const { login, signup } = useChatStore();

  // Helper to find a verified unique, available username
  const findAvailableUsername = async (base: string) => {
    if (base.length < 3) return;
    let currentSuggestion = base;
    let isAvailable = false;
    let attempts = 0;
    
    while (!isAvailable && attempts < 10) {
      try {
        const res = await fetch(`${API_BASE}/api/users/check-username?q=${encodeURIComponent(currentSuggestion)}`);
        if (res.ok) {
          const data = await safeParseJson(res);
          if (data.available) {
            isAvailable = true;
            break;
          }
        }
      } catch (err) {
        // ignore
      }
      attempts++;
      const randomNum = Math.floor(100 + Math.random() * 900);
      currentSuggestion = `${base}_${randomNum}`.slice(0, 20);
    }
    
    if (isAvailable) {
      setUsername(currentSuggestion);
      setUsernameAvailable(true);
    }
  };

  // Auto-generate username from Display Name
  useEffect(() => {
    if (!isLogin && !isUsernameManuallyEdited) {
      const clean = displayName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 20);
      if (clean.length >= 1) {
        setUsername(clean);
      } else {
        setUsername("");
      }
    }
  }, [displayName, isLogin, isUsernameManuallyEdited]);

  // Debounced username checking pipeline
  useEffect(() => {
    if (isLogin) {
      setUsernameAvailable(null);
      return;
    }

    const clean = username.trim().toLowerCase().replace(/^@/, "");
    if (clean.length < 3 || !/^[a-z0-9_]+$/.test(clean)) {
      setUsernameAvailable(null);
      return;
    }

    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }

    setCheckingUsername(true);
    usernameCheckTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/check-username?q=${encodeURIComponent(clean)}`);
        if (res.ok) {
          const data = await safeParseJson(res);
          setUsernameAvailable(data.available);

          if (data.available === false && !isUsernameManuallyEdited) {
            await findAvailableUsername(clean);
          }
        } else {
          setUsernameAvailable(null);
        }
      } catch (err) {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 350);

    return () => {
      if (usernameCheckTimeout.current) clearTimeout(usernameCheckTimeout.current);
    };
  }, [username, isLogin, isUsernameManuallyEdited]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, "");

    try {
      if (isLogin) {
        await login(cleanUsername, password);
      } else {
        if (!usernameAvailable && usernameAvailable !== null) {
          throw new Error("Username is taken. Please choose another.");
        }
        if (password.length < 5) {
          throw new Error("Password must be at least 5 characters.");
        }
        await signup(cleanUsername, password, displayName.trim());
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-screen-container" className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div id="auth-card" className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl animate-fade-in">
        
        {/* Header Visuals */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/10 text-brand-500">
            <Shield className="h-8 w-8" />
          </div>
          <h2 className="mt-6 font-display text-3xl font-bold tracking-tight text-white">
            {isLogin ? "Sign In" : "Create Account"}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {isLogin
              ? "Access your flat Telegram-identity. No phone needed."
              : "Claim your unique @username and start chatting."}
          </p>
        </div>

        {/* Error Callout */}
        {error && (
          <div id="auth-error-box" className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-xs text-red-400">
            <p className="font-semibold">Authentication Blocked</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {/* Form panel */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            
            {/* Display Name Input (Signup only) */}
            {!isLogin && (
              <div className="relative">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Display Name</label>
                <div className="flex items-center">
                  <User className="absolute left-3 h-5 w-5 text-slate-500" />
                  <input
                    id="signup-display-name"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pr-4 pl-10 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="e.g. Ramanikanta"
                  />
                </div>
              </div>
            )}

            {/* Unique Username Input */}
            <div className="relative">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Username (@)</label>
              <div className="flex items-center">
                <AtSign className="absolute left-3 h-5 w-5 text-slate-500" />
                <input
                  id="auth-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.trim());
                    setIsUsernameManuallyEdited(true);
                  }}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pr-4 pl-10 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="Admin"
                />
              </div>

              {/* Real-time username validation indicators */}
              {!isLogin && username.trim().length > 0 && (
                <div className="mt-1 text-xs px-1">
                  {checkingUsername ? (
                    <span className="text-slate-500 animate-pulse">Checking availability...</span>
                  ) : usernameAvailable === true ? (
                    <span className="text-green-400">✓ @{username.replace(/^@/, "").toLowerCase()} is available</span>
                  ) : usernameAvailable === false ? (
                    <span className="text-red-400">✗ Username is taken or invalid</span>
                  ) : (
                    <span className="text-slate-500">Must be 3+ characters (a-z, 0-9, _)</span>
                  )}
                </div>
              )}
            </div>

            {/* Password Input */}
            <div className="relative">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Password</label>
              <div className="flex items-center">
                <Key className="absolute left-3 h-5 w-5 text-slate-500" />
                <input
                  id="auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pr-4 pl-10 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

          </div>

          {/* Submit Trigger */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading || (!isLogin && usernameAvailable === false)}
            className="flex w-full justify-center rounded-xl bg-brand-600 py-3 px-4 text-sm font-semibold text-white hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 transition cursor-pointer"
          >
            {loading ? "Authenticating..." : isLogin ? "Sign In" : "Register Unique ID"}
          </button>
        </form>

        {/* View Toggler */}
        <div className="text-center mt-6">
          <button
            id="auth-toggle-btn"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setIsUsernameManuallyEdited(false);
              setUsername("");
              setDisplayName("");
              setPassword("");
            }}
            className="text-sm font-medium text-brand-500 hover:text-brand-400 cursor-pointer"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>



      </div>
    </div>
  );
}
