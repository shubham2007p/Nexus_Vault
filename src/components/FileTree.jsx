import React, { useState } from 'react';
import { FileText, Plus, Search, Trash2, Sparkles, Folder } from 'lucide-react';

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

  const safeFiles = files || [];
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
    <div className="w-64 bg-[#181818] border-r border-[#2e2e2e] flex flex-col h-full select-none shrink-0">
      {/* Header */}
      <div className="p-3.5 border-b border-[#2e2e2e] flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-[#dcddde] text-xs tracking-wide">
          <Folder className="w-4 h-4 text-[#e2e8f0]" />
          <span>Vault Explorer</span>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 rounded bg-[#2e2e2e] hover:bg-[#383838] text-[#dcddde] transition-colors text-xs flex items-center gap-1 border border-[#383838]"
          title="Create New Note"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
      </div>

      {/* Search Bar & Command Palette Button */}
      <div className="p-2.5 space-y-2 border-b border-[#2e2e2e]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#888888]" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111111] border border-[#2e2e2e] rounded px-2.5 pl-8 py-1.5 text-xs text-[#dcddde] placeholder-[#777777] focus:outline-none focus:border-[#e2e8f0] transition-colors"
          />
        </div>
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-2.5 py-1.5 bg-[#222222] hover:bg-[#2a2a2a] text-[#bbbbbb] hover:text-[#ffffff] rounded text-xs border border-[#2e2e2e] transition-colors"
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
        <form onSubmit={handleCreateSubmit} className="p-2.5 bg-[#222222] border-b border-[#2e2e2e]">
          <input
            type="text"
            placeholder="Note title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
            className="w-full bg-[#141414] border border-[#e2e8f0] rounded px-2.5 py-1 text-xs text-[#dcddde] placeholder-[#666666] focus:outline-none mb-2"
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
          <div className="p-4 text-center text-xs text-[#777777] italic">
            No notes found
          </div>
        ) : (
          filteredFiles.map((file) => {
            const isActive = file.id === activeFileId;
            return (
              <div
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-[#363636] text-[#ffffff] font-medium border border-[#444444]'
                    : 'text-[#bbbbbb] hover:bg-[#262626] hover:text-[#ffffff]'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-1">
                  <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#e2e8f0]' : 'text-[#666666]'}`} />
                  <span className="truncate">{file.title}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete note "${file.title}"?`)) {
                      onDeleteFile(file.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-[#888888] hover:text-rose-400 rounded transition-all"
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
      <div className="p-2.5 border-t border-[#2e2e2e] text-[11px] text-[#777777] flex justify-between items-center bg-[#141414]">
        <span>{safeFiles.length} Notes in Vault</span>
        <span className="w-2 h-2 rounded-full bg-emerald-500/80" title="System Online"></span>
      </div>
    </div>
  );
}
