import React, { useState, useEffect } from 'react';
import { Search, FileText, X } from 'lucide-react';

export default function CommandPalette({ isOpen, onClose, files = [], onSelectFile }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const safeFiles = Array.isArray(files) ? files : [];
  const filtered = safeFiles.filter((f) =>
    (f.title || '').toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        onSelectFile(filtered[selectedIndex].id);
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onSelectFile, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-24 select-none">
      <div className="bg-[#17171a] border border-[#2e2e36] rounded-xl w-[520px] max-w-[90vw] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Input Bar */}
        <div className="p-3 border-b border-[#26262c] flex items-center gap-3 bg-[#131316]">
          <Search className="w-4 h-4 text-purple-400 shrink-0" />
          <input
            type="text"
            placeholder="Type note title... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-[#f4f4f5] placeholder-[#5a5a64] focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#222227] text-[#71717a] hover:text-[#f4f4f5] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#71717a] italic">
              No matching notes found
            </div>
          ) : (
            filtered.map((file, idx) => (
              <div
                key={file.id}
                onClick={() => {
                  onSelectFile(file.id);
                  onClose();
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                  idx === selectedIndex
                    ? 'bg-[#222228] text-[#f4f4f5] font-medium border border-purple-500/30'
                    : 'text-[#a1a1aa] hover:bg-[#1c1c20] hover:text-[#f4f4f5] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <FileText className={`w-3.5 h-3.5 ${idx === selectedIndex ? 'text-purple-400' : 'text-[#71717a]'}`} />
                  <span className="font-medium truncate">{file.title}</span>
                </div>
                <span className="text-[10px] text-[#71717a] font-mono shrink-0">{file.path}</span>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-3.5 py-2 bg-[#121214] border-t border-[#26262c] text-[10px] text-[#71717a] flex justify-between">
          <span>Navigate: <kbd className="px-1.5 py-0.5 bg-[#1b1b1f] border border-[#2e2e36] text-[#d4d4d8] rounded font-mono">↑</kbd> <kbd className="px-1.5 py-0.5 bg-[#1b1b1f] border border-[#2e2e36] text-[#d4d4d8] rounded font-mono">↓</kbd></span>
          <span>Select: <kbd className="px-1.5 py-0.5 bg-[#1b1b1f] border border-[#2e2e36] text-[#d4d4d8] rounded font-mono">↵ Enter</kbd></span>
        </div>
      </div>
    </div>
  );
}
