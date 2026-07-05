import React, { useEffect } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
  type: ToastType;
  message: string;
}

interface ToastProps {
  toast: ToastState | null;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ toast, onClose, duration = 2600 }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [duration, onClose, toast]);

  const meta = toastMeta(toast?.type || 'info');

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          className={`fixed right-6 top-6 z-[140] max-w-sm border-2 border-[#1A1A1A] rounded-2xl shadow-[5px_5px_0px_0px_#1A1A1A] ${meta.className}`}
        >
          <div className="flex items-start gap-3 px-4 py-3">
            <meta.Icon className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-sm font-black leading-relaxed text-[#1A1A1A]">{toast.message}</p>
            <button
              type="button"
              onClick={onClose}
              className="ml-2 p-0.5 rounded-md hover:bg-white/60"
              aria-label="关闭提示"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function toastMeta(type: ToastType) {
  if (type === 'success') {
    return { Icon: CheckCircle2, className: 'bg-[#E8F5E9]' };
  }
  if (type === 'error') {
    return { Icon: XCircle, className: 'bg-[#FFEDEB]' };
  }
  return { Icon: Info, className: 'bg-[#E3F2FD]' };
}
