import React, { useState } from "react";
import {
  MessageSquare,
  Shield,
  Zap,
  Users,
  Lock,
  Search,
  Bell,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Globe,
  Smartphone,
  ChevronRight,
  Menu,
  X,
  Smile,
  ShieldCheck,
  Send,
  Eye,
  KeyRound,
  Layers,
  Heart
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onOpenApp?: () => void;
  isAuthenticated?: boolean;
}

export default function LandingPage({
  onGetStarted,
  onSignIn,
  onOpenApp,
  isAuthenticated = false,
}: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"features" | "security" | "about" | "contact" | "home">("home");

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-brand-500/30 selection:text-brand-200">
      {/* Dynamic Background Glow Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-blue-600/15 via-indigo-600/10 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 blur-3xl rounded-full" />
        <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/10 blur-3xl rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Sticky Glass Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => scrollToSection("hero")}
            className="flex items-center space-x-3 group cursor-pointer focus:outline-none"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 p-0.5 shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-brand-400 group-hover:text-brand-300 transition-colors" />
              </div>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-display font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                BlinkTalks
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              </span>
              <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">Sync & Connect</span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection("hero")}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("security")}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Security
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              About
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated && onOpenApp ? (
              <button
                onClick={onOpenApp}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-medium text-sm hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-500/25 transition duration-150 cursor-pointer flex items-center space-x-2"
              >
                <span>Launch App</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={onSignIn}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition duration-150 cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={onGetStarted}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-medium text-sm hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-500/20 active:scale-98 transition duration-150 cursor-pointer flex items-center space-x-1.5"
                >
                  <span>Get Started</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-6 bg-slate-950/95 border-b border-slate-800 space-y-3 animate-fade-in">
            <button
              onClick={() => scrollToSection("hero")}
              className="block w-full text-left py-2 text-slate-300 hover:text-white"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="block w-full text-left py-2 text-slate-300 hover:text-white"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="block w-full text-left py-2 text-slate-300 hover:text-white"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("security")}
              className="block w-full text-left py-2 text-slate-300 hover:text-white"
            >
              Security
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="block w-full text-left py-2 text-slate-300 hover:text-white"
            >
              About
            </button>
            <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignIn();
                }}
                className="w-full py-2.5 rounded-xl border border-slate-800 text-slate-200 text-center font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onGetStarted();
                }}
                className="w-full py-2.5 rounded-xl bg-brand-600 text-white text-center font-medium shadow-md"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative z-10 pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-medium shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-brand-400 animate-ping" />
                <span className="text-brand-300 font-semibold">BlinkTalks v2.5</span>
                <span className="text-slate-500">•</span>
                <span>Next-Gen Real-Time Communication</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
                Connect. Talk. <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                  Stay in Sync.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                BlinkTalks is a modern real-time communication platform built for private conversations, groups, and communities. Engineered for high performance, zero-latency delivery, and complete user privacy.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={onGetStarted}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-semibold text-base shadow-xl shadow-brand-500/20 hover:from-brand-500 hover:to-indigo-500 active:scale-98 transition cursor-pointer flex items-center justify-center space-x-2 group"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => scrollToSection("features")}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-base transition cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  <span>Explore Features</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0">
                <div className="text-left">
                  <div className="font-display font-bold text-xl text-white">0 ms</div>
                  <div className="text-xs text-slate-400">Target Latency</div>
                </div>
                <div className="text-left">
                  <div className="font-display font-bold text-xl text-white">256-bit</div>
                  <div className="text-xs text-slate-400">AES Encryption</div>
                </div>
                <div className="text-left">
                  <div className="font-display font-bold text-xl text-white">100%</div>
                  <div className="text-xs text-slate-400">Cloud Sync</div>
                </div>
              </div>
            </div>

            {/* Right Abstract Interactive Simulation */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl shadow-blue-500/10 backdrop-blur-xl">
                {/* Simulated Chat App Window */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                    <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>blinktalks.live</span>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                </div>

                {/* Floating chat bubbles inside simulated mockup */}
                <div className="space-y-3.5 py-1">
                  {/* Incoming */}
                  <div className="flex items-start space-x-2.5">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
                      BT
                    </div>
                    <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] text-xs text-slate-200 shadow-md">
                      <p className="font-semibold text-cyan-300 text-[11px] mb-0.5">BlinkTalks Core</p>
                      Welcome to BlinkTalks! Real-time syncing is active across your devices.
                      <div className="text-[10px] text-slate-400 mt-1 flex justify-end">Just now</div>
                    </div>
                  </div>

                  {/* Outgoing */}
                  <div className="flex items-start justify-end space-x-2.5">
                    <div className="bg-brand-600 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] text-xs text-white shadow-md">
                      Is the group chat ready for our team sprint?
                      <div className="text-[10px] text-brand-200 mt-1 flex items-center justify-end space-x-1">
                        <span>Just now</span>
                        <CheckCircle className="h-3 w-3 inline text-cyan-200" />
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
                      ME
                    </div>
                  </div>

                  {/* Incoming group response */}
                  <div className="flex items-start space-x-2.5">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
                      CP
                    </div>
                    <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] text-xs text-slate-200 shadow-md">
                      <p className="font-semibold text-purple-300 text-[11px] mb-0.5">BlinkTalk Community</p>
                      Yes! Over 1,200 members are synchronized. Invite link is live.
                      <div className="mt-1 flex items-center space-x-1.5">
                        <span className="text-[10px] bg-slate-700/80 px-2 py-0.5 rounded-full text-slate-300">👍 14</span>
                        <span className="text-[10px] bg-slate-700/80 px-2 py-0.5 rounded-full text-slate-300">🔥 9</span>
                      </div>
                    </div>
                  </div>

                  {/* Simulated typing indicator */}
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 pl-11 pt-1">
                    <span className="font-mono text-cyan-400 font-medium">Alex is typing</span>
                    <span className="flex space-x-1">
                      <span className="h-1.5 w-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 bg-brand-400 rounded-full animate-bounce" />
                    </span>
                  </div>
                </div>

                {/* Simulated Input Area */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center space-x-2">
                  <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 flex items-center justify-between">
                    <span>Message #community...</span>
                    <Smile className="h-4 w-4 text-slate-500" />
                  </div>
                  <button className="h-8 w-8 rounded-xl bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center transition">
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust / Value Section */}
      <section className="py-16 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-brand-400 mb-2 font-semibold">
            Built for Conversations That Matter
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white max-w-2xl mx-auto">
            Reliable infrastructure designed for seamless discussions and communities.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 text-left">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-brand-400 flex items-center justify-center mb-4">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="font-display font-semibold text-lg text-white mb-2">Secure Communication</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Military-grade transport and payload encryption keep your messages and files confidential.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-display font-semibold text-lg text-white mb-2">Real-Time Speed</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Persistent full-duplex WebSockets ensure instant delivery, reactions, and typing states.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-display font-semibold text-lg text-white mb-2">Group Collaboration</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Manage group hierarchies, role delegation, invite codes, and public discoverability effortlessly.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-display font-semibold text-lg text-white mb-2">Refined Experience</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Minimalist, distraction-free interface built with dark futuristic aesthetics and fluid micro-interactions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2 font-semibold">
            Engineered Capabilities
          </h2>
          <p className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Everything you need for private & group messaging
          </p>
          <p className="text-slate-400 mt-3 text-base">
            Crafted from the ground up to give creators, developers, and teams total control over their communication.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: MessageSquare,
              title: "Real-time Messaging",
              desc: "Instant message delivery powered by persistent WebSocket gateways with sub-second propagation.",
              color: "text-blue-400",
            },
            {
              icon: Lock,
              title: "Private Conversations",
              desc: "1-on-1 direct channels with cryptographic privacy guards and individual presence tracking.",
              color: "text-indigo-400",
            },
            {
              icon: Users,
              title: "Group Chats & Channels",
              desc: "Create vibrant community hubs or private workspace rooms with instant invite code access.",
              color: "text-purple-400",
            },
            {
              icon: ShieldCheck,
              title: "Role-based Group Governance",
              desc: "Comprehensive admin tools: assign roles, regulate member participation, and manage invite tokens.",
              color: "text-emerald-400",
            },
            {
              icon: Search,
              title: "Instant User & Group Discovery",
              desc: "Debounced global directory search allowing seamless discovery by handle or group topic.",
              color: "text-cyan-400",
            },
            {
              icon: Bell,
              title: "Smart Notifications",
              desc: "Real-time badge updates, audio feedback toggles, and organized notification centers.",
              color: "text-amber-400",
            },
            {
              icon: Zap,
              title: "Live Online Presence",
              desc: "Real-time online status indicators, last-seen timestamps, and active typing states.",
              color: "text-blue-400",
            },
            {
              icon: Smile,
              title: "Message Reactions & Replies",
              desc: "Express yourself with rapid emoji reactions, nested quoted replies, and context menus.",
              color: "text-pink-400",
            },
            {
              icon: Layers,
              title: "Edit, Delete & Message Actions",
              desc: "Full message lifecycle control: seamlessly edit typos, delete messages, or copy text in a tap.",
              color: "text-violet-400",
            },
            {
              icon: KeyRound,
              title: "Robust Session Management",
              desc: "JWT-based dual-token authorization with automatic silent session rotation and refresh handling.",
              color: "text-teal-400",
            },
            {
              icon: Smartphone,
              title: "Full Responsive Mobility",
              desc: "Engineered for desktop, tablet, and mobile browsers with native gesture touch feel.",
              color: "text-sky-400",
            },
            {
              icon: Globe,
              title: "Cross-Device Persistence",
              desc: "Seamlessly switch between phone, laptop, and desktop without losing chat state or unread logs.",
              color: "text-indigo-400",
            },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700/80 hover:bg-slate-900/80 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/5"
              >
                <div className={`h-10 w-10 rounded-xl bg-slate-800/80 border border-slate-700/60 ${f.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display font-semibold text-base text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How BlinkTalks Works */}
      <section id="how-it-works" className="py-20 bg-slate-900/30 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-brand-400 mb-2 font-semibold">
              Simple 3-Step Setup
            </h2>
            <p className="font-display text-3xl font-extrabold text-white">How BlinkTalks Works</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
              <div className="text-4xl font-extrabold font-mono text-brand-500/30 mb-4">01</div>
              <h3 className="font-display font-bold text-xl text-white mb-2">Create your account</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Sign up in seconds with your chosen username and credentials. Automatic session persistence takes care of the rest.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
              <div className="text-4xl font-extrabold font-mono text-indigo-500/30 mb-4">02</div>
              <h3 className="font-display font-bold text-xl text-white mb-2">Find people or join groups</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Discover friends by username handle or enter a group invite code like <code className="text-cyan-300 font-mono">community</code> to jump straight in.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
              <div className="text-4xl font-extrabold font-mono text-cyan-500/30 mb-4">03</div>
              <h3 className="font-display font-bold text-xl text-white mb-2">Start talking in sync</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Exchange messages, react with emojis, reply in threads, and experience lightning-fast real-time synchronization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium">
              <ShieldCheck className="h-4 w-4" />
              <span>Architectural Privacy Standard</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Privacy should be built in.
            </h2>

            <p className="text-slate-400 text-base leading-relaxed">
              We believe security is an architectural baseline, not a marketing buzzword. BlinkTalks incorporates strict payload-level encryption, role-verified socket authorization, and tamper-proof session tokens.
            </p>

            <div className="space-y-3.5 pt-2">
              {[
                "Strict dual-token authentication with secure JWT authorization",
                "Encrypted message content stored securely at rest and in transit",
                "Role-based group permissions enforced on both server and client",
                "Rate limiting and brute-force prevention on authentication routes",
                "Strict zero-leak directory searches without mass enumeration",
              ].map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 text-sm text-slate-300">
                  <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="font-mono text-xs text-slate-500 uppercase tracking-wider mb-6">
                Security Architecture Specification
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <KeyRound className="h-5 w-5 text-brand-400" />
                    <div>
                      <div className="font-semibold text-sm text-white">Cryptographic Hash Pipeline</div>
                      <div className="text-xs text-slate-400">Bcrypt Salt Factor 10 + SHA256</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">VERIFIED</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-cyan-400" />
                    <div>
                      <div className="font-semibold text-sm text-white">Transport Security (WSS / TLS)</div>
                      <div className="text-xs text-slate-400">RFC-6455 Secure WebSocket framing</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-md">ENFORCED</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Lock className="h-5 w-5 text-purple-400" />
                    <div>
                      <div className="font-semibold text-sm text-white">Symmetric Payload Encryption</div>
                      <div className="text-xs text-slate-400">AES-256-CBC cipher with unique IV vector</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded-md">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-slate-900/30 border-y border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-xs font-mono uppercase tracking-widest text-brand-400 font-semibold">
            About BlinkTalks
          </h2>
          <p className="font-display text-3xl sm:text-4xl font-extrabold text-white">
            A modern communication platform designed around fast, simple and secure conversations.
          </p>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            BlinkTalks was built to bridge the gap between lightweight casual messengers and developer-friendly collaboration platforms. By combining a clean, futuristic dark aesthetic with rock-solid server-side authority, BlinkTalks delivers an experience that feels instantaneous, intuitive, and reassuringly private.
          </p>
          <div className="pt-4 flex items-center justify-center space-x-6 text-sm text-slate-400">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span>Zero bloatware</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Zap className="h-4 w-4 text-brand-400" />
              <span>Low resource footprint</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Heart className="h-4 w-4 text-rose-400" />
              <span>User-first engineering</span>
            </span>
          </div>
        </div>
      </section>

      {/* Large Final CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="p-10 sm:p-16 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-2xl space-y-6">
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Ready to start talking?
            </h2>
            <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
              Join thousands of users communicating in real time with private and group messaging built for speed.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold text-base shadow-xl shadow-brand-500/25 hover:from-brand-500 hover:to-indigo-500 transition cursor-pointer"
              >
                Create Free Account
              </button>
              <button
                onClick={onSignIn}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-base transition cursor-pointer"
              >
                Sign In to BlinkTalks
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Column Professional Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Col 1 */}
            <div className="col-span-2 md:col-span-1 space-y-3">
              <div className="flex items-center space-x-2">
                <div className="h-7 w-7 rounded-lg bg-brand-600 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <span className="font-display font-bold text-base text-white">BlinkTalks</span>
              </div>
              <p className="text-xs text-slate-400">
                Connect. Talk. Stay in Sync.
              </p>
              <p className="text-[11px] text-slate-500">
                Modern real-time communication platform for private conversations, groups, and communities.
              </p>
            </div>

            {/* Col 2 */}
            <div className="space-y-2.5">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">Product</div>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><button onClick={() => scrollToSection("features")} className="hover:text-white transition">Features</button></li>
                <li><button onClick={() => scrollToSection("security")} className="hover:text-white transition">Security</button></li>
                <li><button onClick={() => scrollToSection("how-it-works")} className="hover:text-white transition">How It Works</button></li>
                <li><button onClick={onSignIn} className="hover:text-white transition">Groups & Communities</button></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div className="space-y-2.5">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">Company</div>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><button onClick={() => scrollToSection("about")} className="hover:text-white transition">About BlinkTalks</button></li>
                <li><span className="text-slate-500">Careers (Coming Soon)</span></li>
                <li><span className="text-slate-500">Changelog v2.5</span></li>
              </ul>
            </div>

            {/* Col 4 */}
            <div className="space-y-2.5">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">Architecture</div>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><span className="text-emerald-400 font-mono text-[11px]">WebSocket Gateway: Active</span></li>
                <li><span className="text-cyan-400 font-mono text-[11px]">Database Engine: SQLite / Prisma</span></li>
                <li><span className="text-slate-500">Zero Third-Party Trackers</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              © 2026 BlinkTalks. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-xs text-slate-400">
              <span className="hover:text-white cursor-pointer">Privacy Policy</span>
              <span className="hover:text-white cursor-pointer">Terms of Service</span>
              <span className="hover:text-white cursor-pointer">Security Disclosure</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
