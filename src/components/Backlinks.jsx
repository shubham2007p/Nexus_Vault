import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Check,
  X,
  Sparkles,
  Link2,
  ExternalLink,
  Sliders,
  Eye,
  EyeOff,
  FileText,
  Clock,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function Backlinks({
  file,
  backlinks = [],
  onAcceptLink,
  onRejectLink,
  onSelectFile,
  onProcessAI,
  isAIProcessing,
  showAILinks = true,
  onToggleShowAILinks,
  onOpenAIReview,
  onRejectAllLinks,
  onAcceptAllLinks,
}) {
  const [activeTab, setActiveTab] = useState('backlinks'); // 'backlinks' | 'inspector'

  if (!file) {
    return (
      <div className="w-full flex flex-col h-full p-6 justify-center items-center text-[#878C85] dark:text-[#71717A] text-xs select-none text-center bg-[#F0F1ED] dark:bg-[#151518] transition-colors">
        <ArrowLeftRight className="w-6 h-6 mb-2 text-[#878C85] dark:text-[#52525B]" />
        <p className="font-semibold text-[#242824] dark:text-[#D4D4D8]">No Note Selected</p>
        <p className="text-[11px] text-[#666B65] dark:text-[#71717A] mt-1">Select a note to inspect backlinks & connections</p>
      </div>
    );
  }

  const safeBacklinks = Array.isArray(backlinks) ? backlinks : [];
  const acceptedLinks = safeBacklinks.filter((b) => b.status === 'accepted');
  const pendingLinks = safeBacklinks.filter((b) => b.status === 'pending' || b.is_ai_suggested === 1);

  // Compute word and character count
  const wordCount = (file.content || '').trim().split(/\s+/).filter(Boolean).length;
  const charCount = (file.content || '').length;

  return (
    <div className="w-full flex flex-col h-full select-none overflow-hidden bg-[#F0F1ED] dark:bg-[#151518] transition-colors">
      {/* Header with Backlinks vs Inspector Tabs & AI Toggle */}
      <div className="h-11 px-2.5 border-b border-[#E3E5DF] dark:border-[#26262C] flex items-center justify-between shrink-0 bg-[#F0F1ED] dark:bg-[#17181C] gap-1 transition-colors">
        {/* Tab Switcher */}
        <div className="flex items-center p-0.5 bg-[#E8EAE4] dark:bg-[#1b1b1f] border border-[#E3E5DF] dark:border-[#26262c] rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('backlinks')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
              activeTab === 'backlinks'
                ? 'bg-white dark:bg-[#27272e] text-[#242824] dark:text-[#f4f4f5] shadow-2xs font-semibold'
                : 'text-[#666B65] dark:text-[#8e8e98] hover:text-[#242824] dark:hover:text-[#d4d4d8]'
            }`}
          >
            <Link2 className="w-3.5 h-3.5 text-[#287D54] dark:text-emerald-400" />
            <span>Backlinks</span>
            <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-[#F0F1ED] dark:bg-[#151518] text-[#666B65] dark:text-[#a1a1aa] ml-0.5">
              {acceptedLinks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('inspector')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
              activeTab === 'inspector'
                ? 'bg-white dark:bg-[#27272e] text-[#242824] dark:text-[#f4f4f5] shadow-2xs font-semibold'
                : 'text-[#666B65] dark:text-[#8e8e98] hover:text-[#242824] dark:hover:text-[#d4d4d8]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-[#E7A23B] dark:text-amber-400" />
            <span>Inspector</span>
            {pendingLinks.length > 0 && (
              <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-[#B45309] dark:text-amber-300 ml-0.5 font-semibold">
                {pendingLinks.length}
              </span>
            )}
          </button>
        </div>

        {/* AI Graph Links ON/OFF Switch */}
        {onToggleShowAILinks && (
          <button
            onClick={() => onToggleShowAILinks(!showAILinks)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border transition-all cursor-pointer ${
              showAILinks
                ? 'bg-[#FEF7EC] dark:bg-amber-500/15 text-[#9A6214] dark:text-amber-300 border-[#E7A23B]/40 dark:border-amber-500/35 shadow-2xs'
                : 'bg-white dark:bg-[#1b1b1f] text-[#878C85] dark:text-[#71717a] border-[#E3E5DF] dark:border-[#2e2e36] hover:text-[#242824] dark:hover:text-[#a1a1aa]'
            }`}
            title={`Toggle AI recommended links on graph (Currently ${showAILinks ? 'ON' : 'OFF'})`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${showAILinks ? 'bg-[#E7A23B] dark:bg-amber-400' : 'bg-[#878C85] dark:bg-[#52525b]'}`} />
            <span>AI Graph: {showAILinks ? 'ON' : 'OFF'}</span>
          </button>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {activeTab === 'backlinks' ? (
          /* BACKLINKS TAB */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#242824] dark:text-[#e4e4e7] flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[#287D54] dark:text-emerald-400" />
                Incoming references ({acceptedLinks.length})
              </span>
            </div>

            {acceptedLinks.length === 0 ? (
              <div className="p-5 bg-white dark:bg-[#111113] border border-[#E3E5DF] dark:border-[#26262c] rounded-xl text-center text-xs text-[#878C85] dark:text-[#71717a] space-y-1">
                <p className="italic">No incoming backlinks to this note.</p>
                <p className="text-[11px] text-[#666B65] dark:text-[#52525b]">
                  Other notes linking to [[{file.title}]] will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {acceptedLinks.map((link) => (
                  <div
                    key={link.id}
                    onClick={() => onSelectFile(link.source_file_id)}
                    className="p-2.5 rounded-lg bg-white dark:bg-[#1a1a1e] hover:bg-[#F7F7F4] dark:hover:bg-[#202026] border border-[#E3E5DF] dark:border-[#26262c] hover:border-[#287D54] dark:hover:border-[#383842] cursor-pointer transition-all space-y-1.5 group shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-xs font-medium text-[#242824] dark:text-[#f4f4f5]">
                      <span className="group-hover:text-[#287D54] dark:group-hover:text-emerald-300 transition-colors flex items-center gap-1.5 truncate font-semibold">
                        {link.source_file_title}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#287D54] dark:text-emerald-400 shrink-0" />
                      </span>
                      {link.relationship && (
                        <span className="px-2 py-0.5 text-[11px] font-mono bg-[#287D54]/10 dark:bg-emerald-500/10 text-[#287D54] dark:text-emerald-300 border border-[#287D54]/25 dark:border-emerald-500/25 rounded shrink-0 ml-1">
                          {link.relationship}
                        </span>
                      )}
                    </div>

                    {link.context && (
                      <p className="text-[11px] text-[#666B65] dark:text-[#a1a1aa] line-clamp-2 leading-relaxed pl-1.5 border-l border-[#E3E5DF] dark:border-[#2e2e36]">
                        {link.context}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* INSPECTOR TAB */
          <div className="space-y-4">
            {/* Note Metadata Card */}
            <div className="p-3 rounded-xl bg-white dark:bg-[#131316] border border-[#E3E5DF] dark:border-[#26262c] space-y-2">
              <span className="text-xs font-semibold text-[#242824] dark:text-[#e4e4e7] block">
                Note Properties
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-[#F7F7F4] dark:bg-[#1a1a1e] border border-[#E3E5DF] dark:border-[#242428]">
                  <span className="text-[#878C85] dark:text-[#94a3b8] block text-[11px]">Words</span>
                  <span className="font-semibold text-[#242824] dark:text-[#f4f4f5]">{wordCount}</span>
                </div>
                <div className="p-2 rounded bg-[#F7F7F4] dark:bg-[#1a1a1e] border border-[#E3E5DF] dark:border-[#242428]">
                  <span className="text-[#878C85] dark:text-[#94a3b8] block text-[11px]">Characters</span>
                  <span className="font-semibold text-[#242824] dark:text-[#f4f4f5]">{charCount}</span>
                </div>
                <div className="col-span-2 p-2 rounded bg-[#F7F7F4] dark:bg-[#1a1a1e] border border-[#E3E5DF] dark:border-[#242428] truncate">
                  <span className="text-[#878C85] dark:text-[#94a3b8] block text-[11px]">File Path</span>
                  <span className="font-mono text-[#242824] dark:text-[#d4d4d8] text-[11px] truncate block">
                    {file.path || `${file.title}.md`}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Candidates & Validation Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#9A6214] dark:text-amber-300 flex items-center gap-1.5">
                  AI Link Candidates ({pendingLinks.length})
                </span>
                {pendingLinks.length > 0 && onOpenAIReview && (
                  <button
                    onClick={onOpenAIReview}
                    className="text-xs text-[#287D54] dark:text-emerald-400 hover:underline font-medium cursor-pointer"
                  >
                    Review Modal
                  </button>
                )}
              </div>

              {pendingLinks.length === 0 ? (
                <div className="p-4 bg-white dark:bg-[#131316] border border-[#E3E5DF] dark:border-[#26262c] rounded-xl text-center text-xs text-[#878C85] dark:text-[#71717a] space-y-1">
                  <p className="italic">No pending AI candidates.</p>
                  <p className="text-[11px] text-[#666B65] dark:text-[#71717a]">
                    Click "Discover AI Links" below to propose contextual relationships.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Candidate Validation Authority Banner */}
                  <div className="p-2.5 rounded-lg bg-[#FEF7EC] dark:bg-amber-950/20 border border-[#E7A23B]/35 dark:border-amber-500/25 space-y-2">
                    <div className="text-xs text-[#9A6214] dark:text-amber-200/90 leading-relaxed">
                      Candidates appear as dashed lines on graph. Confirm to consolidate into note, or discard all to dismiss.
                    </div>
                    <div className="flex items-center gap-2 pt-0.5">
                      {onAcceptAllLinks && (
                        <button
                          onClick={onAcceptAllLinks}
                          className="flex-1 py-1 px-2 rounded bg-[#287D54] hover:bg-[#1F6342] text-white text-xs font-semibold transition-colors text-center cursor-pointer shadow-2xs"
                        >
                          Confirm All
                        </button>
                      )}
                      {onRejectAllLinks && (
                        <button
                          onClick={() => onRejectAllLinks(file.id)}
                          className="flex-1 py-1 px-2 rounded bg-[#FDF2F2] dark:bg-rose-600/20 hover:bg-[#FEE2E2] dark:hover:bg-rose-600/35 text-[#991B1B] dark:text-rose-300 border border-[#D32F2F]/30 dark:border-rose-500/30 text-xs font-medium transition-colors text-center cursor-pointer shadow-2xs"
                        >
                          Discard All
                        </button>
                      )}
                    </div>
                  </div>

                  {pendingLinks.map((link) => (
                    <div
                      key={link.id}
                      className="p-2.5 rounded-lg bg-white dark:bg-[#1a1713] border border-[#E3E5DF] dark:border-amber-500/30 space-y-2 transition-all shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0 pr-1">
                          <span className="text-xs font-semibold text-[#9A6214] dark:text-amber-200 block truncate">
                            [[{link.target_title}]]
                          </span>
                          {link.relationship && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-[11px] font-mono font-medium bg-amber-500/10 dark:bg-amber-500/15 text-[#B45309] dark:text-amber-300 rounded border border-amber-500/25">
                              {link.relationship}
                            </span>
                          )}
                        </div>

                        {/* Accept / Reject Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => onAcceptLink(link.id)}
                            className="px-2 py-1 rounded bg-[#287D54] hover:bg-[#1F6342] text-white transition-colors shadow-2xs text-xs font-medium flex items-center gap-1 cursor-pointer"
                            title="Confirm: Consolidate into permanent note link"
                          >
                            <Check className="w-3 h-3" />
                            <span>Confirm</span>
                          </button>
                          <button
                            onClick={() => onRejectLink(link.id)}
                            className="px-2 py-1 rounded bg-[#FDF2F2] dark:bg-rose-600/25 hover:bg-[#FEE2E2] dark:hover:bg-rose-600/40 text-[#991B1B] dark:text-rose-300 border border-[#D32F2F]/30 dark:border-rose-500/35 transition-colors shadow-2xs text-xs font-medium flex items-center gap-1 cursor-pointer"
                            title="Discard: Remove proposal from graph and vault"
                          >
                            <X className="w-3 h-3" />
                            <span>Discard</span>
                          </button>
                        </div>
                      </div>

                      {link.context && (
                        <p className="text-[11px] text-[#666B65] dark:text-[#d4d4d8] leading-relaxed italic border-l-2 border-[#E7A23B] dark:border-amber-500/40 pl-2">
                          "{link.context}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Process Button - Quiet, deliberate green */}
      <div className="p-2.5 border-t border-[#E3E5DF] dark:border-[#26262C] bg-[#F0F1ED] dark:bg-[#17181C] shrink-0 transition-colors">
        <button
          onClick={() => onProcessAI(file.id)}
          disabled={isAIProcessing}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#287D54] hover:bg-[#1F6342] border border-[#287D54]/50 text-white rounded-lg text-xs font-semibold shadow-xs active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
        >
          {isAIProcessing && (
            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
          )}
          <span>{isAIProcessing ? 'Discovering connections...' : 'Discover AI Links'}</span>
        </button>
      </div>
    </div>
  );
}
