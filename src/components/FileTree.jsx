import React, { useState } from 'react';
import { FileText, Plus, Search, Trash2, Sparkles, Folder, X } from 'lucide-react';

export default function FileTree({
  files = [],
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onOpenCommandPalette,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const safeFiles = Array.isArray(files) ? files : [];
  const filteredFiles = safeFiles.filter((f) =>
    (f.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onCreateFile(newTitle.trim());
      setNewTitle('');
      setIsCreating(false);
    }
  };

  return (
    <div className="w-64 bg-[#181818] border-r border-[#282828] flex flex-col h-full select-none shrink-0">
      {/* Header */}
      <div className="px-3.5 py-3 border-b border-[#282828] flex items-center justify-between bg-[#141414]">
        <div className="flex items-center gap-2 font-semibold text-[#dcddde] text-xs tracking-wide">
          <Folder className="w-4 h-4 text-[#e2e8f0]" />
          <span>Vault Explorer</span>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-2 py-1 rounded bg-[#242424] hover:bg-[#303030] text-[#dcddde] hover:text-[#ffffff] transition-all text-xs flex items-center gap-1 border border-[#333333] shadow-sm"
          title="Create New Note"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
      </div>

      {/* Search Bar & Command Palette Button */}
      <div className="p-2.5 space-y-2 border-b border-[#282828]">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-[#777777]" />
          <input
            type="text"
            placeholder="Filter notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#121212] border border-[#2a2a2a] focus:border-[#e2e8f0]/60 rounded px-2.5 pl-8 pr-7 py-1.5 text-xs text-[#dcddde] placeholder-[#666666] focus:outline-none transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 p-0.5 text-[#777777] hover:text-[#ffffff] rounded"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-2.5 py-1.5 bg-[#202020] hover:bg-[#282828] text-[#aaaaaa] hover:text-[#ffffff] rounded text-xs border border-[#2a2a2a] transition-all"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Quick Switcher
          </span>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-[#141414] border border-[#333333] rounded text-[#888888] font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* New Note Form */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="p-2.5 bg-[#1f1f1f] border-b border-[#282828]">
          <input
            type="text"
            placeholder="Note title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
            className="w-full bg-[#141414] border border-[#e2e8f0] rounded px-2.5 py-1 text-xs text-[#ffffff] placeholder-[#666666] focus:outline-none mb-2"
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-2 py-0.5 text-[11px] text-[#888888] hover:text-[#dcddde]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2.5 py-0.5 text-[11px] bg-[#e2e8f0] hover:bg-white text-black font-semibold rounded transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {filteredFiles.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#666666] italic">
            No notes found
          </div>
        ) : (
          filteredFiles.map((file) => {
            const isActive = file.id === activeFileId;
            return (
              <div
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[#242424] text-[#ffffff] font-medium border-l-2 border-l-[#e2e8f0] border-y border-r border-[#303030] shadow-sm'
                    : 'text-[#aaaaaa] hover:bg-[#202020] hover:text-[#ffffff] border-l-2 border-l-transparent'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-1">
                  <FileText
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-[#e2e8f0]' : 'text-[#666666]'
                    }`}
                  />
                  <span className="truncate">{file.title}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete note "${file.title}"?`)) {
                      onDeleteFile(file.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-[#777777] hover:text-rose-400 rounded transition-all"
                  title="Delete Note"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer info */}
      <div className="p-2.5 border-t border-[#282828] text-[11px] text-[#777777] flex justify-between items-center bg-[#141414]">
        <span>{safeFiles.length} Notes in Vault</span>
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/90">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Online</span>
        </div>
      </div>
    </div>
  );
}
