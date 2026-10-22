import React, { useState, useRef } from 'react';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Edit3,
  X,
  BookOpen,
  BookMarked,
  Sun,
  Moon,
  ChevronLeft
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
  theme = 'light',
  onToggleTheme,
  onCloseSidebar,
}) {
  const [searchTerm, setSearchTerm] = useState('');
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
      <div className="w-full bg-[#F0F1ED] dark:bg-[#17181C] border-r border-[#E3E5DF] dark:border-[#272A32] flex flex-col h-full select-none shrink-0 transition-colors">
        {/* Header Bar: Brand, Theme Toggle, Mobile Close */}
        <div className="h-12 px-3 border-b border-[#E3E5DF] dark:border-[#272A32] flex items-center justify-between shrink-0 bg-[#F0F1ED] dark:bg-[#17181C]">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setIsPatchNotesOpen(true)}
              className="flex items-center gap-2 hover:opacity-85 transition-opacity text-left cursor-pointer"
              title="Nexus Vault — Click to view system info & shortcuts"
            >
              <div className="w-6 h-6 rounded-md bg-[#287D54]/10 dark:bg-emerald-500/15 border border-[#287D54]/25 dark:border-emerald-500/30 flex items-center justify-center shrink-0">
                <BookOpen className="w-3.5 h-3.5 text-[#287D54] dark:text-emerald-400" />
              </div>
              <span className="font-semibold text-xs tracking-tight text-[#242824] dark:text-[#F4F4F5] truncate">
                Nexus Vault
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            {/* Theme Toggle (Sun / Moon) */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-1.5 rounded-md text-[#666B65] dark:text-[#A1A1AA] hover:text-[#242824] dark:hover:text-[#F4F4F5] hover:bg-[#E8EAE4] dark:hover:bg-[#202227] transition-colors cursor-pointer"
                title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                aria-label="Toggle visual theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-[#666B65]" />
                )}
              </button>
            )}

            {/* Close Sidebar button on mobile */}
            {onCloseSidebar && (
              <button
                onClick={onCloseSidebar}
                className="md:hidden p-1.5 rounded-md text-[#666B65] dark:text-[#A1A1AA] hover:text-[#242824] dark:hover:text-[#F4F4F5] hover:bg-[#E8EAE4] dark:hover:bg-[#202227] transition-colors cursor-pointer"
                title="Close drawer"
                aria-label="Close drawer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Primary Action: New Note Button */}
        <div className="p-2.5 pb-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#287D54] hover:bg-[#1F6342] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer active:scale-[0.99]"
            title="Create New Note (Ctrl+N)"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>

        {/* Clean, Always-Visible Search Bar */}
        <div className="px-2.5 pb-2">
          <div className="relative flex items-center w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-[#878C85] dark:text-[#71717A] pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchTerm('');
              }}
              className="w-full bg-white dark:bg-[#121214] border border-[#E3E5DF] dark:border-[#272A32] focus:border-[#287D54] dark:focus:border-[#2EA468] rounded-md px-2.5 pl-8 pr-7 py-1.5 text-xs text-[#242824] dark:text-[#F4F4F5] placeholder-[#878C85] dark:placeholder-[#71717A] focus:outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2 p-0.5 text-[#878C85] hover:text-[#242824] dark:hover:text-[#F4F4F5] rounded transition-colors"
                title="Clear filter (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Note List Header */}
        <div className="px-4 pt-1 pb-1 flex items-center justify-between text-xs font-semibold text-[#4A4F49] dark:text-[#A1A1AA]">
          <span>Notes</span>
          <span>{filteredFiles.length}</span>
        </div>

        {/* Note List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {filteredFiles.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#878C85] dark:text-[#71717A] italic">
              {searchTerm ? 'No matching notes' : 'No notes yet'}
            </div>
          ) : (
            filteredFiles.map((file) => {
              const isActive = file.id === activeFileId;
              const isFormal = file.note_type === 'formal' || (file.title && file.title.includes('(Formal)'));
              const hasFormalCompanion = !isFormal && file.formal_file_id;

              return (
                <div
                  key={file.id}
                  onClick={() => onSelectFile(file.id)}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-white dark:bg-[#22242B] text-[#242824] dark:text-[#F4F4F5] font-medium border-l-2 border-l-[#287D54] dark:border-l-[#2EA468] shadow-xs'
                      : 'text-[#666B65] dark:text-[#A1A1AA] hover:bg-[#E8EAE4] dark:hover:bg-[#202227] hover:text-[#242824] dark:hover:text-[#F4F4F5] border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-1 min-w-0">
                    {isFormal ? (
                      <BookMarked
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-[#B45309] dark:text-amber-400' : 'text-[#D28E2B] dark:text-amber-400/80'
                        }`}
                      />
                    ) : (
                      <FileText
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive
                            ? 'text-[#287D54] dark:text-emerald-400'
                            : 'text-[#878C85] dark:text-[#71717A]'
                        }`}
                      />
                    )}

                    <span className="truncate">{file.title}</span>

                    {/* Quiet distinction for formal notes */}
                    {isFormal ? (
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-amber-500/10 dark:bg-amber-500/20 text-[#9A6214] dark:text-amber-300 border border-amber-500/25 shrink-0 font-medium">
                        Formal
                      </span>
                    ) : hasFormalCompanion ? (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-[#E7A23B] dark:bg-amber-400 shrink-0"
                        title="Has Formal Companion Note"
                      />
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
                        className="p-1 text-[#878C85] hover:text-[#242824] dark:hover:text-[#F4F4F5] hover:bg-[#D4D6CF] dark:hover:bg-[#2A2D35] rounded transition-all"
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
                      className="p-1 text-[#878C85] hover:text-[#D32F2F] dark:hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all"
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

        {/* Footer info & Quick Switcher */}
        <div className="h-10 px-4 border-t border-[#E3E5DF] dark:border-[#272A32] text-xs text-[#4A4F49] dark:text-[#A1A1AA] flex justify-between items-center bg-[#F0F1ED] dark:bg-[#17181C] shrink-0 font-medium">
          <span>{safeFiles.length} notes</span>
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="flex items-center gap-1 text-xs text-[#4A4F49] dark:text-[#A1A1AA] hover:text-[#242824] dark:hover:text-[#F4F4F5] transition-colors cursor-pointer"
              title="Open Quick Switcher (Ctrl+K or Cmd+K)"
            >
              <span className="font-mono bg-[#E3E5DF] dark:bg-[#272A32] px-1.5 py-0.5 rounded text-xs">
                ⌘K
              </span>
            </button>
          )}
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
