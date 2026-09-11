import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, RotateCcw } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastMessage {
  id: string;
  type: ToastType;
  text: string;
  action?: ToastAction;
  duration?: number;
}

interface ToastContextType {
  addToast: (text: string, type?: ToastType, action?: ToastAction, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (text: string, type: ToastType = "info", action?: ToastAction, duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, text, action, duration }]);
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div
        id="toast-container"
        className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          let bgClass = "bg-slate-900/95 border-slate-700/80 text-slate-100";
          let Icon = Info;
          let iconColor = "text-brand-400";

          if (toast.type === "success") {
            bgClass = "bg-slate-900/95 border-emerald-500/40 text-slate-100";
            Icon = CheckCircle2;
            iconColor = "text-emerald-400";
          } else if (toast.type === "error") {
            bgClass = "bg-slate-900/95 border-rose-500/40 text-slate-100";
            Icon = AlertCircle;
            iconColor = "text-rose-400";
          } else if (toast.type === "warning") {
            bgClass = "bg-slate-900/95 border-amber-500/40 text-slate-100";
            Icon = AlertTriangle;
            iconColor = "text-amber-400";
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-xl backdrop-blur-md text-xs font-medium animate-toast-enter transition-all duration-200 ${bgClass}`}
            >
              <div className="flex items-center space-x-2.5 flex-1 min-w-0 pr-2">
                <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
                <span className="leading-snug truncate">{toast.text}</span>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {toast.action && (
                  <button
                    onClick={() => {
                      toast.action?.onClick();
                      removeToast(toast.id);
                    }}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-brand-600/30 hover:bg-brand-600/50 border border-brand-500/40 text-brand-300 hover:text-white font-semibold transition cursor-pointer text-[11px]"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>{toast.action.label}</span>
                  </button>
                )}
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 hover:text-white p-1 rounded-md transition cursor-pointer"
                  title="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      addToast: (text: string) => console.log(`[Toast]: ${text}`),
      removeToast: () => {},
    };
  }
  return context;
}
