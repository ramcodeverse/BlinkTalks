import React, { useEffect } from "react";
import { Keyboard, X, Command, CornerDownLeft } from "lucide-react";

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const shortcuts = [
    {
      category: "Global Navigation",
      items: [
        { keys: ["Ctrl", "K"], mac: ["⌘", "K"], desc: "Open Global Command Search" },
        { keys: ["/"], desc: "Focus Search Bar" },
        { keys: ["Esc"], desc: "Close Active Modal / Dropdown / Cancel Action" },
        { keys: ["?"], desc: "Open Keyboard Shortcuts Guide" },
      ],
    },
    {
      category: "Messaging & Composer",
      items: [
        { keys: ["Enter"], desc: "Send Instant Encrypted Message" },
        { keys: ["Shift", "Enter"], desc: "Insert New Line in Composer" },
        { keys: ["↑"], desc: "Edit Last Sent Message (when input is empty)" },
        { keys: ["@"], desc: "Trigger Member Mention Autocomplete (in groups)" },
      ],
    },
    {
      category: "Actions & Overlays",
      items: [
        { keys: ["Ctrl", "Shift", "N"], mac: ["⌘", "Shift", "N"], desc: "Create New Group Channel" },
        { keys: ["Ctrl", "Shift", "J"], mac: ["⌘", "Shift", "J"], desc: "Join Channel with Invite Code" },
      ],
    },
  ];

  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-xl bg-brand-600/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
              <Keyboard className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">Keyboard Shortcuts</h3>
              <p className="text-xs text-slate-400">Navigate BlinkTalks at speed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {shortcuts.map((group) => (
            <div key={group.category} className="space-y-2.5">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.category}
              </h4>
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 divide-y divide-slate-800/60 overflow-hidden">
                {group.items.map((item, idx) => {
                  const keyCombo = isMac && item.mac ? item.mac : item.keys;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-4 py-3 text-xs"
                    >
                      <span className="text-slate-300">{item.desc}</span>
                      <div className="flex items-center space-x-1 shrink-0 ml-4">
                        {keyCombo.map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            className="px-2 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-slate-200 shadow-sm"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <span>Press <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-400">Esc</kbd> to return</span>
          <span className="font-mono text-[11px] text-brand-400">BlinkTalks Desktop UI</span>
        </div>
      </div>
    </div>
  );
}
