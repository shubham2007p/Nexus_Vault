import React, { useState, useEffect, useRef } from 'react';
import {
  Copy,
  Check,
  RotateCcw,
  FileText,
  Image as ImageIcon,
  FileCode,
  Sparkles,
  AlertTriangle,
  BookOpen,
  ExternalLink,
  Lock,
  ArrowUpRight,
} from 'lucide-react';
import MarkdownMessage from './MarkdownMessage';

function formatBytes(bytes) {
  const num = Number(bytes) || 0;
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(2)} MB`;
}

function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr.includes('T') ? dateStr : `${dateStr.replace(' ', 'T')}Z`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const STARTER_PROMPTS = [
  {
    title: 'Derive Backpropagation & Chain Rule',
    topic: 'Neural Networks',
    prompt:
      'Explain how backpropagation computes gradients through a multi-layer perceptron. Include the matrix chain rule in LaTeX, a clean Python implementation of a single layer pass, and connect it to [[Neural Networks | mathematically grounds | Backpropagation]].',
  },
  {
    title: 'Virtual Memory & Page Table Walk',
    topic: 'Operating Systems',
    prompt:
      'Walk through how an x86-64 CPU translates a 48-bit virtual address using a 4-level page table and TLB. Compare page fault latencies in a table and link to [[Operating Systems | manages memory via | Virtual Memory]].',
  },
  {
    title: 'B-Tree vs LSM-Tree Write Amplification',
    topic: 'Database Internals',
    prompt:
      'Compare B-Trees and Log-Structured Merge (LSM) Trees for write-heavy workloads. Show the asymptotic I/O complexity in LaTeX and explain compaction trade-offs.',
  },
];

export default function MessageThread({
  messages = [],
  files = [],
  isGenerating = false,
  onSelectStarterPrompt,
  onLoadDemoConversation,
  onRegenerateMessage,
  onOpenNoteByTitle,
  onOpenNoteById,
}) {
  const [copiedId, setCopiedId] = useState(null);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const bottomAnchorRef = useRef(null);

  const safeMessages = Array.isArray(messages) ? messages : [];
  const safeFiles = Array.isArray(files) ? files : [];

  useEffect(() => {
    bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [safeMessages.length, isGenerating]);

  const handleCopyMessage = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text || '');
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const renderAttachmentItem = (att, idx) => {
    const type = att.file_type || 'document';
    const isImage = type === 'image' || (att.mime_type && att.mime_type.startsWith('image/'));
    const isPdf = type === 'pdf' || att.mime_type === 'application/pdf';
    const previewUrl = att.preview_url || att.storage_path || '';
    const hasVisualPreview = isImage && (previewUrl.startsWith('blob:') || previewUrl.startsWith('data:') || previewUrl.startsWith('http'));

    if (hasVisualPreview) {
      return (
        <div
          key={att.id || idx}
          onClick={() => setPreviewAttachment(att)}
          className="group relative inline-flex flex-col rounded-lg overflow-hidden border border-[#DEDCD5] dark:border-[#2C2F37] bg-white dark:bg-[#17181C] max-w-[220px] cursor-pointer"
        >
          <img
            src={previewUrl}
            alt={att.file_name}
            className="h-28 w-auto object-cover bg-[#F7F7F4] dark:bg-[#121316]"
          />
          <div className="px-2.5 py-1.5 flex items-center justify-between gap-2 text-[11px] bg-white dark:bg-[#17181C] border-t border-[#E3E5DF] dark:border-[#272A32]">
            <span className="truncate font-medium text-[#242824] dark:text-[#E4E4E7]">
              {att.file_name}
            </span>
            <span className="font-mono text-[10px] text-[#878C85] dark:text-[#71717A] shrink-0 tabular-nums">
              {formatBytes(att.file_size)}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        key={att.id || idx}
        className="inline-flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/90 dark:bg-[#17181C] border border-[#DEDCD5] dark:border-[#2C2F37] text-xs max-w-xs"
      >
        <div className="w-7 h-7 rounded-md bg-[#F0F1ED] dark:bg-[#22242B] flex items-center justify-center shrink-0 text-[#287D54] dark:text-emerald-400">
          {isImage ? (
            <ImageIcon className="w-3.5 h-3.5" />
          ) : isPdf ? (
            <FileText className="w-3.5 h-3.5" />
          ) : (
            <FileCode className="w-3.5 h-3.5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-[#242824] dark:text-[#F4F4F5] truncate text-xs">
            {att.file_name || 'Attachment'}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#878C85] dark:text-[#71717A] tabular-nums">
            <span className="uppercase">{type}</span>
            <span>•</span>
            <span>{formatBytes(att.file_size)}</span>
          </div>
        </div>
      </div>
    );
  };

  if (safeMessages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-12 flex flex-col items-center justify-center">
        <div className="w-full max-w-[680px] mx-auto">
          {/* Quiet Editorial Greeting */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#EFECE6] dark:bg-[#1E2026] text-[#287D54] dark:text-emerald-400 text-xs font-mono mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ChattyFi Conversational Knowledge Capture</span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#1E211E] dark:text-[#F4F4F5] leading-snug mb-2">
              What are you studying or reasoning through today?
            </h1>
            <p className="text-sm text-[#666B65] dark:text-[#A1A1AA] leading-relaxed max-w-[58ch]">
              Think out loud, test equations in LaTeX, attach study material, or explore concepts across your vault. Raw thoughts remain preserved while structured notes link directly into your knowledge graph.
            </p>
          </div>

          {/* Starter Prompts List (Flat, quiet horizontal rows — no bloated cards) */}
          <div className="space-y-2 mb-6">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#878C85] dark:text-[#71717A] mb-2">
              Suggested Reasoning Starters
            </div>
            <div className="divide-y divide-[#E3E5DF] dark:divide-[#272A32] border-t border-b border-[#E3E5DF] dark:border-[#272A32]">
              {STARTER_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectStarterPrompt && onSelectStarterPrompt(item.prompt)}
                  className="w-full py-3 px-2 flex items-center justify-between gap-4 text-left hover:bg-[#F2EFE9] dark:hover:bg-[#1A1C22] transition-colors group cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#242824] dark:text-[#F4F4F5] group-hover:text-[#287D54] dark:group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-xs text-[#666B65] dark:text-[#8E8E98] truncate mt-0.5 max-w-xl">
                      {item.prompt}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#EFECE6] dark:bg-[#202228] text-[#4A4F49] dark:text-[#A1A1AA]">
                      {item.topic}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-[#878C85] group-hover:text-[#287D54] dark:group-hover:text-emerald-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Demo Session Loader for Rich Formatting Inspection */}
          {onLoadDemoConversation && (
            <div className="flex items-center justify-between gap-4 pt-2">
              <span className="text-xs text-[#878C85] dark:text-[#71717A]">
                Want to inspect rendered Markdown, KaTeX equations, code blocks, wikilinks & attachments?
              </span>
              <button
                onClick={onLoadDemoConversation}
                className="px-3 py-1.5 rounded-md bg-white dark:bg-[#1E2026] hover:bg-[#EFECE6] dark:hover:bg-[#262932] text-[#287D54] dark:text-emerald-400 border border-[#DEDCD5] dark:border-[#2C2F37] text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Load Rich Study Thread</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8">
      <div className="w-full max-w-[740px] mx-auto space-y-8 pb-8">
        {safeMessages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const meta = msg.processing_metadata || {};
          const attachments =
            Array.isArray(msg.attachments) && msg.attachments.length > 0
              ? msg.attachments
              : Array.isArray(meta.attachments)
              ? meta.attachments
              : [];
          const genStatus = msg.generation_status || msg.status || 'completed';
          const procStatus = msg.processing_status || msg.knowledge_status || 'pending';
          const isIncomplete =
            genStatus === 'interrupted' ||
            genStatus === 'failed' ||
            procStatus === 'blocked_incomplete';
          const modelLabel = msg.model || meta.model || '';

          // Resolve linked raw or formal vault notes if present
          const rawFileId = msg.raw_file_id || meta.raw_file_id;
          const formalFileId = msg.formal_file_id || meta.formal_file_id;
          const rawNote = rawFileId
            ? safeFiles.find((f) => String(f.id) === String(rawFileId))
            : null;
          const formalNote = formalFileId
            ? safeFiles.find((f) => String(f.id) === String(formalFileId))
            : null;

          if (isUser) {
            return (
              <div key={msg.id || index} className="flex flex-col items-end">
                <div className="max-w-[88%] sm:max-w-[82%] rounded-2xl bg-[#EFECE6] dark:bg-[#1E2026] px-4 py-3.5 text-[#1E211E] dark:text-[#F4F4F5]">
                  {/* Attachments inside User Message */}
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {attachments.map((att, idx) => renderAttachmentItem(att, idx))}
                    </div>
                  )}

                  {/* User Message Text */}
                  <div className="font-mono text-[14.5px] leading-[1.75] tracking-[0.012em] whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>
                </div>

                {/* Subtle Immutability & Timestamp Caption */}
                <div className="flex items-center gap-2 mt-1.5 px-1 text-[11px] text-[#878C85] dark:text-[#71717A]">
                  <span className="inline-flex items-center gap-1 font-mono text-[10px]" title="User raw messages are preserved unmodified in the vault">
                    <Lock className="w-2.5 h-2.5 text-[#287D54] dark:text-emerald-400" />
                    <span>Raw preserved</span>
                  </span>
                  {msg.created_at && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-[10px] tabular-nums">
                        {formatMessageTime(msg.created_at)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          }

          // Assistant Message (Claude-inspired open editorial canvas)
          return (
            <div key={msg.id || index} className="group flex flex-col items-start">
              {/* Subtle Sender Header */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-md bg-[#287D54]/12 dark:bg-emerald-500/15 border border-[#287D54]/25 dark:border-emerald-500/30 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-[#287D54] dark:text-emerald-400" />
                </div>
                <span className="text-xs font-semibold text-[#242824] dark:text-[#F4F4F5]">
                  ChattyFi
                </span>
                {modelLabel && (
                  <span className="text-[11px] font-mono text-[#878C85] dark:text-[#71717A]">
                    {modelLabel}
                  </span>
                )}
                {msg.created_at && (
                  <span className="text-[10px] font-mono text-[#878C85] dark:text-[#71717A] tabular-nums">
                    {formatMessageTime(msg.created_at)}
                  </span>
                )}
              </div>

              {/* Assistant Attachments (if any) */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 pl-7">
                  {attachments.map((att, idx) => renderAttachmentItem(att, idx))}
                </div>
              )}

              {/* Assistant Editorial Prose (Markdown, Code, LaTeX, Wikilinks) */}
              <div className="w-full pl-0 sm:pl-7">
                <MarkdownMessage
                  content={msg.content}
                  files={safeFiles}
                  onNavigateToNote={onOpenNoteById}
                  onOpenNote={onOpenNoteByTitle}
                />

                {/* Safeguard 5 Incomplete / Interrupted Warning Banner */}
                {isIncomplete && (
                  <div className="mt-3 px-3 py-2 rounded-md bg-[#FEF7EC] dark:bg-amber-950/40 border border-[#E7A23B]/40 dark:border-amber-500/30 flex items-center gap-2 text-xs text-[#9A6214] dark:text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#D97706] dark:text-amber-400" />
                    <span>
                      Response {genStatus === 'failed' ? 'failed' : 'interrupted'} — excluded from automatic knowledge vault synthesis (Safeguard 5).
                    </span>
                  </div>
                )}

                {/* Assistant Action & Knowledge Status Footer */}
                <div className="mt-3 pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#878C85] dark:text-[#71717A]">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyMessage(msg.id || index, msg.content)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-[#EFECE6] dark:hover:bg-[#1E2026] hover:text-[#242824] dark:hover:text-[#F4F4F5] transition-colors cursor-pointer"
                      title="Copy response Markdown"
                    >
                      {copiedId === (msg.id || index) ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#287D54] dark:text-emerald-400" />
                          <span className="text-[11px] text-[#287D54] dark:text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Copy</span>
                        </>
                      )}
                    </button>

                    {onRegenerateMessage && index === safeMessages.length - 1 && !isGenerating && (
                      <button
                        onClick={() => onRegenerateMessage(msg)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-[#EFECE6] dark:hover:bg-[#1E2026] hover:text-[#242824] dark:hover:text-[#F4F4F5] transition-colors cursor-pointer"
                        title="Regenerate response"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Regenerate</span>
                      </button>
                    )}
                  </div>

                  {/* Knowledge Capture Lineage Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {rawNote && (
                      <button
                        onClick={() => onOpenNoteById && onOpenNoteById(rawNote.id)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EFECE6] dark:bg-[#1E2026] hover:bg-[#E3E5DF] dark:hover:bg-[#272A32] text-[#242824] dark:text-[#E4E4E7] text-[11px] font-mono transition-colors cursor-pointer"
                        title={`Open linked raw note: ${rawNote.title}`}
                      >
                        <FileText className="w-3 h-3 text-[#287D54] dark:text-emerald-400" />
                        <span>raw/{rawNote.title}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                      </button>
                    )}

                    {formalNote && (
                      <button
                        onClick={() => onOpenNoteById && onOpenNoteById(formalNote.id)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-[#9A6214] dark:text-amber-300 border border-amber-500/20 text-[11px] font-mono transition-colors cursor-pointer"
                        title={`Open linked formal note: ${formalNote.title}`}
                      >
                        <BookOpen className="w-3 h-3 text-[#D97706] dark:text-amber-400" />
                        <span>process/{formalNote.title}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                      </button>
                    )}

                    {!rawNote && !formalNote && !isIncomplete && (
                      <span className="text-[11px] font-mono text-[#878C85] dark:text-[#71717A]">
                        {procStatus === 'processed' || procStatus === 'completed'
                          ? 'Captured in Vault'
                          : 'Vault capture: Ready'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Generating Indicator */}
        {isGenerating && (
          <div className="flex items-center gap-2.5 pl-0 sm:pl-7 py-2 text-xs text-[#666B65] dark:text-[#A1A1AA]">
            <span className="w-2 h-2 rounded-full bg-[#287D54] dark:bg-emerald-400 animate-ping" />
            <span className="font-mono">ChattyFi is composing a structured response...</span>
          </div>
        )}

        <div ref={bottomAnchorRef} />
      </div>

      {/* Lightbox Modal for Image Attachment Preview */}
      {previewAttachment && (
        <div
          onClick={() => setPreviewAttachment(null)}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl max-h-[85vh] bg-white dark:bg-[#17181C] rounded-xl overflow-hidden border border-[#E3E5DF] dark:border-[#272A32] flex flex-col"
          >
            <div className="px-4 py-2.5 border-b border-[#E3E5DF] dark:border-[#272A32] flex items-center justify-between text-xs">
              <span className="font-medium text-[#242824] dark:text-[#F4F4F5]">
                {previewAttachment.file_name}
              </span>
              <button
                onClick={() => setPreviewAttachment(null)}
                className="text-[#878C85] hover:text-[#242824] dark:hover:text-[#F4F4F5] font-mono px-2 py-0.5 cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-[#F7F7F4] dark:bg-[#111113]">
              <img
                src={previewAttachment.preview_url || previewAttachment.storage_path}
                alt={previewAttachment.file_name}
                className="max-h-[70vh] w-auto object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

