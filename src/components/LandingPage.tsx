import React, { useState, useEffect } from "react";
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
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  CheckSquare,
  FolderKanban,
  Calendar,
  Layers,
  Clock,
  Activity,
  Paperclip,
  Building,
  Check,
  User,
  Hash,
  Share2,
  FileText,
  Megaphone,
  BarChart3,
  Sliders,
  ExternalLink,
} from "lucide-react";

import HeroProductPreview from "./landing/HeroProductPreview.tsx";
import WorkManagementDemo from "./landing/WorkManagementDemo.tsx";
import InteractiveKanbanPreview from "./landing/InteractiveKanbanPreview.tsx";
import UseCasesSection from "./landing/UseCasesSection.tsx";
import SecurityArchitectureVisual from "./landing/SecurityArchitectureVisual.tsx";
import CommunicationFeaturesGrid from "./landing/CommunicationFeaturesGrid.tsx";
import InteractiveProductStepper from "./landing/InteractiveProductStepper.tsx";
import WorkspaceHubShowcase from "./landing/WorkspaceHubShowcase.tsx";
import ChatWorkIntegrationVisual from "./landing/ChatWorkIntegrationVisual.tsx";
import TeamMembersPresenceSection from "./landing/TeamMembersPresenceSection.tsx";
import CalendarFilesActivitySection from "./landing/CalendarFilesActivitySection.tsx";
import EngineeredCapabilitiesSection from "./landing/EngineeredCapabilitiesSection.tsx";

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
  const [activeTaskFilter, setActiveTaskFilter] = useState<string>("all");

  // Ensure page starts at top when loaded normally without sudden jumps
  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-brand-500/30 selection:text-brand-200">
      {/* Subtle Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-blue-600/15 via-indigo-600/10 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-[35%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 blur-3xl rounded-full" />
        <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/10 blur-3xl rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* 1. STICKY HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/85 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-display font-bold text-lg text-white tracking-tight">
                BlinkTalks
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-brand-500/10 text-brand-300 border border-brand-500/20">
                v2.5 Unified
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 text-xs font-semibold text-slate-300">
            <button onClick={() => scrollToSection("overview")} className="hover:text-white transition cursor-pointer">
              Product
            </button>
            <button onClick={() => scrollToSection("features")} className="hover:text-white transition cursor-pointer">
              Messaging
            </button>
            <button onClick={() => scrollToSection("workspaces")} className="hover:text-white transition cursor-pointer">
              Workspaces
            </button>
            <button onClick={() => scrollToSection("chat-work")} className="hover:text-white transition cursor-pointer">
              Chat + Work
            </button>
            <button onClick={() => scrollToSection("collaboration")} className="hover:text-white transition cursor-pointer">
              Team
            </button>
            <button onClick={() => scrollToSection("operations")} className="hover:text-white transition cursor-pointer">
              Calendar & Files
            </button>
            <button onClick={() => scrollToSection("capabilities")} className="hover:text-white transition cursor-pointer">
              Capabilities
            </button>
            <button onClick={() => scrollToSection("security")} className="hover:text-white transition cursor-pointer">
              Security
            </button>
            <button onClick={() => scrollToSection("how-it-works")} className="hover:text-white transition cursor-pointer">
              Setup
            </button>
          </nav>

          {/* Header Action Buttons */}
          <div className="hidden sm:flex items-center space-x-3">
            {isAuthenticated ? (
              <button
                onClick={onOpenApp}
                className="btn-interactive px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white text-xs font-bold transition shadow-md shadow-brand-500/20 cursor-pointer flex items-center space-x-1.5"
              >
                <span>Launch App</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={onSignIn}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={onGetStarted}
                  className="btn-interactive px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white text-xs font-bold transition shadow-md shadow-brand-500/20 cursor-pointer flex items-center space-x-1.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-4 pt-3 pb-6 bg-slate-950 border-b border-slate-800 space-y-3 animate-slide-down">
            <div className="flex flex-col space-y-2 text-sm font-medium text-slate-300">
              <button
                onClick={() => scrollToSection("overview")}
                className="text-left py-2 hover:text-white transition cursor-pointer"
              >
                Product Overview
              </button>
              <button
                onClick={() => scrollToSection("features")}
                className="text-left py-2 hover:text-white transition cursor-pointer"
              >
                Real-Time Messaging
              </button>
              <button
                onClick={() => scrollToSection("workspaces")}
                className="text-left py-2 hover:text-white transition cursor-pointer"
              >
                Workspaces & Kanban
              </button>
              <button
                onClick={() => scrollToSection("chat-work")}
                className="text-left py-2 hover:text-white transition cursor-pointer"
              >
                Chat + Work Integration
              </button>
              <button
                onClick={() => scrollToSection("collaboration")}
                className="text-left py-2 hover:text-white transition cursor-pointer"
              >
                Team Collaboration & Presence
              </button>
              <button
                onClick={() => scrollToSection("operations")}
                className="text-left py-2 hover:text-white transition cursor-pointer"
              >
                Calendar, Files & Activity
              </button>
              <button
                onClick={() => scrollToSection("capabilities")}
                className="text-left py-2 hover:text-white transition cursor-pointer"
              >
                Full Feature Capabilities
              </button>
              <button
                onClick={() => scrollToSection("security")}
                className="text-left py-2 hover:text-white transition cursor-pointer"
              >
                Security & Architecture
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-left py-2 hover:text-white transition cursor-pointer"
              >
                Setup & Onboarding
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="text-left py-2 hover:text-white transition cursor-pointer"
              >
                About
              </button>
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              <button
                onClick={onSignIn}
                className="w-full py-2.5 rounded-xl border border-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-900 transition cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={onGetStarted}
                className="w-full py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-500 transition cursor-pointer text-center"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          {/* Hero Content */}
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Version Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>BlinkTalks v2.5 • Next-Gen Communication & Collaboration</span>
            </div>

            {/* Headline */}
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.15]">
              Connect. Talk. <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                Collaborate.
              </span>{" "}
              Stay in Sync.
            </h1>

            {/* Supporting Subheadlines */}
            <div className="space-y-2">
              <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
                BlinkTalks is a modern real-time communication and collaboration platform built for private conversations, teams, projects, tasks, and communities.
              </p>
              <p className="text-xs sm:text-sm text-cyan-300/90 font-medium">
                From a quick conversation to a completed project — everything stays connected in one workspace.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={onGetStarted}
                className="btn-interactive w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-bold text-sm shadow-xl shadow-brand-600/25 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => scrollToSection("workspaces")}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-800 transition cursor-pointer"
              >
                Explore Workspaces
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="w-full sm:w-auto px-5 py-3 text-slate-400 hover:text-white font-semibold text-sm transition cursor-pointer"
              >
                See How It Works ↓
              </button>
            </div>
          </div>

          {/* 3. HERO VISUAL - REALISTIC WORKSPACE PREVIEW */}
          <div className="pt-4">
            <HeroProductPreview />
          </div>
        </div>
      </section>

      {/* 4. TRUST & PERFORMANCE METRICS */}
      <section className="py-12 border-y border-slate-800/80 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            <div className="space-y-1">
              <p className="font-display font-bold text-2xl sm:text-3xl text-white">&lt; 50 ms</p>
              <p className="text-xs text-slate-400 font-medium">Target Latency</p>
              <p className="text-[10px] text-slate-500">Persistent WebSocket frames</p>
            </div>

            <div className="space-y-1">
              <p className="font-display font-bold text-2xl sm:text-3xl text-cyan-300">256-bit</p>
              <p className="text-xs text-slate-400 font-medium">Symmetric Encryption</p>
              <p className="text-[10px] text-slate-500">AES-256-CBC payload guard</p>
            </div>

            <div className="space-y-1">
              <p className="font-display font-bold text-2xl sm:text-3xl text-emerald-400">100%</p>
              <p className="text-xs text-slate-400 font-medium">Persistent Cloud Sync</p>
              <p className="text-[10px] text-slate-500">Cross-device data continuity</p>
            </div>

            <div className="space-y-1">
              <p className="font-display font-bold text-2xl sm:text-3xl text-purple-400">Live</p>
              <p className="text-xs text-slate-400 font-medium">Presence & Typing</p>
              <p className="text-[10px] text-slate-500">Zero-lag socket indicators</p>
            </div>

            <div className="col-span-2 md:col-span-1 space-y-1">
              <p className="font-display font-bold text-2xl sm:text-3xl text-amber-400">Unified</p>
              <p className="text-xs text-slate-400 font-medium">Workspaces & Boards</p>
              <p className="text-[10px] text-slate-500">Chat + Kanban in one suite</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRODUCT OVERVIEW (01 - 06 FEATURE CARDS) */}
      <section id="overview" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-brand-400 uppercase tracking-wider">
              Comprehensive Platform
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
              Everything your team needs to stay in sync.
            </h2>
            <p className="text-sm text-slate-400">
              Replace fragmented tools with an all-in-one platform where conversations naturally connect to execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                title: "Real-Time Communication",
                desc: "Instant direct messages, group chats, topic channels, and presence indicators powered by high-throughput WebSockets.",
                icon: MessageSquare,
                color: "text-blue-400",
                border: "border-blue-500/20",
              },
              {
                num: "02",
                title: "Team Workspaces",
                desc: "Organized multi-workspace switcher for companies, startups, university projects, and creative communities.",
                icon: Building,
                color: "text-indigo-400",
                border: "border-indigo-500/20",
              },
              {
                num: "03",
                title: "Tasks & Assignments",
                desc: "Turn conversation action items into tracked tasks with assignees, due dates, priority tiers, and subtasks.",
                icon: CheckSquare,
                color: "text-cyan-400",
                border: "border-cyan-500/20",
              },
              {
                num: "04",
                title: "Kanban Projects",
                desc: "Visual sprint boards with 4 stage columns (To Do, In Progress, In Review, Done) to manage deliverables visually.",
                icon: FolderKanban,
                color: "text-purple-400",
                border: "border-purple-500/20",
              },
              {
                num: "05",
                title: "Team Collaboration",
                desc: "Threaded task comments, @mentions, shared notes, team announcements, and scheduled video meetings.",
                icon: Users,
                color: "text-emerald-400",
                border: "border-emerald-500/20",
              },
              {
                num: "06",
                title: "Files & Knowledge",
                desc: "Centralized file repository and markdown document editor to store company SOPs, specs, and design assets.",
                icon: FileText,
                color: "text-amber-400",
                border: "border-amber-500/20",
              },
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl bg-slate-900/60 border ${card.border} hover:border-slate-700 transition-all hover:translate-y-[-2px] space-y-4 group`}
                >
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                      <Icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-500">{card.num}</span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base text-white group-hover:text-cyan-200 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mt-2">
                      {card.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. COMMUNICATION FEATURES SECTION */}
      <section id="features" className="py-20 bg-slate-900/30 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              High-Velocity Messaging
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
              Built for Conversations That Matter.
            </h2>
            <p className="text-sm text-slate-400">
              Twelve dedicated real-time communication capabilities designed for high-performance teams and private chats.
            </p>
          </div>

          <CommunicationFeaturesGrid />
        </div>
      </section>

      {/* 7. WORKSPACE SECTION & ROLE GOVERNANCE */}
      <section id="workspaces" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-brand-400 uppercase tracking-wider">
              Multi-Tenant Architecture
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
              One Workspace. Everything Connected.
            </h2>
            <p className="text-sm text-slate-400">
              Bring conversations, projects, tasks, files, and people into one organized workspace with deterministic role-based boundaries.
            </p>
          </div>

          {/* Interactive Workspace Hub Showcase */}
          <WorkspaceHubShowcase />
        </div>
      </section>

      {/* 8. WORK MANAGEMENT (TURN CONVERSATIONS INTO WORK) */}
      <section className="py-16 bg-slate-900/20 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <WorkManagementDemo />
        </div>
      </section>

      {/* 9. TASK MANAGEMENT (TASKS WITHOUT THE BUSYWORK) */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              Actionable Work Items
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
              Tasks Without the Busywork.
            </h2>
            <p className="text-sm text-slate-400">
              Clear priorities, due dates, subtasks, and instant status updates that don't drown your team in administration.
            </p>
          </div>

          {/* Interactive Filter Pills */}
          <div className="flex items-center justify-center space-x-2 pb-2">
            {["all", "todo", "in_progress", "in_review", "completed"].map((f) => (
              <button
                key={f}
                onClick={() => setActiveTaskFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium uppercase font-mono transition cursor-pointer border ${
                  activeTaskFilter === f
                    ? "bg-brand-600 text-white border-brand-500"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                {f.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Realistic Task Attribute Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                title: "Refactor session storage & token refresh",
                status: "IN_PROGRESS",
                priority: "HIGH",
                assignee: "Alex Miller",
                due: "Tomorrow, 5:00 PM",
                project: "BlinkTalks v2.5",
                subtasks: "3 of 4 completed",
                category: "in_progress",
              },
              {
                title: "Design team workspace invite modal",
                status: "TODO",
                priority: "MEDIUM",
                assignee: "Sarah Jenkins",
                due: "Friday",
                project: "UI System",
                subtasks: "0 of 2 completed",
                category: "todo",
              },
              {
                title: "Security audit on payload encryption",
                status: "IN_REVIEW",
                priority: "HIGH",
                assignee: "Rahul Verma",
                due: "Today",
                project: "Core Security",
                subtasks: "2 of 2 completed",
                category: "in_review",
              },
            ]
              .filter((item) => activeTaskFilter === "all" || item.category === activeTaskFilter)
              .map((t, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${
                        t.priority === "HIGH"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {t.priority}
                    </span>
                    <span className="text-xs font-semibold text-blue-400 font-mono">
                      {t.status.replace("_", " ")}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-white">{t.title}</h4>
                    <p className="text-[11px] text-brand-300 mt-1">Project: {t.project}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <User className="h-3.5 w-3.5 text-cyan-400" /> {t.assignee}
                    </span>
                    <span className="font-mono text-[11px]">{t.subtasks}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* 10. INTERACTIVE KANBAN BOARD SECTION */}
      <section className="py-20 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-brand-400 uppercase tracking-wider">
              Visual Execution
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
              Move Work Forward With Kanban.
            </h2>
            <p className="text-sm text-slate-400">
              See exactly where every deliverable stands. Click any task action below to test real-time state movement.
            </p>
          </div>

          <InteractiveKanbanPreview />
        </div>
      </section>

      {/* 11. PROJECT MANAGEMENT & TIMELINE */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              Strategic Delivery
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
              Projects That Stay on Track.
            </h2>
            <p className="text-sm text-slate-400">
              Manage multi-week initiatives with clear progress bars, task counts, and visual milestone timelines.
            </p>
          </div>

          {/* 3 Project Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Website Redesign & Brand Hub",
                progress: 72,
                tasks: "18 / 25 Tasks",
                owner: "Alex Miller",
                color: "from-blue-500 to-indigo-500",
              },
              {
                title: "Mobile Client Native App",
                progress: 48,
                tasks: "12 / 25 Tasks",
                owner: "Sarah Jenkins",
                color: "from-indigo-500 to-purple-500",
              },
              {
                title: "WebSocket & API Infrastructure",
                progress: 91,
                tasks: "21 / 23 Tasks",
                owner: "Rahul Verma",
                color: "from-purple-500 to-cyan-500",
              },
            ].map((p, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-white">{p.title}</h4>
                  <span className="font-mono text-xs font-bold text-cyan-300">{p.progress}%</span>
                </div>

                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full bg-gradient-to-r ${p.color} rounded-full`}
                    style={{ width: `${p.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>{p.tasks}</span>
                  <span className="text-slate-300">Lead: {p.owner}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 18. PROJECT TIMELINE & MILESTONE TREE */}
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6 sm:p-10 space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                Sprint Milestone Progression
              </span>
              <h4 className="font-display font-bold text-xl sm:text-2xl text-white">
                Project Milestone Timeline
              </h4>
              <p className="text-xs text-slate-400">
                Track phase readiness from initial kickoff down to final production sign-off.
              </p>
            </div>

            {/* Tree Style Visualization */}
            <div className="max-w-2xl mx-auto rounded-2xl bg-slate-950 border border-slate-800 p-6 font-mono text-xs sm:text-sm space-y-3 shadow-xl">
              <div className="flex items-center space-x-2 text-cyan-300 font-bold">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>Project Start (Kickoff & Planning)</span>
              </div>
              <div className="text-slate-600 pl-1">│</div>

              <div className="flex items-center justify-between text-slate-300">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-600">├──</span>
                  <span className="font-semibold text-white">Authentication & Session Engine</span>
                </div>
                <span className="text-emerald-400 font-bold flex items-center gap-1 text-xs">
                  <Check className="h-3.5 w-3.5" /> Shipped
                </span>
              </div>
              <div className="text-slate-600 pl-1">│</div>

              <div className="flex items-center justify-between text-slate-300">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-600">├──</span>
                  <span className="font-semibold text-white">Dashboard & Task Management</span>
                </div>
                <span className="text-emerald-400 font-bold flex items-center gap-1 text-xs">
                  <Check className="h-3.5 w-3.5" /> Shipped
                </span>
              </div>
              <div className="text-slate-600 pl-1">│</div>

              <div className="flex items-center justify-between text-cyan-300">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-600">├──</span>
                  <span className="font-semibold text-cyan-200">Real-Time WebSocket Messaging</span>
                </div>
                <span className="text-cyan-400 font-bold flex items-center gap-1 text-xs">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping mr-1" />
                  In Progress (91%)
                </span>
              </div>
              <div className="text-slate-600 pl-1">│</div>

              <div className="flex items-center justify-between text-slate-400">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-600">├──</span>
                  <span>Security & Penetration Audit</span>
                </div>
                <span className="text-amber-400 text-xs font-semibold">Queued (Sep 22)</span>
              </div>
              <div className="text-slate-600 pl-1">│</div>

              <div className="flex items-center justify-between text-slate-500">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-600">└──</span>
                  <span>Production Launch & Regional Deploy</span>
                </div>
                <span className="text-slate-500 text-xs font-mono">Milestone Final</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 21. CHAT + WORK INTEGRATION (SPLIT INTERFACE) */}
      <section id="chat-work" className="py-20 lg:py-28 bg-slate-900/20 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ChatWorkIntegrationVisual />
        </div>
      </section>

      {/* 19 & 20. TEAM COLLABORATION & PRESENCE */}
      <section id="collaboration" className="py-20 lg:py-28 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TeamMembersPresenceSection />
        </div>
      </section>

      {/* 22, 23, 24, 25. CALENDAR, FILES, REAL-TIME ACTIVITY & NOTIFICATIONS */}
      <section id="operations" className="py-20 lg:py-28 bg-slate-900/20 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CalendarFilesActivitySection />
        </div>
      </section>

      {/* 26. ENGINEERED CAPABILITIES MATRIX */}
      <section id="capabilities" className="py-20 lg:py-28 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EngineeredCapabilitiesSection />
        </div>
      </section>

      {/* 13. USE CASES */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <UseCasesSection />
        </div>
      </section>

      {/* 14. HOW IT WORKS (3-STEP SETUP) */}
      <section id="how-it-works" className="py-20 bg-slate-900/30 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              Zero Friction Onboarding
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
              Up and Running in 60 Seconds.
            </h2>
            <p className="text-sm text-slate-400">
              No complex provisioning scripts or credit cards required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Create your account",
                desc: "Sign up in seconds with a username and secure password. No tracking cookies or promotional junk.",
                icon: User,
              },
              {
                step: "02",
                title: "Create or join a workspace",
                desc: "Spin up a dedicated home for your company, team, or project, and invite colleagues with a 1-click code.",
                icon: Building,
              },
              {
                step: "03",
                title: "Talk, collaborate, get work done",
                desc: "Send encrypted messages, manage Kanban sprints, and track milestones from one unified window.",
                icon: Sparkles,
              },
            ].map((s, idx) => {
              const Icon = s.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-sm font-bold text-cyan-400">{s.step}</span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base text-white">{s.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mt-2">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 15. SECURITY ARCHITECTURE */}
      <section id="security" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Architectural Privacy Standard
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
              Enterprise Grade Security Without Enterprise Hassle.
            </h2>
            <p className="text-sm text-slate-400">
              Verified mathematical hashing, payload-level symmetric encryption, and multi-tenant SQL partition barriers.
            </p>
          </div>

          <SecurityArchitectureVisual />
        </div>
      </section>

      {/* 16. FROM CONVERSATION TO COMPLETION (INTERACTIVE STEPPER) */}
      <section className="py-16 bg-slate-900/20 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <InteractiveProductStepper />
        </div>
      </section>

      {/* 17. ABOUT BLINKTALKS & WHY TEAMS CHOOSE US */}
      <section id="about" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-brand-400 uppercase tracking-wider">
              Mission & Architecture
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
              Why We Built BlinkTalks
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Teams are tired of juggling four distinct tools: one for chat, one for tasks, one for documentation, and one for video. BlinkTalks bridges the gap between casual conversation and disciplined project execution in one cohesive, blazingly fast suite.
            </p>
          </div>

          {/* 8 Value Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "One Platform, Not Four",
                desc: "Eliminate context switching between Slack, Trello, Notion, and Discord.",
              },
              {
                title: "Real-Time Everything",
                desc: "Zero-refresh WebSocket sync across tasks, messages, presence, and boards.",
              },
              {
                title: "Lightweight & Clean",
                desc: "No corporate bloat, no 10-second desktop load times, just instant velocity.",
              },
              {
                title: "Privacy First",
                desc: "Encrypted payloads and zero ad tracking or metadata harvesting.",
              },
              {
                title: "Instant Adoption",
                desc: "Familiar modern UI means your team is productive on day one without training.",
              },
              {
                title: "Tailored For Builders",
                desc: "Monospaced code blocks, instant task conversion, and agile sprint columns.",
              },
              {
                title: "Zero Enterprise Lock-In",
                desc: "Full data portability with complete project and note export capabilities.",
              },
              {
                title: "Continuous Evolution",
                desc: "v2.5 brings unified workspace boards, calendar meetings, and live activity streams.",
              },
            ].map((v, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-cyan-400 shrink-0" />
                  <h4 className="font-semibold text-sm text-white">{v.title}</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pl-6">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 18. FINAL CALL TO ACTION */}
      <section className="py-20 bg-gradient-to-b from-slate-900/60 to-slate-950 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Start Collaborating Today</span>
          </div>

          <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight leading-tight">
            Ready to get work done?
          </h2>

          <p className="text-base text-slate-300 max-w-xl mx-auto">
            Bring your conversations, teams, projects, and tasks together in one real-time workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={onGetStarted}
              className="btn-interactive w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-bold text-sm shadow-xl shadow-brand-500/25 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Create Free Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onSignIn}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-sm border border-slate-800 transition cursor-pointer"
            >
              Sign In to Existing Account
            </button>
          </div>
        </div>
      </section>

      {/* 19. COMPREHENSIVE FOOTER */}
      <footer className="py-14 bg-slate-950 border-t border-slate-800/90 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Brand column */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 flex items-center justify-center text-white">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <span className="font-display font-bold text-base text-white">BlinkTalks</span>
              </div>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                The modern real-time communication and workspace platform uniting messaging, tasks, Kanban boards, and documents.
              </p>
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px]">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>All Systems Operational (WSS, REST, DB)</span>
              </div>
            </div>

            {/* Links Columns */}
            <div className="space-y-3">
              <h5 className="font-bold text-white uppercase tracking-wider text-[11px] font-mono">Product</h5>
              <ul className="space-y-2">
                <li><button onClick={() => scrollToSection("overview")} className="hover:text-white transition">Overview</button></li>
                <li><button onClick={() => scrollToSection("features")} className="hover:text-white transition">Communication</button></li>
                <li><button onClick={() => scrollToSection("workspaces")} className="hover:text-white transition">Workspaces</button></li>
                <li><button onClick={() => scrollToSection("how-it-works")} className="hover:text-white transition">How It Works</button></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h5 className="font-bold text-white uppercase tracking-wider text-[11px] font-mono">Collaboration</h5>
              <ul className="space-y-2">
                <li><button onClick={() => scrollToSection("workspaces")} className="hover:text-white transition">Kanban Boards</button></li>
                <li><button onClick={() => scrollToSection("collaboration")} className="hover:text-white transition">Team Channels</button></li>
                <li><button onClick={() => scrollToSection("collaboration")} className="hover:text-white transition">Meeting Schedules</button></li>
                <li><button onClick={() => scrollToSection("security")} className="hover:text-white transition">Security Standard</button></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h5 className="font-bold text-white uppercase tracking-wider text-[11px] font-mono">Access</h5>
              <ul className="space-y-2">
                <li><button onClick={onSignIn} className="hover:text-white transition">Sign In</button></li>
                <li><button onClick={onGetStarted} className="hover:text-white transition">Create Account</button></li>
                <li><button onClick={() => scrollToSection("about")} className="hover:text-white transition">About Mission</button></li>
                <li><span className="text-slate-600">v2.5.0 Production</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} BlinkTalks Inc. All rights reserved.</p>
            <div className="flex items-center space-x-6">
              <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
              <span className="hover:text-slate-400 cursor-pointer">Security Whitepaper</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
