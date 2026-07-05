import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  loading = false,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="w-full max-w-md bg-white border-[3px] sm:border-4 border-[#1A1A1A] rounded-2xl sm:rounded-3xl shadow-[5px_5px_0px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_0px_#1A1A1A] p-5 sm:p-6"
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 shrink-0 rounded-2xl border-2 border-[#1A1A1A] flex items-center justify-center ${danger ? 'bg-[#FFEDEB]' : 'bg-[#FFF4E0]'}`}>
                <AlertTriangle className={`w-6 h-6 ${danger ? 'text-[#FF6B6B]' : 'text-[#E65100]'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-black text-[#1A1A1A] leading-tight">{title}</h3>
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="p-1.5 border-2 border-[#1A1A1A] rounded-lg bg-[#FAF9F6] hover:bg-gray-100 disabled:opacity-60"
                    aria-label="关闭"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="mt-3 text-sm font-bold text-[#555] leading-relaxed">{description}</p>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-1 sm:flex sm:justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="px-5 py-3 bg-white border-2 border-[#1A1A1A] rounded-xl font-black text-sm shadow-[2px_2px_0px_0px_#1A1A1A] hover:-translate-y-0.5 disabled:opacity-60"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`px-5 py-3 border-2 border-[#1A1A1A] rounded-xl font-black text-sm shadow-[2px_2px_0px_0px_#1A1A1A] hover:-translate-y-0.5 disabled:opacity-60 ${danger ? 'bg-[#FF6B6B] text-white' : 'bg-[#FFD93D] text-[#1A1A1A]'}`}
              >
                {loading ? '处理中...' : confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
