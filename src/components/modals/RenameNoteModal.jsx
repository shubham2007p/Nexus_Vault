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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rename-dialog-title"
    >
      <div
        className="relative w-full max-w-md bg-[#18181b] border border-[#2e2e36] rounded-xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md text-[#71717a] hover:text-[#f4f4f5] hover:bg-[#27272a] transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 id="rename-dialog-title" className="text-sm font-semibold text-[#f4f4f5]">
              Rename Note
            </h3>
            <p className="text-xs text-[#a1a1aa] mt-0.5">
              Change the title and markdown filename
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="rename-input" className="block text-xs font-medium text-[#d4d4d8]">
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
              className="w-full bg-[#121214] border border-[#2e2e36] focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/60 rounded-lg px-3 py-2 text-xs text-[#f4f4f5] placeholder-[#71717a] focus:outline-none transition-colors"
            />
            {error && (
              <p className="text-[11px] text-rose-400 mt-1">{error}</p>
            )}
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-[#27272a]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#d4d4d8] bg-[#27272a] hover:bg-[#323238] border border-[#3f3f46]/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || title.trim() === currentTitle}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 border border-purple-500/50 shadow-sm transition-colors"
            >
              Save Name
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
