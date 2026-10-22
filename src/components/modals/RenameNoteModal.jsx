import React, { useState, useEffect, useRef } from 'react';
import { Edit3, X } from 'lucide-react';

export default function RenameNoteModal({ isOpen, onClose, currentTitle, onRename }) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle || '');
      setError('');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, currentTitle, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Title cannot be empty');
      return;
    }
    if (cleanTitle === currentTitle) {
      onClose();
      return;
    }
    onRename(cleanTitle);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rename-dialog-title"
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#18181b] border border-[#E3E5DF] dark:border-[#2e2e36] rounded-xl shadow-lg p-6 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md text-[#666B65] dark:text-[#71717a] hover:text-[#242824] dark:hover:text-[#f4f4f5] hover:bg-[#F0F1ED] dark:hover:bg-[#27272a] transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-[#287D54]/10 border border-[#287D54]/20 text-[#287D54] dark:text-[#2EA468]">
            <Edit3 className="w-4 h-4" />
          </div>
          <div>
            <h3 id="rename-dialog-title" className="text-sm font-semibold text-[#242824] dark:text-[#f4f4f5]">
              Rename Note
            </h3>
            <p className="text-xs text-[#666B65] dark:text-[#a1a1aa] mt-0.5">
              Change the title and markdown filename
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="rename-input" className="block text-xs font-medium text-[#242824] dark:text-[#d4d4d8]">
              New Title
            </label>
            <input
              id="rename-input"
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              className="w-full bg-[#F7F7F4] dark:bg-[#121214] border border-[#E3E5DF] dark:border-[#2e2e36] focus:border-[#287D54] focus:ring-1 focus:ring-[#287D54] rounded-lg px-3 py-2 text-xs text-[#242824] dark:text-[#f4f4f5] placeholder-[#666B65] focus:outline-none transition-colors"
            />
            {error && (
              <p className="text-[11px] text-[#D32F2F] mt-1">{error}</p>
            )}
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-[#E3E5DF] dark:border-[#27272a]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#666B65] dark:text-[#d4d4d8] bg-[#F0F1ED] dark:bg-[#27272a] hover:bg-[#E3E5DF] dark:hover:bg-[#323238] border border-[#E3E5DF] dark:border-[#3f3f46]/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || title.trim() === currentTitle}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#287D54] hover:bg-[#1F6342] disabled:opacity-40 border border-[#287D54] transition-colors"
            >
              Save Name
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
