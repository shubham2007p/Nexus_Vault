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
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  ArrowLeft,
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
  onReturnToLanding,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isPatchNotesOpen, setIsPatchNotesOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFolderTarget, setCreateFolderTarget] = useState('raw');
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, title }
  const [renameTarget, setRenameTarget] = useState(null); // { id, title }
  const searchInputRef = useRef(null);

  // Folder collapse state
  const [isRawFolderOpen, setIsRawFolderOpen] = useState(true);
  const [isProcessFolderOpen, setIsProcessFolderOpen] = useState(true);

  const safeFiles = Array.isArray(files) ? files : [];

  // Categorize files into raw vs process
  const isProcessNote = (f) =>
    f.note_type === 'formal' ||
    (f.path && f.path.startsWith('process/')) ||
    (f.title && f.title.includes('(Formal)'));

  const rawNotes = safeFiles.filter((f) => !isProcessNote(f));
  const processNotes = safeFiles.filter(isProcessNote);

  // Filter based on search query
  const searchLower = searchTerm.toLowerCase();
  const filteredRawNotes = rawNotes.filter((f) =>
    (f.title || '').toLowerCase().includes(searchLower)
  );
  const filteredProcessNotes = processNotes.filter((f) =>
    (f.title || '').toLowerCase().includes(searchLower)
  );

  const handleOpenCreateInFolder = (folder, e) => {
    if (e) e.stopPropagation();
    setCreateFolderTarget(folder);
    setIsCreateModalOpen(true);
  };

  const renderFileRow = (file, isFormal) => {
    const isActive = file.id === activeFileId;
    const hasFormalCompanion =
      !isFormal &&
      file.formal_file_id &&
      safeFiles.some(
        (f) =>
          f.id === file.formal_file_id &&
          (f.note_type === 'formal' || f.path?.startsWith('process/'))
      );

    return (
      <div
        key={file.id}
        onClick={() => onSelectFile(file.id)}
        className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-all ml-3 ${
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
                isActive ? 'text-[#287D54] dark:text-emerald-400' : 'text-[#878C85] dark:text-[#71717A]'
              }`}
            />
          )}

          <span className="truncate">{file.title}</span>

          {/* Indicators */}
          {isFormal ? (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 dark:bg-amber-500/20 text-[#9A6214] dark:text-amber-300 border border-amber-500/25 shrink-0 font-medium">
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
  };

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
            onClick={() => handleOpenCreateInFolder('raw')}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#287D54] hover:bg-[#1F6342] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer active:scale-[0.99]"
            title="Create New Note in raw/ folder"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>

        {/* Clean Search Bar */}
        <div className="px-2.5 pb-2">
          <div className="relative flex items-center w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-[#878C85] dark:text-[#71717A] pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search raw & process notes..."
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

        {/* Vault Folders & Note Tree */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-2">
          {/* FOLDER 1: raw/ (Raw Notes) */}
          <div className="space-y-0.5">
            <div
              onClick={() => setIsRawFolderOpen(!isRawFolderOpen)}
              className="group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold text-[#383C36] dark:text-[#D4D4D8] hover:bg-[#E5E7E1] dark:hover:bg-[#202227] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {isRawFolderOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#666B65] dark:text-[#8E8E98] shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#666B65] dark:text-[#8E8E98] shrink-0" />
                )}
                {isRawFolderOpen ? (
                  <FolderOpen className="w-3.5 h-3.5 text-[#287D54] dark:text-emerald-400 shrink-0" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-[#287D54] dark:text-emerald-400 shrink-0" />
                )}
                <span className="font-mono text-xs">raw/</span>
                <span className="text-[11px] font-normal text-[#666B65] dark:text-[#8E8E98]">
                  (Raw Notes)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#E3E5DF] dark:bg-[#272A32] text-[#4A4F49] dark:text-[#A1A1AA]">
                  {filteredRawNotes.length}
                </span>
                <button
                  onClick={(e) => handleOpenCreateInFolder('raw', e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[#666B65] hover:text-[#287D54] dark:hover:text-emerald-400 transition-opacity"
                  title="New Note in raw/"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Folder 1 Children */}
            {isRawFolderOpen && (
              <div className="space-y-0.5 pl-1 border-l border-[#E3E5DF]/70 dark:border-[#272A32]/70 ml-2">
                {filteredRawNotes.length === 0 ? (
                  <div className="py-2 px-3 text-xs text-[#878C85] dark:text-[#71717A] italic">
                    {searchTerm ? 'No matching raw notes' : 'No notes in raw/ folder'}
                  </div>
                ) : (
                  filteredRawNotes.map((f) => renderFileRow(f, false))
                )}
              </div>
            )}
          </div>

          {/* FOLDER 2: process/ (Processed Notes) */}
          <div className="space-y-0.5 pt-1">
            <div
              onClick={() => setIsProcessFolderOpen(!isProcessFolderOpen)}
              className="group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold text-[#383C36] dark:text-[#D4D4D8] hover:bg-[#E5E7E1] dark:hover:bg-[#202227] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {isProcessFolderOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#666B65] dark:text-[#8E8E98] shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#666B65] dark:text-[#8E8E98] shrink-0" />
                )}
                {isProcessFolderOpen ? (
                  <FolderOpen className="w-3.5 h-3.5 text-[#D97706] dark:text-amber-400 shrink-0" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-[#D97706] dark:text-amber-400 shrink-0" />
                )}
                <span className="font-mono text-xs">process/</span>
                <span className="text-[11px] font-normal text-[#666B65] dark:text-[#8E8E98]">
                  (Processed Notes)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/10 text-[#9A6214] dark:text-amber-300 border border-amber-500/20">
                  {filteredProcessNotes.length}
                </span>
              </div>
            </div>

            {/* Folder 2 Children */}
            {isProcessFolderOpen && (
              <div className="space-y-0.5 pl-1 border-l border-[#E3E5DF]/70 dark:border-[#272A32]/70 ml-2">
                {filteredProcessNotes.length === 0 ? (
                  <div className="py-2 px-3 text-xs text-[#878C85] dark:text-[#71717A] italic">
                    {searchTerm
                      ? 'No matching processed notes'
                      : 'No notes synthesized yet. Synthesize any raw note to populate process/.'}
                  </div>
                ) : (
                  filteredProcessNotes.map((f) => renderFileRow(f, true))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer info & Quick Switcher */}
        <div className="h-10 px-3 border-t border-[#E3E5DF] dark:border-[#272A32] text-xs text-[#4A4F49] dark:text-[#A1A1AA] flex justify-between items-center bg-[#F0F1ED] dark:bg-[#17181C] shrink-0 font-medium">
          {onReturnToLanding ? (
            <button
              onClick={onReturnToLanding}
              className="flex items-center gap-1.5 text-xs text-[#666B65] dark:text-[#A1A1AA] hover:text-[#287D54] dark:hover:text-emerald-400 transition-colors cursor-pointer group"
              title="Return to Product Landing Page"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#287D54] dark:text-emerald-400 group-hover:-translate-x-0.5 transition-transform shrink-0" />
              <span className="font-medium">Website Overview</span>
            </button>
          ) : (
            <span>{safeFiles.length} notes</span>
          )}
          <div className="flex items-center gap-2 shrink-0">
            {onReturnToLanding && (
              <span className="text-[11px] text-[#878C85] dark:text-[#71717A]">{safeFiles.length} notes</span>
            )}
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
      </div>

      {/* Accessible Modals */}
      <CreateNoteModal
        isOpen={isCreateModalOpen}
        initialFolder={createFolderTarget}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={(title, folder) => onCreateFile(title, folder)}
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
