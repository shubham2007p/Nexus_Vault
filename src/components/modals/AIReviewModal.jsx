import React, { useEffect } from 'react';
import {
  Sparkles,
  Check,
  X,
  CheckCheck,
  Link2,
  FileText,
  ArrowRight
} from 'lucide-react';

export default function AIReviewModal({
  isOpen,
  onClose,
  file,
  proposals = [],
  onAcceptLink,
  onRejectLink,
  onAcceptAll,
  onRejectAll,
}) {
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const pendingList = Array.isArray(proposals)
    ? proposals.filter((p) => p.status === 'pending' || p.is_ai_suggested === 1)
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150 select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-review-title"
    >
      <div
        className="relative w-full max-w-xl bg-white dark:bg-[#17171a] border border-[#E3E5DF] dark:border-[#2e2e36] rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-[#E3E5DF] dark:border-[#26262c] flex items-center justify-between bg-[#F7F7F4] dark:bg-[#131316] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#E7A23B]/15 border border-[#E7A23B]/30 flex items-center justify-center text-[#E7A23B]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="ai-review-title" className="text-sm font-semibold text-[#242824] dark:text-[#f4f4f5]">
                  AI Suggested Connections
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E7A23B]/15 text-[#B47818] dark:text-amber-300 border border-[#E7A23B]/30 font-semibold">
                  {pendingList.length} Proposal{pendingList.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-[#666B65] dark:text-[#8e8e98] mt-0.5">
                Review proposed connections for <span className="text-[#242824] dark:text-[#f4f4f5] font-medium">"{file?.title}"</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#666B65] dark:text-[#71717a] hover:text-[#242824] dark:hover:text-[#f4f4f5] hover:bg-[#F0F1ED] dark:hover:bg-[#222227] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Notice */}
        <div className="px-5 py-2.5 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-200/90 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#E7A23B] shrink-0" />
            <span>
              These proposals are candidates. You decide what gets consolidated into your note or discarded from the graph.
            </span>
          </div>
          {pendingList.length > 0 && onRejectAll && (
            <button
              onClick={() => onRejectAll(file?.id)}
              className="text-[10px] text-[#D32F2F] hover:underline shrink-0 cursor-pointer font-medium"
            >
              Discard All Proposals
            </button>
          )}
        </div>

        {/* Proposals List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-white dark:bg-[#17171a]">
          {pendingList.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#666B65] dark:text-[#71717a] italic space-y-2">
              <p>All AI connection proposals have been resolved.</p>
              <p className="text-[11px] text-[#8C918B] dark:text-[#52525b]">
                No pending proposals remain for this note.
              </p>
            </div>
          ) : (
            pendingList.map((link) => (
              <div
                key={link.id}
                className="p-3.5 rounded-xl bg-[#F7F7F4] dark:bg-[#1b1b1f] border border-[#E3E5DF] dark:border-[#2e2e36] hover:border-[#E7A23B]/40 transition-all space-y-2.5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 pr-2 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-[#287D54] dark:text-emerald-400">
                        [[{link.target_title}]]
                      </span>
                      {link.relationship && (
                        <span className="px-1.5 py-0.5 text-[10px] font-mono bg-[#F0F1ED] dark:bg-purple-500/15 text-[#666B65] dark:text-purple-300 rounded border border-[#E3E5DF] dark:border-purple-500/25">
                          {link.relationship}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Accept / Reject Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onAcceptLink(link.id)}
                      className="px-2.5 py-1 rounded-lg bg-[#287D54]/10 hover:bg-[#287D54]/20 text-[#287D54] dark:text-emerald-300 border border-[#287D54]/30 transition-all text-xs font-medium flex items-center gap-1 shadow-sm cursor-pointer"
                      title="Confirm: Append to note and make solid link"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm</span>
                    </button>
                    <button
                      onClick={() => onRejectLink(link.id)}
                      className="px-2.5 py-1 rounded-lg bg-[#D32F2F]/10 hover:bg-[#D32F2F]/20 text-[#D32F2F] dark:text-rose-300 border border-[#D32F2F]/30 transition-all text-xs font-medium flex items-center gap-1 shadow-sm cursor-pointer"
                      title="Discard proposal"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Discard</span>
                    </button>
                  </div>
                </div>

                {link.context && (
                  <p className="text-xs text-[#242824] dark:text-[#d4d4d8] leading-relaxed italic border-l-2 border-[#E7A23B]/60 pl-2.5 bg-white dark:bg-[#141417]/50 py-1 rounded-r border border-l-0 border-[#E3E5DF] dark:border-transparent">
                    "{link.context}"
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-[#E3E5DF] dark:border-[#26262c] flex items-center justify-between bg-[#F7F7F4] dark:bg-[#131316] shrink-0 text-xs text-[#666B65] dark:text-[#71717a]">
          <div className="flex items-center gap-2">
            {pendingList.length > 0 && onAcceptAll && (
              <button
                onClick={onAcceptAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#287D54] text-white hover:bg-[#1F6342] font-medium transition-all cursor-pointer shadow-sm"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Confirm All ({pendingList.length})</span>
              </button>
            )}
            {pendingList.length > 0 && onRejectAll && (
              <button
                onClick={() => onRejectAll(file?.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F0F1ED] dark:bg-rose-600/20 hover:bg-[#E3E5DF] dark:hover:bg-rose-600/35 text-[#D32F2F] dark:text-rose-300 border border-[#E3E5DF] dark:border-rose-500/30 font-medium transition-all cursor-pointer shadow-sm"
              >
                <X className="w-3.5 h-3.5" />
                <span>Discard All</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#F0F1ED] dark:bg-[#222228] hover:bg-[#E3E5DF] dark:hover:bg-[#2b2b34] text-[#242824] dark:text-[#f4f4f5] border border-[#E3E5DF] dark:border-[#2e2e36] rounded-lg font-medium transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
