import React, { useState, useEffect, useRef } from "react";
import { useChatStore, API_BASE, safeParseJson } from "../store/chatStore.ts";
import {
  Shield,
  Key,
  AtSign,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Lock,
  Zap,
  MessageSquare
} from "lucide-react";

interface AuthScreenProps {
  onBackToLanding?: () => void;
  defaultIsLogin?: boolean;
}

export default function AuthScreen({ onBackToLanding, defaultIsLogin = true }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(defaultIsLogin);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUsernameManuallyEdited, setIsUsernameManuallyEdited] = useState(false);

  // Username availability check states
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  const { login, signup } = useChatStore();

  // Pre-fill demo admin credentials
  const handleQuickDemoLogin = async () => {
    setUsername("admin");
    setPassword("369_5_1*");
    setError(null);
    setLoading(true);
    try {
      await login("admin", "369_5_1*");
    } catch (err: any) {
      setError(err.message || "Failed to log in as admin demo");
    } finally {
      setLoading(false);
    }
  };

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
    <div id="auth-screen-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center relative overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-600/10 blur-3xl pointer-events-none rounded-full" />

      {/* Back to landing button */}
      {onBackToLanding && (
        <div className="absolute top-6 left-6 z-20">
          <button
            onClick={onBackToLanding}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to BlinkTalks</span>
          </button>
        </div>
      )}

      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Branding Column (Hidden on mobile) */}
        <div className="hidden lg:block lg:col-span-5 space-y-6 pr-4">
          <div className="flex items-center space-x-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 p-0.5 shadow-lg shadow-brand-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-brand-400" />
              </div>
            </div>
            <div>
              <span className="font-display font-extrabold text-2xl text-white">BlinkTalks</span>
              <p className="text-xs text-brand-300 font-mono">Connect. Talk. Stay in Sync.</p>
            </div>
          </div>

          <h2 className="font-display font-bold text-2xl text-white leading-snug">
            {isLogin ? "Welcome back to your real-time communication space." : "Create your unique identity and start messaging instantly."}
          </h2>

          <div className="space-y-3 text-xs text-slate-400">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Full-duplex WebSocket messaging</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>AES payload encryption</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Zero-phone-number privacy model</span>
            </div>
          </div>

          {/* Quick Demo Credentials Box */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Testing as Administrator:</span>
              <span className="font-mono text-cyan-400 font-semibold text-[11px]">@admin</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Click below to instantly populate and authenticate with the pre-seeded admin credentials.
            </p>
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span>1-Click Admin Demo Login</span>
            </button>
          </div>
        </div>

        {/* Right Authentication Card */}
        <div className="lg:col-span-7">
          <div id="auth-card" className="w-full max-w-md mx-auto space-y-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-7 sm:p-8 shadow-2xl backdrop-blur-xl animate-fade-in">
            {/* Header Visuals */}
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600/15 text-brand-400 border border-brand-500/30 mb-3">
                <Shield className="h-6 w-6" />
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-white">
                {isLogin ? "Sign In to BlinkTalks" : "Create BlinkTalks ID"}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {isLogin
                  ? "Enter your credentials to access your private and group conversations."
                  : "Pick your unique @handle to start real-time messaging."}
              </p>
            </div>

            {/* Error Callout */}
            {error && (
              <div id="auth-error-box" className="rounded-xl border border-red-500/30 bg-red-950/40 p-3.5 text-xs text-red-300 animate-fade-in">
                <p className="font-semibold text-red-200">Authentication Failed</p>
                <p className="mt-0.5">{error}</p>
              </div>
            )}

            {/* Form panel */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Display Name Input (Signup only) */}
              {!isLogin && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Display Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      id="signup-display-name"
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pr-4 pl-10 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition"
                      placeholder="e.g. Alex Rivera"
                    />
                  </div>
                </div>
              )}

              {/* Unique Username Input */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Username (@)</label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    id="auth-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value.trim());
                      setIsUsernameManuallyEdited(true);
                    }}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pr-4 pl-10 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition"
                    placeholder="admin"
                  />
                </div>

                {/* Real-time username validation indicators */}
                {!isLogin && username.trim().length > 0 && (
                  <div className="mt-1 text-xs px-1">
                    {checkingUsername ? (
                      <span className="text-slate-500 animate-pulse">Checking availability...</span>
                    ) : usernameAvailable === true ? (
                      <span className="text-emerald-400">✓ @{username.replace(/^@/, "").toLowerCase()} is available</span>
                    ) : usernameAvailable === false ? (
                      <span className="text-rose-400">✗ Username is taken or invalid</span>
                    ) : (
                      <span className="text-slate-500">Must be 3+ characters (a-z, 0-9, _)</span>
                    )}
                  </div>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pr-10 pl-10 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="auth-submit-btn"
                type="submit"
                disabled={loading || (!isLogin && usernameAvailable === false)}
                className="flex w-full justify-center rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 py-3 px-4 text-sm font-semibold text-white hover:from-brand-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 transition shadow-lg shadow-brand-500/20 active:scale-98 cursor-pointer mt-2"
              >
                {loading ? "Authenticating..." : isLogin ? "Sign In" : "Register & Start Chatting"}
              </button>
            </form>

            {/* Mobile demo login fallback button */}
            <div className="lg:hidden pt-2">
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={loading}
                className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5 text-cyan-400" />
                <span>1-Click Admin Demo Login (@admin)</span>
              </button>
            </div>

            {/* View Toggler */}
            <div className="text-center pt-2 border-t border-slate-800/80">
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
                className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition cursor-pointer"
              >
                {isLogin
                  ? "Don't have an account? Sign up now"
                  : "Already registered? Sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
