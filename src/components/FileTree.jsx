import React, { useState, useRef } from 'react';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Edit3,
  Sparkles,
  Folder,
  X,
  FileCode,
  Layers
} from 'lucide-react';
import DeleteConfirmModal from './modals/DeleteConfirmModal';
import CreateNoteModal from './modals/CreateNoteModal';
import RenameNoteModal from './modals/RenameNoteModal';
import PatchNotesModal from './modals/PatchNotesModal';

export default function FileTree({
  files = [],
  activeFileId,
  onSelectFile,
  onCreateFile,
  onRenameFile,
  onDeleteFile,
  onOpenCommandPalette,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPatchNotesOpen, setIsPatchNotesOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, title }
  const [renameTarget, setRenameTarget] = useState(null); // { id, title }
  const searchInputRef = useRef(null);

  const safeFiles = Array.isArray(files) ? files : [];
  const filteredFiles = safeFiles.filter((f) =>
    (f.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="w-64 bg-[#151518] border-r border-[#26262c] flex flex-col h-full select-none shrink-0">
        {/* Header Bar: Word Explorer (Opens Patch Notes) */}
        <div className="h-12 px-3 border-b border-[#26262c] flex items-center justify-between bg-[#121214]">
          <button
            onClick={() => setIsPatchNotesOpen(true)}
            className="flex items-center gap-2 font-semibold text-[#f4f4f5] text-xs tracking-wide hover:bg-[#1e1e24] px-2 py-1.5 -ml-1 rounded-lg transition-all group text-left"
            title="Word Explorer — Click to view Patch Notes & Shortcuts"
          >
            <div className="w-5 h-5 rounded bg-purple-500/10 border border-purple-500/20 group-hover:border-purple-500/40 flex items-center justify-center transition-colors shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <span className="group-hover:text-purple-200 transition-colors">Word Explorer</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-purple-500/15 text-purple-300 border border-purple-500/25 shrink-0">
                v1.2
              </span>
            </div>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-7 px-2 rounded-md bg-[#1e1e22] hover:bg-[#27272e] text-[#d4d4d8] hover:text-[#f4f4f5] transition-all text-xs flex items-center gap-1 border border-[#2e2e36] shadow-sm font-medium shrink-0"
            title="Create New Note (Ctrl+N)"
          >
            <Plus className="w-3.5 h-3.5 text-purple-400" />
            <span>New</span>
          </button>
        </div>

        {/* Collapsible Search Notes Emblem / Bar */}
        <div className="p-2 border-b border-[#26262c]">
          {!isSearchOpen && !searchTerm ? (
            <button
              onClick={() => {
                setIsSearchOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#111113] hover:bg-[#1a1a1e] text-[#71717a] hover:text-[#f4f4f5] border border-[#26262c] hover:border-purple-500/30 transition-all text-xs group"
              title="Search notes (Click to expand)"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-purple-500/10 border border-purple-500/20 group-hover:border-purple-500/40 flex items-center justify-center transition-colors">
                  <Search className="w-3 h-3 text-purple-400" />
                </div>
                <span className="text-[#8e8e98] group-hover:text-[#d4d4d8] transition-colors">Search notes...</span>
              </div>
              <span className="text-[10px] text-[#5a5a64] group-hover:text-[#8e8e98] font-mono">
                Find
              </span>
            </button>
          ) : (
            <div className="relative flex items-center w-full animate-in fade-in duration-150">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-purple-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Filter notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    if (searchTerm) {
                      setSearchTerm('');
                    } else {
                      setIsSearchOpen(false);
                    }
                  }
                }}
                className="w-full bg-[#111113] border border-purple-500/40 focus:border-purple-500 rounded-lg px-2.5 pl-8 pr-7 py-1.5 text-xs text-[#f4f4f5] placeholder-[#5a5a64] focus:outline-none transition-colors shadow-inner"
              />
              <button
                onClick={() => {
                  setSearchTerm('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-2 p-1 text-[#71717a] hover:text-[#f4f4f5] hover:bg-[#222227] rounded transition-colors"
                title="Close search (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Note List */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {filteredFiles.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#71717a] italic">
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
                      ? 'bg-[#222227] text-[#f4f4f5] font-medium border-l-2 border-l-purple-400 border-y border-r border-[#2e2e36] shadow-sm'
                      : 'text-[#a1a1aa] hover:bg-[#1a1a1e] hover:text-[#f4f4f5] border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-1 min-w-0">
                    <FileText
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive
                          ? 'text-purple-400'
                          : file.note_type === 'formal' || (file.title && file.title.includes('(Formal)'))
                          ? 'text-amber-400'
                          : 'text-[#71717a]'
                      }`}
                    />
                    <span className="truncate">{file.title}</span>
                    {file.note_type === 'formal' || (file.title && file.title.includes('(Formal)')) ? (
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25 shrink-0">
                        Formal
                      </span>
                    ) : file.formal_file_id ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Has Formal Companion Note" />
                    ) : null}
                  </div>

                  {/* Context Actions: Rename & Delete */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onRenameFile && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenameTarget({ id: file.id, title: file.title });
                        }}
                        className="p-1 text-[#71717a] hover:text-[#d4d4d8] hover:bg-[#27272e] rounded transition-all"
                        title="Rename Note"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget({ id: file.id, title: file.title });
                      }}
                      className="p-1 text-[#71717a] hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="h-10 px-3.5 border-t border-[#26262c] text-[11px] text-[#71717a] flex justify-between items-center bg-[#121214] shrink-0">
          <span>{safeFiles.length} Notes in Vault</span>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Online</span>
          </div>
        </div>
      </div>

      {/* Accessible Modals */}
      <CreateNoteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={onCreateFile}
      />

      <RenameNoteModal
        isOpen={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        currentTitle={renameTarget?.title}
        onRename={(newTitle) => {
          if (renameTarget) {
            onRenameFile(renameTarget.id, newTitle);
          }
        }}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        noteTitle={deleteTarget?.title}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteFile(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />

      <PatchNotesModal
        isOpen={isPatchNotesOpen}
        onClose={() => setIsPatchNotesOpen(false)}
      />
    </>
  );
}
