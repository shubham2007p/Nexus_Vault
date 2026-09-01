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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 select-none">
      <div className="bg-[#1e1e1e] border border-[#383838] rounded-xl w-[520px] max-w-[90vw] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Input Bar */}
        <div className="p-3 border-b border-[#2e2e2e] flex items-center gap-3 bg-[#181818]">
          <Search className="w-4 h-4 text-[#70a5fd] shrink-0" />
          <input
            type="text"
            placeholder="Type note title... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-[#ffffff] placeholder-[#777777] focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#2a2a2a] text-[#888888] hover:text-[#ffffff] rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#777777] italic">
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
                className={`flex items-center justify-between px-3 py-2 rounded text-xs cursor-pointer transition-colors ${
                  idx === selectedIndex
                    ? 'bg-[#363636] text-[#ffffff] font-medium border border-[#444444]'
                    : 'text-[#bbbbbb] hover:bg-[#262626]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#70a5fd]" />
                  <span className="font-medium">{file.title}</span>
                </div>
                <span className="text-[10px] text-[#777777] font-mono">{file.path}</span>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-3 py-2 bg-[#141414] border-t border-[#2e2e2e] text-[10px] text-[#777777] flex justify-between">
          <span>Navigate: <kbd className="px-1 bg-[#262626] text-[#cccccc] rounded">↑</kbd> <kbd className="px-1 bg-[#262626] text-[#cccccc] rounded">↓</kbd></span>
          <span>Select: <kbd className="px-1 bg-[#262626] text-[#cccccc] rounded">↵ Enter</kbd></span>
        </div>
      </div>
    </div>
  );
}
