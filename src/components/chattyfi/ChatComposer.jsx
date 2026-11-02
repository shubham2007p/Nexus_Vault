import React, { useState, useRef, useEffect } from 'react';
import {
  Paperclip,
  ArrowUp,
  Square,
  X,
  FileText,
  Image as ImageIcon,
  FileCode,
  Bot,
  AlertCircle,
} from 'lucide-react';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function formatBytes(bytes) {
  const num = Number(bytes) || 0;
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(2)} MB`;
}

function classifyFile(file) {
  const name = (file.name || '').toLowerCase();
  const mime = (file.type || '').toLowerCase();

  if (
    mime.startsWith('image/') ||
    name.endsWith('.png') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.webp') ||
    name.endsWith('.gif')
  ) {
    return { valid: true, file_type: 'image', mime_type: mime || 'image/png' };
  }

  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    return { valid: true, file_type: 'pdf', mime_type: 'application/pdf' };
  }

  if (
    mime.startsWith('text/') ||
    name.endsWith('.md') ||
    name.endsWith('.markdown') ||
    name.endsWith('.txt') ||
    name.endsWith('.csv') ||
    name.endsWith('.json')
  ) {
    return { valid: true, file_type: 'document', mime_type: mime || 'text/markdown' };
  }

  return { valid: false };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result.slice(0, 12000) : '');
    reader.onerror = () => resolve('');
    reader.readAsText(file);
  });
}

export default function ChatComposer({
  value = '',
  onChange,
  onSendMessage,
  isGenerating = false,
  onStopGeneration,
  aiConfig,
  onOpenAIConfig,
  disabled = false,
}) {
  const [stagedAttachments, setStagedAttachments] = useState([]);
  const [validationError, setValidationError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-resize textarea height cleanly
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const nextHeight = Math.min(Math.max(el.scrollHeight, 52), 200);
    el.style.height = `${nextHeight}px`;
  }, [value]);

  const handleFilesSelected = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setValidationError(null);

    const incoming = Array.from(fileList);
    const nextStaged = [];

    for (const file of incoming) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setValidationError(
          `"${file.name}" (${formatBytes(file.size)}) exceeds the 10 MB attachment limit.`
        );
        continue;
      }

      const classification = classifyFile(file);
      if (!classification.valid) {
        setValidationError(
          `"${file.name}" is not supported. Attach PNG/JPG/WEBP images, PDFs, or Markdown/Text files (.md, .txt, .csv).`
        );
        continue;
      }

      let previewUrl = '';
      let extractedText = null;
      let statusLabel = 'Metadata ready';

      if (classification.file_type === 'image') {
        previewUrl = await readFileAsDataUrl(file);
        statusLabel = 'Image preview attached';
      } else if (classification.file_type === 'document') {
        extractedText = await readFileAsText(file);
        statusLabel = 'Text extracted for Vault';
      } else if (classification.file_type === 'pdf') {
        statusLabel = 'PDF queued for Vault';
      }

      nextStaged.push({
        local_id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file_name: file.name,
        file_type: classification.file_type,
        mime_type: classification.mime_type,
        file_size: file.size,
        storage_path: previewUrl || `uploads/${file.name}`,
        preview_url: previewUrl,
        extracted_text: extractedText,
        status_label: statusLabel,
      });
    }

    if (nextStaged.length > 0) {
      setStagedAttachments((prev) => [...prev, ...nextStaged].slice(0, 6));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (localId) => {
    setStagedAttachments((prev) => prev.filter((item) => item.local_id !== localId));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isGenerating || disabled) return;

    const trimmed = (value || '').trim();
    if (!trimmed && stagedAttachments.length === 0) return;

    const contentToSend =
      trimmed ||
      `Attached ${stagedAttachments.map((a) => a.file_name).join(', ')} for knowledge review.`;

    if (onSendMessage) {
      onSendMessage(contentToSend, stagedAttachments);
    }
    setStagedAttachments([]);
    setValidationError(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const insertSyntaxSnippet = (snippet) => {
    const el = textareaRef.current;
    if (!el || !onChange) return;
    const start = el.selectionStart || value.length;
    const end = el.selectionEnd || value.length;
    const nextValue = `${value.slice(0, start)}${snippet}${value.slice(end)}`;
    onChange(nextValue);
    setTimeout(() => {
      el.focus();
    }, 10);
  };

  const activeProvider = aiConfig?.activeProvider || 'groq';
  const activeModel =
    aiConfig?.models?.[activeProvider] || aiConfig?.activeModel || 'openai/gpt-oss-120b';

  return (
    <div className="w-full px-4 sm:px-8 pb-5 pt-2 bg-gradient-to-t from-[#FAF8F5] via-[#FAF8F5] to-transparent dark:from-[#15161A] dark:via-[#15161A] shrink-0">
      <div className="w-full max-w-[740px] mx-auto">
        {/* Inline Validation Alert */}
        {validationError && (
          <div className="mb-2 px-3 py-2 rounded-lg bg-[#FDF2F2] dark:bg-rose-950/60 border border-[#D32F2F]/30 dark:border-rose-500/40 flex items-center justify-between gap-2 text-xs text-[#991B1B] dark:text-rose-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#D32F2F] dark:text-rose-400" />
              <span>{validationError}</span>
            </div>
            <button
              onClick={() => setValidationError(null)}
              className="p-0.5 hover: opacity-80 cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Composer Box */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer?.files?.length) {
              handleFilesSelected(e.dataTransfer.files);
            }
          }}
          className={`rounded-xl bg-white dark:bg-[#1B1D24] border transition-colors ${
            isDragging
              ? 'border-[#287D54] dark:border-[#2EA468] bg-[#F4F9F6] dark:bg-[#19231E]'
              : 'border-[#DCD9D0] dark:border-[#2A2D36] focus-within:border-[#287D54] dark:focus-within:border-[#2EA468]'
          }`}
        >
          {/* Attachment Staging Tray */}
          {stagedAttachments.length > 0 && (
            <div className="px-3.5 pt-3 pb-2 border-b border-[#ECEAE4] dark:border-[#262932] flex flex-wrap gap-2">
              {stagedAttachments.map((att) => (
                <div
                  key={att.local_id}
                  className="group relative flex items-center gap-2.5 pl-2.5 pr-2 py-1.5 rounded-lg bg-[#F7F7F4] dark:bg-[#141519] border border-[#E3E5DF] dark:border-[#272A32] text-xs max-w-[240px]"
                >
                  {att.file_type === 'image' && att.preview_url ? (
                    <img
                      src={att.preview_url}
                      alt={att.file_name}
                      className="w-8 h-8 rounded object-cover shrink-0 border border-[#E3E5DF] dark:border-[#272A32]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-[#EFECE6] dark:bg-[#202228] flex items-center justify-center shrink-0 text-[#287D54] dark:text-emerald-400">
                      {att.file_type === 'image' ? (
                        <ImageIcon className="w-4 h-4" />
                      ) : att.file_type === 'pdf' ? (
                        <FileText className="w-4 h-4" />
                      ) : (
                        <FileCode className="w-4 h-4" />
                      )}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[#242824] dark:text-[#F4F4F5] truncate text-xs">
                      {att.file_name}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-[#878C85] dark:text-[#71717A] tabular-nums">
                      <span>{formatBytes(att.file_size)}</span>
                      <span>•</span>
                      <span className="text-[#287D54] dark:text-emerald-400 truncate">
                        {att.status_label}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(att.local_id)}
                    className="p-1 rounded-md text-[#878C85] hover:text-[#D32F2F] dark:hover:text-rose-400 hover:bg-[#E8EAE4] dark:hover:bg-[#252830] transition-colors cursor-pointer shrink-0"
                    title="Remove attachment"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Textarea Input */}
          <div className="px-3.5 pt-3 pb-1">
            <textarea
              ref={textareaRef}
              rows={2}
              value={value}
              onChange={(e) => onChange && onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder="Ask a question, explain a concept, write LaTeX ($...$), or link notes with [[Topic]]..."
              className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-[#1E211E] dark:text-[#F4F4F5] placeholder-[#878C85] dark:placeholder-[#71717A] focus:outline-none"
            />
          </div>

          {/* Bottom Composer Action Bar */}
          <div className="px-3 pb-2.5 pt-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,.pdf,.md,.markdown,.txt,.csv"
                onChange={(e) => handleFilesSelected(e.target.files)}
                className="hidden"
              />

              {/* Attach Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 px-2 rounded-md text-[#666B65] dark:text-[#A1A1AA] hover:text-[#242824] dark:hover:text-[#F4F4F5] hover:bg-[#F0F1ED] dark:hover:bg-[#252830] text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Attach Image, PDF, or Markdown/Text document (up to 10 MB)"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Attach</span>
              </button>

              {/* Quick Syntax Helpers for Wikilinks & LaTeX */}
              <button
                type="button"
                onClick={() => insertSyntaxSnippet('[[Operating Systems]]')}
                className="h-7 px-2 rounded-md text-[#666B65] dark:text-[#A1A1AA] hover:text-[#287D54] dark:hover:text-emerald-400 hover:bg-[#F0F1ED] dark:hover:bg-[#252830] text-[11px] font-mono hidden md:inline-flex items-center transition-colors cursor-pointer"
                title="Insert Vault Wikilink syntax"
              >
                [[WikiLink]]
              </button>

              <button
                type="button"
                onClick={() => insertSyntaxSnippet('$$\\nabla_\\theta \\mathcal{L}(\\theta)$$')}
                className="h-7 px-2 rounded-md text-[#666B65] dark:text-[#A1A1AA] hover:text-[#287D54] dark:hover:text-emerald-400 hover:bg-[#F0F1ED] dark:hover:bg-[#252830] text-[11px] font-mono hidden md:inline-flex items-center transition-colors cursor-pointer"
                title="Insert LaTeX math block"
              >
                $$LaTeX$$
              </button>

              {/* Active AI Model Selector Pill */}
              {onOpenAIConfig && (
                <button
                  type="button"
                  onClick={onOpenAIConfig}
                  className="h-7 px-2.5 rounded-md bg-[#F7F7F4] dark:bg-[#141519] hover:bg-[#EFECE6] dark:hover:bg-[#252830] text-[#4A4F49] dark:text-[#A1A1AA] border border-[#E3E5DF] dark:border-[#272A32] text-[11px] font-mono inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Configure AI Provider & Model"
                >
                  <Bot className="w-3 h-3 text-[#287D54] dark:text-emerald-400" />
                  <span className="truncate max-w-[140px]">{activeModel}</span>
                </button>
              )}
            </div>

            {/* Right: Stop Generation or Send */}
            <div className="flex items-center gap-2">
              {isGenerating ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="h-8 px-3 rounded-lg bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Stop generation (marks incomplete per Safeguard 5)"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    disabled || (!(value || '').trim() && stagedAttachments.length === 0)
                  }
                  className="h-8 px-3 rounded-lg bg-[#287D54] hover:bg-[#1F6342] disabled:opacity-35 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Send message (Enter)"
                >
                  <span>Send</span>
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quiet Caption Bar */}
        <div className="mt-1.5 px-1 flex items-center justify-between text-[11px] text-[#878C85] dark:text-[#71717A]">
          <span>
            <kbd className="font-mono">Enter</kbd> to send, <kbd className="font-mono">Shift + Enter</kbd> for new line
          </span>
          <span className="hidden sm:inline font-mono text-[10px]">
            Raw messages preserved • Interrupted responses excluded from synthesis
          </span>
        </div>
      </div>
    </div>
  );
}

