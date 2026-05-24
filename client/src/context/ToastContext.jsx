import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Automatically remove after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Dynamic Floating Toast Container */}
      <div className="fixed top-24 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          let borderTheme = 'border-white/10 bg-white/5 backdrop-blur-xl';
          let icon = <Info className="w-5 h-5 text-teal-400" />;
          
          if (toast.type === 'success') {
            borderTheme = 'border-emerald-500/30 bg-white/5 backdrop-blur-xl shadow-emerald-950/20';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
          } else if (toast.type === 'error') {
            borderTheme = 'border-rose-500/30 bg-white/5 backdrop-blur-xl shadow-rose-950/20';
            icon = <AlertCircle className="w-5 h-5 text-rose-400" />;
          } else if (toast.type === 'warning') {
            borderTheme = 'border-amber-500/30 bg-white/5 backdrop-blur-xl shadow-amber-950/20';
            icon = <AlertCircle className="w-5 h-5 text-amber-400" />;
          }

          return (
            <div
              key={toast.id}
              className={`flex items-start justify-between gap-3 px-4 py-3.5 rounded-2xl border backdrop-blur-md shadow-2xl transition-all duration-300 pointer-events-auto animate-slide-in ${borderTheme}`}
            >
              <div className="flex items-start gap-2.5">
                <div className="shrink-0 mt-0.5">{icon}</div>
                <p className="text-xs font-semibold text-slate-200 leading-normal">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 text-slate-500 hover:text-white rounded-full hover:bg-white/10 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
