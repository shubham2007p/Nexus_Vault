import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function DeleteConfirmModal({
  isOpen,
  noteTitle,
  onConfirm,
  onCancel,
}) {
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Focus cancel button by default for safety against accidental deletion
      setTimeout(() => cancelBtnRef.current?.focus(), 50);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#18181b] border border-[#E3E5DF] dark:border-[#2e2e36] rounded-xl shadow-lg p-6 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-md text-[#666B65] dark:text-[#71717a] hover:text-[#242824] dark:hover:text-[#f4f4f5] hover:bg-[#F0F1ED] dark:hover:bg-[#27272a] transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-[#D32F2F]/10 border border-[#D32F2F]/20 text-[#D32F2F] shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 id="delete-dialog-title" className="text-sm font-semibold text-[#242824] dark:text-[#f4f4f5]">
              Delete Note
            </h3>
            <p className="mt-1.5 text-xs text-[#666B65] dark:text-[#a1a1aa] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-[#242824] dark:text-[#f4f4f5]">"{noteTitle}"</span>?
            </p>
            <p className="mt-1 text-[11px] text-[#8C918B] dark:text-[#71717a]">
              Any incoming wikilinks to this note in your vault will become unresolved. This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-[#E3E5DF] dark:border-[#27272a]">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#666B65] dark:text-[#d4d4d8] bg-[#F0F1ED] dark:bg-[#27272a] hover:bg-[#E3E5DF] dark:hover:bg-[#323238] border border-[#E3E5DF] dark:border-[#3f3f46]/50 transition-colors focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#D32F2F] hover:bg-[#B71C1C] border border-[#D32F2F] transition-colors focus:outline-none"
          >
            Delete Note
          </button>
        </div>
      </div>
    </div>
  );
}
