import React, { useState, useEffect, useRef } from "react";
import { useChatStore, API_BASE, safeParseJson } from "../store/chatStore.ts";
import {
  Shield,
  Key,
  AtSign,
  User,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Lock,
  Zap,
  MessageSquare,
  Building2,
  AlertCircle,
  Loader2,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import CapabilityStrip from "./auth/CapabilityStrip.tsx";
import ProductPreviewMini from "./auth/ProductPreviewMini.tsx";
import PasswordStrengthIndicator, {
  evaluatePasswordStrength,
} from "./auth/PasswordStrengthIndicator.tsx";
import EmailVerificationView from "./auth/EmailVerificationView.tsx";
import OnboardingChoiceModal, {
  OnboardingUsageChoice,
} from "./auth/OnboardingChoiceModal.tsx";

interface AuthScreenProps {
  onBackToLanding?: () => void;
  defaultIsLogin?: boolean;
  inviteCode?: string | null;
}

interface WorkspaceInviteInfo {
  code: string;
  workspaceName: string;
  category?: string;
  role?: string;
  inviterName?: string;
}

export default function AuthScreen({
  onBackToLanding,
  defaultIsLogin = true,
  inviteCode: propInviteCode,
}: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(defaultIsLogin);
  const [viewState, setViewState] = useState<"form" | "verify_email" | "onboarding">("form");

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field interaction / validation tracking
  const [isUsernameManuallyEdited, setIsUsernameManuallyEdited] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Workspace invitation context
  const [inviteInfo, setInviteInfo] = useState<WorkspaceInviteInfo | null>(null);
  const [validatingInvite, setValidatingInvite] = useState(false);

  // Active capability preview tab on the left
  const [selectedCapability, setSelectedCapability] = useState<string>("chat");

  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  const emailCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  const { login, signup, verifyEmail, resendVerificationEmail } = useChatStore();

  // Detect invite code from props or URL
  useEffect(() => {
    let code = propInviteCode;
    if (!code && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      code = params.get("invite") || params.get("code") || params.get("join");
      if (!code) {
        const parts = window.location.pathname.split("/").filter(Boolean);
        if (parts[0] === "join" && parts.length >= 2) {
          code = parts[parts.length - 1];
        }
      }
    }

    if (code) {
      setValidatingInvite(true);
      fetch(`${API_BASE}/api/workspaces/validate-invite/${encodeURIComponent(code)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.valid && data.workspace) {
            setInviteInfo({
              code: data.invitation?.code || code,
              workspaceName: data.workspace.name,
              category: data.workspace.category || "Engineering & Product",
              role: data.invitation?.role || "Member",
              inviterName: data.invitation?.inviter?.display_name || undefined,
            });
            setIsLogin(false); // Default to signup when invited
          }
        })
        .catch(() => {
          // Graceful fallback if invite invalid or expired
        })
        .finally(() => {
          setValidatingInvite(false);
        });
    }
  }, [propInviteCode]);

  // Is demo/dev environment flag
  const isDev =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname.includes("-dev") ||
      window.location.search.includes("demo") ||
      import.meta.env.DEV);

  // Helper to prefill and log in as demo admin (discreet in dev mode only)
  const handleQuickDemoLogin = async () => {
    setUsername("admin");
    setPassword("369_5_1*");
    setError(null);
    setLoading(true);
    try {
      await login("admin", "369_5_1*");
    } catch (err: any) {
      setError(err.message || "Failed to authenticate as demo admin.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate username from Display Name if user hasn't typed their own
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

  // Debounced username availability check
  useEffect(() => {
    if (isLogin) {
      setUsernameAvailable(null);
      setUsernameError(null);
      return;
    }

    const clean = username.trim().toLowerCase().replace(/^@/, "");
    if (clean.length === 0) {
      setUsernameAvailable(null);
      setUsernameError(null);
      return;
    }

    if (clean.length < 3 || clean.length > 24 || !/^[a-z0-9_]+$/.test(clean)) {
      setUsernameAvailable(false);
      setUsernameError("Must be 3–24 characters with letters, numbers, and underscores.");
      return;
    }

    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }

    setCheckingUsername(true);
    setUsernameError(null);
    usernameCheckTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/users/check-username?q=${encodeURIComponent(clean)}`
        );
        if (res.ok) {
          const data = await safeParseJson(res);
          setUsernameAvailable(data.available);
          if (data.available === false) {
            setUsernameError("That username is already taken.");
          } else {
            setUsernameError(null);
          }
        } else {
          setUsernameAvailable(null);
        }
      } catch (err) {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 300);

    return () => {
      if (usernameCheckTimeout.current) clearTimeout(usernameCheckTimeout.current);
    };
  }, [username, isLogin]);

  // Debounced email availability and format check
  useEffect(() => {
    if (isLogin) {
      setEmailAvailable(null);
      setEmailError(null);
      return;
    }

    const clean = email.trim().toLowerCase();
    if (clean.length === 0) {
      setEmailAvailable(null);
      setEmailError(null);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clean)) {
      setEmailAvailable(false);
      setEmailError("Please enter a valid email address.");
      return;
    }

    if (emailCheckTimeout.current) {
      clearTimeout(emailCheckTimeout.current);
    }

    setCheckingEmail(true);
    setEmailError(null);
    emailCheckTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/users/check-email?q=${encodeURIComponent(clean)}`
        );
        if (res.ok) {
          const data = await safeParseJson(res);
          setEmailAvailable(data.available);
          if (data.available === false) {
            setEmailError("This email is already registered. Try signing in.");
          } else {
            setEmailError(null);
          }
        } else {
          setEmailAvailable(null);
        }
      } catch (err) {
        setEmailAvailable(null);
      } finally {
        setCheckingEmail(false);
      }
    }, 350);

    return () => {
      if (emailCheckTimeout.current) clearTimeout(emailCheckTimeout.current);
    };
  }, [email, isLogin]);

  // Validation evaluations
  const { strength: pwdStrength, hasMinLength: pwdMinLength } =
    evaluatePasswordStrength(password);
  const passwordsMatch =
    password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, "");

    if (isLogin) {
      if (!cleanUsername || !password) {
        setError("Please enter your username/email and password.");
        return;
      }

      setLoading(true);
      try {
        await login(cleanUsername, password);
      } catch (err: any) {
        setError(err.message || "Email or password is incorrect.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // SIGNUP VALIDATIONS
    if (!displayName.trim()) {
      setError("Please enter your display name.");
      return;
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 24 || !/^[a-z0-9_]+$/.test(cleanUsername)) {
      setError("Username must be 3–24 characters with letters, numbers, and underscores.");
      return;
    }

    if (usernameAvailable === false) {
      setError("Username is already taken. Please choose another.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError("Please provide a valid email address.");
      return;
    }

    if (emailAvailable === false) {
      setError("This email is already registered. Try signing in.");
      return;
    }

    if (password.length < 8) {
      setError("Choose a stronger password (at least 8 characters).");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await signup(
        cleanUsername,
        password,
        displayName.trim(),
        email.trim().toLowerCase(),
        inviteInfo?.code
      );
      // Advance to email verification step seamlessly
      setViewState("verify_email");
    } catch (err: any) {
      setError(err.message || "An error occurred while creating your account.");
    } finally {
      setLoading(false);
    }
  };

  // Email verification screen actions
  const handleResendEmail = async () => {
    if (!email) return;
    await resendVerificationEmail(email.trim().toLowerCase());
  };

  const handleSimulateVerified = async () => {
    if (!email) return;
    try {
      await verifyEmail(email.trim().toLowerCase());
      if (inviteInfo) {
        // Continue to workspace immediately
        window.location.reload();
      } else {
        setViewState("onboarding");
      }
    } catch (err: any) {
      setError(err.message || "Verification failed");
    }
  };

  const handleOnboardingComplete = (
    choice: OnboardingUsageChoice,
    action?: "explore" | "create_ws" | "join_ws"
  ) => {
    // If user clicked explore or created, state is updated in chatStore
    setViewState("form");
  };

  return (
    <div
      id="auth-screen-container"
      className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-center relative overflow-hidden px-4 py-8 sm:px-6 lg:px-8 selection:bg-blue-600/30 selection:text-cyan-200"
    >
      {/* Restrained ambient background lights */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-tl from-violet-600/10 via-cyan-600/5 to-transparent blur-3xl pointer-events-none rounded-full" />

      {/* Top Left Navigation: Back to BlinkTalks */}
      {onBackToLanding && (
        <div className="absolute top-5 left-5 sm:top-6 sm:left-6 z-30">
          <button
            id="back-to-landing-btn"
            type="button"
            onClick={onBackToLanding}
            className="group flex items-center space-x-2 px-3.5 py-2 rounded-full bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white transition-all duration-180 shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-180 group-hover:-translate-x-1 text-slate-400 group-hover:text-white" />
            <span>Back to BlinkTalks</span>
          </button>
        </div>
      )}

      {/* Main Two-Column Layout Container */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10 pt-10 sm:pt-4">
        {/* ========================================================= */}
        {/* LEFT COLUMN: BRANDING, CAPABILITIES & PREVIEW (~45%)      */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-6 lg:pr-2">
          {/* Brand Area */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20">
                <div className="h-full w-full bg-[#070b14] rounded-[14px] flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <span className="font-display font-extrabold text-2xl tracking-tight text-white">
                  BlinkTalks
                </span>
                <p className="text-[11px] font-mono font-medium text-cyan-300 tracking-wider">
                  Connect. Talk. Stay in Sync.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              Communication and collaboration, in one synchronized workspace.
            </p>

            {/* Capability indicators */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 font-mono">
              <div className="flex items-center space-x-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Real-time communication</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span>Team collaboration</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>Tasks & projects</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span>Secure workspaces</span>
              </div>
            </div>
          </div>

          {/* Main Headline & Supporting Text */}
          <div className="space-y-2 border-t border-slate-800/80 pt-4">
            {inviteInfo ? (
              <>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-cyan-300">
                  <Building2 className="h-3 w-3" />
                  <span>Workspace Invitation</span>
                </div>
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight leading-tight">
                  You’ve been invited to join{" "}
                  <span className="text-cyan-400">{inviteInfo.workspaceName}</span>
                </h1>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Create your account to continue to your team workspace and start collaborating.
                </p>
              </>
            ) : (
              <>
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight leading-tight">
                  {isLogin
                    ? "Welcome back to your synchronized workspace."
                    : "Create your BlinkTalks identity and start working in sync."}
                </h1>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Chat with your team, join communities, manage tasks, and collaborate from one connected workspace.
                </p>
              </>
            )}
          </div>

          {/* Product Capability Preview Strip (Interactive) */}
          <div className="hidden sm:block pt-1">
            <CapabilityStrip
              activeCapability={selectedCapability}
              onSelect={(id) => setSelectedCapability(id)}
            />
          </div>

          {/* Left-Side Live Miniature Product Preview */}
          <div className="hidden lg:block pt-1">
            <ProductPreviewMini />
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: AUTHENTICATION CARD (~55%)                  */}
        {/* ========================================================= */}
        <div className="lg:col-span-7">
          <div
            id="auth-card"
            className="w-full max-w-lg mx-auto rounded-[26px] border border-slate-800/90 bg-[#0d1527]/95 p-6 sm:p-9 shadow-2xl backdrop-blur-xl relative overflow-hidden transition-all"
          >
            {/* Ambient accent top bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 opacity-80" />

            {/* WORKSPACE INVITE CONTEXT CARD (When Invited) */}
            {inviteInfo && viewState === "form" && (
              <div
                id="workspace-invite-context-card"
                className="mb-6 rounded-2xl border border-blue-500/30 bg-blue-950/25 p-4 space-y-2 relative animate-fade-in text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-cyan-300 flex items-center space-x-1">
                    <Building2 className="h-3 w-3" />
                    <span>JOINING WORKSPACE</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                    Invited as: {inviteInfo.role || "Member"}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {inviteInfo.workspaceName}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {inviteInfo.category || "General Team Workspace"}
                  </p>
                </div>
                {inviteInfo.inviterName && (
                  <p className="text-[10px] text-slate-500 pt-0.5">
                    Invited by {inviteInfo.inviterName}
                  </p>
                )}
              </div>
            )}

            {/* VIEW STATE: EMAIL VERIFICATION */}
            {viewState === "verify_email" && (
              <EmailVerificationView
                email={email}
                inviteWorkspaceName={inviteInfo?.workspaceName}
                onOpenLogin={() => {
                  setViewState("form");
                  setIsLogin(true);
                }}
                onContinueToWorkspace={() => {
                  window.location.reload();
                }}
                onChangeEmail={() => {
                  setViewState("form");
                }}
                onResendEmail={handleResendEmail}
                onSimulateVerified={isDev ? handleSimulateVerified : undefined}
              />
            )}

            {/* VIEW STATE: FIRST-TIME ONBOARDING CHOICE */}
            {viewState === "onboarding" && (
              <OnboardingChoiceModal
                displayName={displayName}
                onComplete={handleOnboardingComplete}
              />
            )}

            {/* VIEW STATE: FORM (SIGN UP OR SIGN IN) */}
            {viewState === "form" && (
              <div className="space-y-6">
                {/* Header Visuals */}
                <div className="text-center space-y-1.5">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-cyan-400 border border-blue-500/20 shadow-sm">
                    <Shield className="h-6 w-6" />
                  </div>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-white">
                    {isLogin
                      ? "Sign In to BlinkTalks"
                      : inviteInfo
                      ? `Join ${inviteInfo.workspaceName}`
                      : "Create BlinkTalks ID"}
                  </h2>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    {isLogin
                      ? "Enter your credentials to access your connected workspace."
                      : "Create your account and start connecting, communicating and collaborating."}
                  </p>
                </div>

                {/* Form Error Callout */}
                {error && (
                  <div
                    id="auth-error-box"
                    className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3.5 text-xs text-rose-300 flex items-start space-x-2.5 animate-fade-in"
                  >
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-200">Authentication error</p>
                      <p className="mt-0.5 text-rose-300/90">{error}</p>
                    </div>
                  </div>
                )}

                {/* Main Auth Form */}
                <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                  {/* SIGN UP FIELDS (Precise requested order: Display Name, Username, Email, Password, Confirm Password) */}
                  {!isLogin && (
                    <>
                      {/* 1. DISPLAY NAME */}
                      <div>
                        <label
                          htmlFor="signup-display-name"
                          className="text-xs font-semibold text-slate-300 block mb-1.5"
                        >
                          Display Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                          <input
                            id="signup-display-name"
                            name="name"
                            type="text"
                            required
                            autoComplete="name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full rounded-xl border border-slate-800 bg-[#070b14]/90 py-2.5 pr-9 pl-10 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition duration-150"
                            placeholder="Alex Rivera"
                          />
                          {displayName.trim().length >= 2 && (
                            <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                          )}
                        </div>
                      </div>

                      {/* 2. USERNAME (@) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label
                            htmlFor="auth-username"
                            className="text-xs font-semibold text-slate-300 block"
                          >
                            Username (@)
                          </label>
                          <span className="text-[10px] font-mono text-slate-400">
                            3–24 chars
                          </span>
                        </div>
                        <div className="relative">
                          <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                          <input
                            id="auth-username"
                            name="username"
                            type="text"
                            required
                            autoComplete="username"
                            value={username}
                            onChange={(e) => {
                              setUsername(e.target.value.trim());
                              setIsUsernameManuallyEdited(true);
                            }}
                            className={`w-full rounded-xl border bg-[#070b14]/90 py-2.5 pr-9 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none transition duration-150 ${
                              usernameError
                                ? "border-rose-500/70 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                                : usernameAvailable === true
                                ? "border-emerald-500/60 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                : "border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            }`}
                            placeholder="alexrivera"
                          />
                          {checkingUsername && (
                            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
                          )}
                          {!checkingUsername && usernameAvailable === true && (
                            <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                          )}
                          {!checkingUsername && usernameError && (
                            <X className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-400" />
                          )}
                        </div>

                        {/* Username feedback message */}
                        {username.trim().length > 0 && (
                          <div className="mt-1 text-[11px] px-1 font-mono">
                            {checkingUsername ? (
                              <span className="text-slate-400 animate-pulse">
                                Checking availability...
                              </span>
                            ) : usernameAvailable === true ? (
                              <span className="text-emerald-400 flex items-center space-x-1">
                                <span>✓</span>
                                <span>@{username.replace(/^@/, "").toLowerCase()} is available</span>
                              </span>
                            ) : usernameError ? (
                              <span className="text-rose-400 flex items-center space-x-1">
                                <span>✕</span>
                                <span>{usernameError}</span>
                              </span>
                            ) : null}
                          </div>
                        )}
                      </div>

                      {/* 3. EMAIL ADDRESS */}
                      <div>
                        <label
                          htmlFor="signup-email"
                          className="text-xs font-semibold text-slate-300 block mb-1.5"
                        >
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                          <input
                            id="signup-email"
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full rounded-xl border bg-[#070b14]/90 py-2.5 pr-9 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none transition duration-150 ${
                              emailError
                                ? "border-rose-500/70 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                                : emailAvailable === true
                                ? "border-emerald-500/60 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                : "border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            }`}
                            placeholder="alex@example.com"
                          />
                          {checkingEmail && (
                            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
                          )}
                          {!checkingEmail && emailAvailable === true && (
                            <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                          )}
                          {!checkingEmail && emailError && (
                            <X className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-400" />
                          )}
                        </div>

                        {/* Email error message */}
                        {emailError && email.trim().length > 0 && (
                          <p className="mt-1 text-[11px] text-rose-400 px-1 font-mono">
                            ✕ {emailError}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {/* SIGN IN: USERNAME OR EMAIL INPUT */}
                  {isLogin && (
                    <div>
                      <label
                        htmlFor="auth-identifier"
                        className="text-xs font-semibold text-slate-300 block mb-1.5"
                      >
                        Username or Email
                      </label>
                      <div className="relative">
                        <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                        <input
                          id="auth-identifier"
                          name="username"
                          type="text"
                          required
                          autoComplete="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full rounded-xl border border-slate-800 bg-[#070b14]/90 py-2.5 pr-4 pl-10 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition duration-150"
                          placeholder="admin or alex@example.com"
                        />
                      </div>
                    </div>
                  )}

                  {/* 4. PASSWORD */}
                  <div>
                    <label
                      htmlFor="auth-password"
                      className="text-xs font-semibold text-slate-300 block mb-1.5"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                      <input
                        id="auth-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete={isLogin ? "current-password" : "new-password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-[#070b14]/90 py-2.5 pr-10 pl-10 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition duration-150"
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition duration-150 cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Password Strength Indicator (Signup Only) */}
                    {!isLogin && <PasswordStrengthIndicator password={password} />}
                  </div>

                  {/* 5. CONFIRM PASSWORD (Signup Only) */}
                  {!isLogin && (
                    <div>
                      <label
                        htmlFor="signup-confirm-password"
                        className="text-xs font-semibold text-slate-300 block mb-1.5"
                      >
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                        <input
                          id="signup-confirm-password"
                          name="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full rounded-xl border bg-[#070b14]/90 py-2.5 pr-10 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none transition duration-150 ${
                            passwordsMismatch
                              ? "border-rose-500/70 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                              : passwordsMatch
                              ? "border-emerald-500/60 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                              : "border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          }`}
                          placeholder="••••••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition duration-150 cursor-pointer"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {/* Password Match Message */}
                      {confirmPassword.length > 0 && (
                        <div className="mt-1 text-[11px] px-1 font-mono">
                          {passwordsMatch ? (
                            <span className="text-emerald-400 flex items-center space-x-1">
                              <span>✓</span>
                              <span>Passwords match</span>
                            </span>
                          ) : (
                            <span className="text-rose-400 flex items-center space-x-1">
                              <span>✕</span>
                              <span>Passwords don't match</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* PRIMARY ACTION BUTTON */}
                  <button
                    id="auth-submit-btn"
                    type="submit"
                    disabled={
                      loading ||
                      (!isLogin &&
                        (usernameAvailable === false ||
                          emailAvailable === false ||
                          passwordsMismatch))
                    }
                    className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 py-3 px-4 text-sm font-semibold text-white hover:from-blue-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0d1527] disabled:opacity-50 transition-all duration-180 shadow-lg shadow-blue-500/20 active:scale-[0.98] hover:-translate-y-0.5 cursor-pointer mt-3"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{isLogin ? "Signing in..." : "Creating account..."}</span>
                      </>
                    ) : (
                      <span>{isLogin ? "Sign In & Continue" : "Create Account & Continue"}</span>
                    )}
                  </button>
                </form>

                {/* DEVELOPMENT / DEMO SHORTCUT (Discreet, not an oversized banner on public signup) */}
                {isDev && (
                  <div className="pt-1 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400 font-mono">
                        Development / Demo:
                      </span>
                      <button
                        type="button"
                        onClick={handleQuickDemoLogin}
                        disabled={loading}
                        className="py-1 px-2.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 hover:text-white text-[11px] font-medium transition cursor-pointer flex items-center space-x-1.5"
                      >
                        <Zap className="h-3 w-3 text-cyan-400" />
                        <span>Admin Demo Login</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Switch between Sign in and Sign up */}
                <div className="text-center pt-2 border-t border-slate-800/80">
                  <button
                    id="auth-toggle-btn"
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError(null);
                      setIsUsernameManuallyEdited(false);
                      setUsername("");
                      setDisplayName("");
                      setEmail("");
                      setPassword("");
                      setConfirmPassword("");
                    }}
                    className="text-xs font-medium text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    {isLogin ? (
                      <span>
                        Don't have a BlinkTalks account?{" "}
                        <strong className="text-cyan-400 font-semibold hover:underline">
                          Create BlinkTalks ID
                        </strong>
                      </span>
                    ) : (
                      <span>
                        Already have a BlinkTalks account?{" "}
                        <strong className="text-cyan-400 font-semibold hover:underline">
                          Sign in
                        </strong>
                      </span>
                    )}
                  </button>
                </div>

                {/* Security and Trust Footer */}
                <p className="text-[10px] text-center text-slate-400 leading-relaxed font-mono">
                  Your account is securely managed through BlinkTalks authentication.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subtle bottom footer copyright and legal links */}
      <footer className="mt-8 text-center text-[11px] text-slate-400 font-mono space-x-3 relative z-10">
        <span>© 2026 BlinkTalks</span>
        <span>•</span>
        <span className="hover:text-slate-400 transition cursor-pointer">Privacy</span>
        <span>•</span>
        <span className="hover:text-slate-400 transition cursor-pointer">Terms</span>
        <span>•</span>
        <span className="hover:text-slate-400 transition cursor-pointer">Security</span>
      </footer>
    </div>
  );
}
