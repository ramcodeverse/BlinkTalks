import React, { useState, useEffect, useRef } from "react";
import {
  Rocket,
  Code,
  GraduationCap,
  GitBranch,
  Users,
  Briefcase,
  Globe2,
  FolderGit2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface UseCase {
  id: string;
  label: string;
  icon: any;
  title: string;
  tagline: string;
  bullets: string[];
  mockupSnippet: {
    workspace: string;
    channel: string;
    task: string;
    metric: string;
  };
}

const USE_CASES: UseCase[] = [
  {
    id: "startups",
    label: "Startups",
    icon: Rocket,
    title: "Move Fast Without Losing Context",
    tagline: "Speed, fast decisions, rapid product iteration, and daily engineering alignment in one home.",
    bullets: [
      "Zero context switching between customer feedback discussions and Jira-style boards",
      "Instant 1-click workspace invites for founding teams, advisors, and contractors",
      "Lightweight Kanban workflows tailored for weekly product sprints",
    ],
    mockupSnippet: {
      workspace: "Nova AI (Seed Stage)",
      channel: "#product-launches",
      task: "Ship v1.0 waitlist onboarding flow",
      metric: "7-day sprint velocity: 94%",
    },
  },
  {
    id: "software",
    label: "Software Teams",
    icon: Code,
    title: "Engineered for Developers & Builders",
    tagline: "Sprint planning, incident channels, PR reviews, and task dependencies without bloated tooling.",
    bullets: [
      "Turn bug reports from engineering channels into tracked tickets immediately",
      "Code snippet formatting and monospaced cryptographic verify hashes",
      "Milestone and sprint release tracking tied directly to team members",
    ],
    mockupSnippet: {
      workspace: "Platform Engineering",
      channel: "#incident-response",
      task: "Patch Redis connection pool timeout",
      metric: "MTTR: < 12 minutes",
    },
  },
  {
    id: "students",
    label: "Student Teams",
    icon: GraduationCap,
    title: "Hackathons & University Projects",
    tagline: "Stay organized across coursework, group assignments, and hackathon deadlines with zero setup cost.",
    bullets: [
      "No credit card, no complex server configuration — create a workspace in 10 seconds",
      "Shared document notes for brainstorms and slide deck prep",
      "Deadlines calendar with clear assignee accountability",
    ],
    mockupSnippet: {
      workspace: "CS490 Capstone Group",
      channel: "#final-deliverable",
      task: "Finalize system architecture diagrams",
      metric: "Submission: Due Friday 11:59 PM",
    },
  },
  {
    id: "opensource",
    label: "Open Source",
    icon: GitBranch,
    title: "Community Driven Collaboration",
    tagline: "Transparent discussions, contributor channels, and milestone planning for global projects.",
    bullets: [
      "Public topic channels for open RFC discussions and contributor Q&A",
      "Assign maintainers and community champions with granular roles",
      "Structured announcements to broadcast new releases and patch notes",
    ],
    mockupSnippet: {
      workspace: "Blink Ecosystem OSS",
      channel: "#rfc-architecture",
      task: "Review v2.6 websocket protocol PR",
      metric: "14 active maintainers online",
    },
  },
  {
    id: "communities",
    label: "Communities",
    icon: Users,
    title: "Vibrant Topic-Based Spaces",
    tagline: "Replace scattered Discord servers and messy chats with structured channels and shared knowledge.",
    bullets: [
      "Organized channels by interest, tech stack, or local chapter",
      "Pin critical resource links, event dates, and community guidelines",
      "Role-based moderation tools to keep discussions safe and friendly",
    ],
    mockupSnippet: {
      workspace: "Fullstack Founders Hub",
      channel: "#general-chat",
      task: "Community monthly demo day prep",
      metric: "1,200+ members connected",
    },
  },
  {
    id: "business",
    label: "Small Businesses",
    icon: Briefcase,
    title: "Team Chat & Operational Execution",
    tagline: "Keep customer orders, internal projects, and team updates moving without expensive enterprise fees.",
    bullets: [
      "Dedicated workspace for your company with private department channels",
      "Manage client deliverables and vendor communications cleanly",
      "Centralized files, guidelines, and company announcements",
    ],
    mockupSnippet: {
      workspace: "Apex Design Studio",
      channel: "#client-acme-corp",
      task: "Deliver brand identity asset package",
      metric: "Status: Ready for client sign-off",
    },
  },
  {
    id: "remote",
    label: "Remote Teams",
    icon: Globe2,
    title: "Asynchronous Clarity Across Time Zones",
    tagline: "Keep distributed teams aligned without endless meetings or unread 500-message chat walls.",
    bullets: [
      "Live presence and status indicators to know who is active across continents",
      "Persistent thread context so team members can wake up and catch up in 2 minutes",
      "Unified task boards that replace synchronous morning standup syncs",
    ],
    mockupSnippet: {
      workspace: "Distributed Core (12 Timezones)",
      channel: "#async-standup",
      task: "EMEA region load balancer testing",
      metric: "Live presence: 8 online now",
    },
  },
  {
    id: "projects",
    label: "Project Groups",
    icon: FolderGit2,
    title: "Focused, Time-Bound Initiatives",
    tagline: "Spin up a dedicated space for any high-stakes campaign, client launch, or cross-functional push.",
    bullets: [
      "Self-contained project workspace with its own tasks, files, and channels",
      "Clear milestone progress bars to track completion percentage in real time",
      "Archive or export project assets when the initiative finishes",
    ],
    mockupSnippet: {
      workspace: "Q4 Brand Redesign Push",
      channel: "#creative-reviews",
      task: "Export final vector illustration kit",
      metric: "Overall Project: 88% complete",
    },
  },
];

export default function UseCasesSection() {
  const [selectedId, setSelectedId] = useState<string>("startups");
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);

  const current = USE_CASES.find((u) => u.id === selectedId) || USE_CASES[0];

  // Auto-switch every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying || isHovered) return;

    const timer = setInterval(() => {
      setSelectedId((prev) => {
        const currentIndex = USE_CASES.findIndex((u) => u.id === prev);
        const nextIndex = (currentIndex + 1) % USE_CASES.length;
        return USE_CASES[nextIndex].id;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, isHovered]);

  // Only scroll the horizontal tab strip container without moving the browser window
  useEffect(() => {
    const container = tabsContainerRef.current;
    const activeBtn = tabRefs.current[selectedId];
    if (container && activeBtn) {
      const btnOffset = activeBtn.offsetLeft;
      const btnWidth = activeBtn.offsetWidth;
      const containerWidth = container.offsetWidth;
      container.scrollTo({
        left: btnOffset - containerWidth / 2 + btnWidth / 2,
        behavior: "smooth",
      });
    }
  }, [selectedId]);

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Adaptive Collaboration Profiles</span>
        </div>
        <h3 className="font-display font-bold text-2xl sm:text-3xl text-white">
          Built for Every Kind of Team.
        </h3>
        <p className="text-sm text-slate-400">
          Whether you are two founders building an MVP or a distributed team delivering complex software, BlinkTalks adapts to your exact workflow.
        </p>
      </div>

      {/* Horizontal Scrollable Tabs with 5s Progress Bar & Switch Animation */}
      <div
        ref={tabsContainerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="flex items-center space-x-2.5 overflow-x-auto pb-3 pt-1 scrollbar-none justify-start sm:justify-center px-2"
      >
        {USE_CASES.map((uc) => {
          const Icon = uc.icon;
          const isSelected = uc.id === selectedId;

          return (
            <button
              key={uc.id}
              ref={(el) => (tabRefs.current[uc.id] = el)}
              onClick={() => {
                setSelectedId(uc.id);
              }}
              className={`relative overflow-hidden flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer border shrink-0 ${
                isSelected
                  ? "bg-brand-600 text-white border-brand-400 shadow-lg shadow-brand-500/25 scale-[1.03]"
                  : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 transition-colors ${
                  isSelected ? "text-cyan-200" : "text-slate-400"
                }`}
              />
              <span>{uc.label}</span>

              {/* 5-Second Animated Progress Bar */}
              {isSelected && (
                <div
                  key={`${uc.id}-${isAutoPlaying && !isHovered}`}
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-300 to-white rounded-b-xl ${
                    isAutoPlaying && !isHovered ? "animate-progress-5s" : "w-full"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Display with Smooth Switch Animation */}
      <div
        key={selectedId}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6 sm:p-10 backdrop-blur-sm animate-use-case-switch transition-all duration-300 shadow-2xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Descriptions & Bullets */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-brand-400 uppercase tracking-wider">
                {current.label} Workspace
              </span>
              <h4 className="font-display font-bold text-2xl text-white">
                {current.title}
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {current.tagline}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {current.bullets.map((bullet, idx) => (
                <div key={idx} className="flex items-start space-x-3">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300">{bullet}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Live Workspace Snippet Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold text-white truncate max-w-[180px]">
                    {current.mockupSnippet.workspace}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400">ACTIVE</span>
              </div>

              <div className="space-y-2.5">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Primary Channel</span>
                  <p className="text-xs font-semibold text-brand-300">
                    {current.mockupSnippet.channel}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Active Task in Progress</span>
                  <p className="text-xs font-medium text-slate-200">
                    {current.mockupSnippet.task}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-brand-950/30 border border-brand-800/40 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">Metric Tracked</span>
                  <span className="text-xs font-bold text-cyan-300">
                    {current.mockupSnippet.metric}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
