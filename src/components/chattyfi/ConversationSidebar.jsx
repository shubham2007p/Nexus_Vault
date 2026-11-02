import React, { useState, useRef } from 'react';
import {
  MessageSquare,
  Plus,
  Search,
  Trash2,
  Edit3,
  X,
  BookOpen,
  FileText,
  Sun,
  Moon,
  ChevronLeft,
  ArrowLeft,
  Check,
  Pin,
  Sparkles,
  FolderOpen,
  Share2,
  LogIn,
  LogOut,
} from 'lucide-react';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import PatchNotesModal from '../modals/PatchNotesModal';

/**
 * Format relative timestamp concisely (e.g., "Just now", "14m", "2h", "Nov 2")
 */
function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr.includes('T') ? dateStr : `${dateStr.replace(' ', 'T')}Z`);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr.includes('T') ? dateStr : `${dateStr.replace(' ', 'T')}Z`);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export default function ConversationSidebar({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onCreateConversation,
  onRenameConversation,
  onTogglePinConversation,
  onDeleteConversation,
  searchQuery = '',
  onSearchChange,
  workspaceMode = 'chattyfi',
  onSwitchWorkspaceMode,
  onOpenFullGraph,
  files = [],
  onSelectFile,
  onOpenCommandPalette,
  theme = 'light',
  onToggleTheme,
  onCloseSidebar,
  onReturnToLanding,
  isLoading = false,
  currentUser,
  onOpenAuthModal,
  onLogout,
}) {
  const [isPatchNotesOpen, setIsPatchNotesOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, title }
  const searchInputRef = useRef(null);

  const safeConversations = Array.isArray(conversations) ? conversations : [];
  const safeFiles = Array.isArray(files) ? files : [];

  const pinnedList = safeConversations.filter((c) => Number(c.pinned) === 1);
  const unpinnedList = safeConversations.filter((c) => Number(c.pinned) !== 1);
  const todayList = unpinnedList.filter((c) => isToday(c.updated_at || c.created_at));
  const earlierList = unpinnedList.filter((c) => !isToday(c.updated_at || c.created_at));

  const startEditing = (conv, e) => {
    if (e) e.stopPropagation();
    setEditingId(conv.id);
    setEditingTitle(conv.title || 'Untitled Conversation');
  };

  const commitEditing = async (id, e) => {
    if (e) e.stopPropagation();
    const trimmed = editingTitle.trim();
    if (trimmed && onRenameConversation) {
      await onRenameConversation(id, trimmed);
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const cancelEditing = (e) => {
    if (e) e.stopPropagation();
    setEditingId(null);
    setEditingTitle('');
  };

  const renderConversationRow = (conv) => {
    const isActive = String(conv.id) === String(activeConversationId);
    const isEditing = editingId !== null && String(editingId) === String(conv.id);
    const topics = Array.isArray(conv.topics) ? conv.topics : [];
    const primaryTopic = topics[0];

    return (
      <div
        key={conv.id}
        data-testid={`conv-item-${conv.id}`}
        onClick={() => {
          if (!isEditing && onSelectConversation) {
            onSelectConversation(conv.id);
          }
        }}
        className={`group flex flex-col px-2.5 py-2 rounded-md text-xs cursor-pointer transition-colors ${
          isActive
            ? 'bg-white dark:bg-[#22242B] text-[#242824] dark:text-[#F4F4F5] font-medium border-l-2 border-l-[#287D54] dark:border-l-[#2EA468]'
            : 'text-[#4A4F49] dark:text-[#A1A1AA] hover:bg-[#E8EAE4] dark:hover:bg-[#202227] hover:text-[#242824] dark:hover:text-[#F4F4F5] border-l-2 border-l-transparent'
        }`}
      >
        {isEditing ? (
          <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEditing(conv.id, e);
                if (e.key === 'Escape') cancelEditing(e);
              }}
              autoFocus
              className="flex-1 min-w-0 bg-[#F7F7F4] dark:bg-[#121214] border border-[#287D54] dark:border-[#2EA468] rounded px-1.5 py-0.5 text-xs text-[#242824] dark:text-[#F4F4F5] focus:outline-none"
            />
            <button
              onClick={(e) => commitEditing(conv.id, e)}
              className="p-1 text-[#287D54] dark:text-emerald-400 hover:bg-[#287D54]/10 rounded"
              title="Save title (Enter)"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={cancelEditing}
              className="p-1 text-[#878C85] hover:text-[#242824] dark:hover:text-[#F4F4F5] rounded"
              title="Cancel (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <MessageSquare
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive
                    ? 'text-[#287D54] dark:text-emerald-400'
                    : 'text-[#878C85] dark:text-[#71717A]'
                }`}
              />
              <span className="truncate leading-snug">
                {conv.title || 'Untitled Conversation'}
              </span>
            </div>

            {/* Right: Timestamp or Hover Actions */}
            <div className="flex items-center shrink-0">
              <span className="text-[10px] font-mono text-[#878C85] dark:text-[#71717A] group-hover:hidden tabular-nums">
                {formatRelativeTime(conv.updated_at || conv.created_at)}
              </span>

              <div className="hidden group-hover:flex items-center gap-0.5">
                {onTogglePinConversation && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePinConversation(conv.id, Number(conv.pinned) !== 1);
                    }}
                    className={`p-1 rounded transition-colors ${
                      Number(conv.pinned) === 1
                        ? 'text-[#287D54] dark:text-emerald-400'
                        : 'text-[#878C85] hover:text-[#242824] dark:hover:text-[#F4F4F5] hover:bg-[#D4D6CF] dark:hover:bg-[#2A2D35]'
                    }`}
                    title={Number(conv.pinned) === 1 ? 'Unpin conversation' : 'Pin conversation'}
                  >
                    <Pin className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={(e) => startEditing(conv, e)}
                  className="p-1 text-[#878C85] hover:text-[#242824] dark:hover:text-[#F4F4F5] hover:bg-[#D4D6CF] dark:hover:bg-[#2A2D35] rounded transition-colors"
                  title="Rename Conversation"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget({ id: conv.id, title: conv.title || 'Untitled Conversation' });
                  }}
                  className="p-1 text-[#878C85] hover:text-[#D32F2F] dark:hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                  title="Delete Conversation"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Subtle Secondary Metadata Line: Topic Tag or Message Count */}
        {!isEditing && (primaryTopic || Number(conv.message_count) > 0) && (
          <div className="flex items-center gap-2 pl-5.5 pt-1 text-[11px] text-[#878C85] dark:text-[#71717A] truncate">
            {primaryTopic && (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#287D54] dark:text-emerald-400/90 truncate">
                <span>#{primaryTopic.slug || primaryTopic.name}</span>
              </span>
            )}
            {Number(conv.message_count) > 0 && (
              <span className="font-mono text-[10px] tabular-nums">
                {conv.message_count} {Number(conv.message_count) === 1 ? 'turn' : 'turns'}
              </span>
            )}
          </div>
        )}
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

        {/* Workspace Mode Switcher: ChattyFi | Notes | Graph */}
        {onSwitchWorkspaceMode && (
          <div className="px-2.5 pt-2.5 pb-1">
            <div className="grid grid-cols-3 p-0.5 rounded-lg bg-[#E3E5DF]/80 dark:bg-[#111215] border border-[#E3E5DF] dark:border-[#272A32]">
              <button
                data-testid="workspace-mode-chattyfi"
                onClick={() => onSwitchWorkspaceMode('chattyfi')}
                className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  workspaceMode === 'chattyfi'
                    ? 'bg-white dark:bg-[#22242B] text-[#242824] dark:text-[#F4F4F5] shadow-2xs'
                    : 'text-[#666B65] dark:text-[#8E8E98] hover:text-[#242824] dark:hover:text-[#F4F4F5]'
                }`}
                title="ChattyFi — Conversational Workspace"
              >
                <Sparkles className="w-3 h-3 text-[#287D54] dark:text-emerald-400 shrink-0" />
                <span>ChattyFi</span>
              </button>
              <button
                data-testid="workspace-mode-notes"
                onClick={() => onSwitchWorkspaceMode('notes')}
                className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  workspaceMode === 'notes'
                    ? 'bg-white dark:bg-[#22242B] text-[#242824] dark:text-[#F4F4F5] shadow-2xs'
                    : 'text-[#666B65] dark:text-[#8E8E98] hover:text-[#242824] dark:hover:text-[#F4F4F5]'
                }`}
                title={`Notes — Knowledge Editor (${safeFiles.length} notes)`}
              >
                <FileText className="w-3 h-3 text-[#666B65] dark:text-[#A1A1AA] shrink-0" />
                <span>Notes</span>
              </button>
              <button
                data-testid="workspace-mode-graph"
                onClick={() => onOpenFullGraph && onOpenFullGraph()}
                className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-md text-[11px] font-medium text-[#666B65] dark:text-[#8E8E98] hover:text-[#242824] dark:hover:text-[#F4F4F5] transition-colors cursor-pointer"
                title="Graph — Knowledge Visualization"
              >
                <Share2 className="w-3 h-3 text-[#666B65] dark:text-[#A1A1AA] shrink-0" />
                <span>Graph</span>
              </button>
            </div>
          </div>
        )}

        {/* Primary Action: New Conversation Button */}
        <div className="p-2.5 pb-2">
          <button
            onClick={() => onCreateConversation && onCreateConversation()}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#287D54] hover:bg-[#1F6342] text-white text-xs font-semibold transition-colors cursor-pointer active:scale-[0.99]"
            title="Start a new ChattyFi knowledge session"
          >
            <Plus className="w-4 h-4" />
            <span>New conversation</span>
          </button>
        </div>

        {/* Search Conversations Input */}
        <div className="px-2.5 pb-2">
          <div className="relative flex items-center w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-[#878C85] dark:text-[#71717A] pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && onSearchChange) onSearchChange('');
              }}
              className="w-full bg-white dark:bg-[#121214] border border-[#E3E5DF] dark:border-[#272A32] focus:border-[#287D54] dark:focus:border-[#2EA468] rounded-md px-2.5 pl-8 pr-7 py-1.5 text-xs text-[#242824] dark:text-[#F4F4F5] placeholder-[#878C85] dark:placeholder-[#71717A] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  if (onSearchChange) onSearchChange('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2 p-0.5 text-[#878C85] hover:text-[#242824] dark:hover:text-[#F4F4F5] rounded transition-colors"
                title="Clear search (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation History List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-3">
          {isLoading && safeConversations.length === 0 ? (
            <div className="px-3 py-6 text-xs text-[#878C85] dark:text-[#71717A] text-center">
              Loading conversations...
            </div>
          ) : safeConversations.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-xs font-medium text-[#4A4F49] dark:text-[#A1A1AA] mb-1">
                {searchQuery ? 'No matching conversations' : 'No conversations yet'}
              </p>
              <p className="text-[11px] text-[#878C85] dark:text-[#71717A] leading-relaxed">
                {searchQuery
                  ? 'Try a different keyword or clear the search filter.'
                  : 'Start a conversation to think through concepts and capture structured notes.'}
              </p>
            </div>
          ) : (
            <>
              {/* Pinned Group */}
              {pinnedList.length > 0 && (
                <div className="space-y-0.5">
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#878C85] dark:text-[#71717A]">
                    Pinned
                  </div>
                  {pinnedList.map(renderConversationRow)}
                </div>
              )}

              {/* Today Group */}
              {todayList.length > 0 && (
                <div className="space-y-0.5">
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#878C85] dark:text-[#71717A]">
                    Today
                  </div>
                  {todayList.map(renderConversationRow)}
                </div>
              )}

              {/* Earlier Group */}
              {earlierList.length > 0 && (
                <div className="space-y-0.5">
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#878C85] dark:text-[#71717A]">
                    Earlier
                  </div>
                  {earlierList.map(renderConversationRow)}
                </div>
              )}
            </>
          )}

          {/* Quick Vault Notes Reference at bottom of scroll area */}
          {safeFiles.length > 0 && (
            <div className="pt-3 border-t border-[#E3E5DF]/80 dark:border-[#272A32]/80">
              <div className="px-2.5 py-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#878C85] dark:text-[#71717A]">
                <span className="flex items-center gap-1">
                  <FolderOpen className="w-3 h-3 text-[#287D54] dark:text-emerald-400" />
                  <span>Vault Notes</span>
                </span>
                <button
                  onClick={() => onSwitchWorkspaceMode && onSwitchWorkspaceMode('notes')}
                  className="text-[#287D54] dark:text-emerald-400 hover:underline lowercase font-sans font-medium cursor-pointer"
                >
                  view all ({safeFiles.length})
                </button>
              </div>
              <div className="space-y-0.5 mt-0.5">
                {safeFiles.slice(0, 4).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      if (onSelectFile) onSelectFile(f.id);
                      if (onSwitchWorkspaceMode) onSwitchWorkspaceMode('notes');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1 rounded text-xs text-[#666B65] dark:text-[#A1A1AA] hover:bg-[#E8EAE4] dark:hover:bg-[#202227] hover:text-[#242824] dark:hover:text-[#F4F4F5] transition-colors text-left cursor-pointer"
                    title={`Open "${f.title}" in Notes Editor`}
                  >
                    <FileText className="w-3 h-3 shrink-0 text-[#878C85] dark:text-[#71717A]" />
                    <span className="truncate">{f.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Account Bar */}
        <div className="px-3 py-2 border-t border-[#E3E5DF] dark:border-[#272A32] bg-[#F7F7F4] dark:bg-[#15161A] flex items-center justify-between text-xs shrink-0">
          {currentUser ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-full bg-[#287D54] text-white flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                  {currentUser.name ? currentUser.name[0] : currentUser.email[0]}
                </div>
                <div className="min-w-0 truncate">
                  <span className="font-medium text-[#242824] dark:text-[#F4F4F5] truncate block text-[11px]">
                    {currentUser.name || currentUser.email}
                  </span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1 text-[#878C85] hover:text-red-500 rounded transition-colors cursor-pointer shrink-0 ml-1"
                title="Log out of account"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-[#878C85] dark:text-[#71717A] text-[11px] font-mono">
                Guest Mode
              </span>
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1 text-[11px] font-medium text-[#287D54] dark:text-emerald-400 hover:underline cursor-pointer"
              >
                <LogIn className="w-3 h-3" />
                <span>Sign In</span>
              </button>
            </div>
          )}
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
            <span>{safeConversations.length} chats</span>
          )}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-[#878C85] dark:text-[#71717A] tabular-nums">
              {safeConversations.length} {safeConversations.length === 1 ? 'chat' : 'chats'}
            </span>
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

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        noteTitle={deleteTarget?.title}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget && onDeleteConversation) {
            onDeleteConversation(deleteTarget.id);
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

