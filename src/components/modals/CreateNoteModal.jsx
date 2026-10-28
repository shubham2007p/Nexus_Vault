import React, { useState, useEffect, useRef } from 'react';
import { FilePlus, X, Folder } from 'lucide-react';

export default function CreateNoteModal({ isOpen, onClose, onCreate, initialFolder = 'raw' }) {
  const [title, setTitle] = useState('');
  const [folder, setFolder] = useState(initialFolder || 'raw');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setFolder(initialFolder || 'raw');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 50);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, initialFolder, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Please provide a note title');
      return;
    }
    onCreate(cleanTitle, folder);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-dialog-title"
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#18181b] border border-[#E3E5DF] dark:border-[#2e2e36] rounded-xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-150 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md text-[#878C85] dark:text-[#71717a] hover:text-[#242824] dark:hover:text-[#f4f4f5] hover:bg-[#E8EAE4] dark:hover:bg-[#27272a] transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-[#287D54]/10 dark:bg-emerald-500/15 border border-[#287D54]/25 dark:border-emerald-500/30 text-[#287D54] dark:text-emerald-400">
            <FilePlus className="w-5 h-5" />
          </div>
          <div>
            <h3 id="create-dialog-title" className="text-sm font-semibold text-[#242824] dark:text-[#f4f4f5]">
              Create New Note
            </h3>
            <p className="text-xs text-[#666B65] dark:text-[#a1a1aa] mt-0.5">
              Add a new note to your knowledge vault
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Folder Selection */}
          <div>
            <label className="block text-xs font-medium text-[#242824] dark:text-[#d4d4d8] mb-1.5">
              Destination Folder
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFolder('raw')}
                className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                  folder === 'raw'
                    ? 'bg-emerald-500/10 border-[#287D54] text-[#287D54] dark:text-emerald-400 dark:border-emerald-500 shadow-2xs'
                    : 'bg-[#F7F7F4] dark:bg-[#151518] border-[#E3E5DF] dark:border-[#272A32] text-[#666B65] dark:text-[#8e8e98] hover:bg-white dark:hover:bg-[#1E1E22]'
                }`}
              >
                <Folder className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">raw/ (Raw Notes)</span>
              </button>

              <button
                type="button"
                onClick={() => setFolder('formal')}
                className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                  folder === 'formal'
                    ? 'bg-amber-500/10 border-amber-500 text-[#9A6214] dark:text-amber-300 shadow-2xs'
                    : 'bg-[#F7F7F4] dark:bg-[#151518] border-[#E3E5DF] dark:border-[#272A32] text-[#666B65] dark:text-[#8e8e98] hover:bg-white dark:hover:bg-[#1E1E22]'
                }`}
              >
                <Folder className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">process/ (Formal)</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="note-title-input" className="block text-xs font-medium text-[#242824] dark:text-[#d4d4d8]">
              Note Title
            </label>
            <input
              id="note-title-input"
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Attention Mechanism & Intuition"
              className="w-full bg-[#F7F7F4] dark:bg-[#121214] border border-[#E3E5DF] dark:border-[#2e2e36] focus:border-[#287D54] dark:focus:border-[#2EA468] rounded-lg px-3 py-2 text-xs text-[#242824] dark:text-[#f4f4f5] placeholder-[#878C85] dark:placeholder-[#71717a] focus:outline-none transition-colors"
            />
            {error && (
              <p className="text-[11px] text-[#D32F2F] dark:text-rose-400 mt-1">{error}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E3E5DF] dark:border-[#27272a]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#666B65] dark:text-[#d4d4d8] bg-[#F0F1ED] dark:bg-[#27272a] hover:bg-[#E3E5DF] dark:hover:bg-[#323238] border border-[#E3E5DF] dark:border-[#3f3f46]/50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#287D54] hover:bg-[#1F6342] disabled:opacity-40 border border-[#287D54]/50 shadow-xs transition-colors cursor-pointer"
            >
              Create Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
