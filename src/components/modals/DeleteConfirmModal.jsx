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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div
        className="relative w-full max-w-md bg-[#18181b] border border-[#2e2e36] rounded-xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-md text-[#71717a] hover:text-[#f4f4f5] hover:bg-[#27272a] transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 id="delete-dialog-title" className="text-sm font-semibold text-[#f4f4f5]">
              Delete Note
            </h3>
            <p className="mt-1.5 text-xs text-[#a1a1aa] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-[#f4f4f5]">"{noteTitle}"</span>?
            </p>
            <p className="mt-1 text-[11px] text-[#71717a]">
              Any incoming wikilinks to this note in your vault will become unresolved. This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-[#27272a]">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#d4d4d8] bg-[#27272a] hover:bg-[#323238] border border-[#3f3f46]/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#71717a]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 border border-rose-500/50 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            Delete Note
          </button>
        </div>
      </div>
    </div>
  );
}
