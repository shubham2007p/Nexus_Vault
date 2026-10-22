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
      <div className="w-full flex flex-col h-full p-6 justify-center items-center text-[#71717a] text-xs select-none text-center bg-[#151518]">
        <ArrowLeftRight className="w-7 h-7 mb-2 text-[#3f3f46]" />
        <p className="font-medium text-[#a1a1aa]">No Note Selected</p>
        <p className="text-[11px] text-[#52525b] mt-1">Select a note to inspect backlinks & AI connections</p>
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
    <div className="w-full flex flex-col h-full select-none overflow-hidden bg-[#151518]">
      {/* Header with Backlinks vs Inspector Tabs & AI Toggle */}
      <div className="h-11 px-2.5 border-b border-[#26262c] flex items-center justify-between shrink-0 bg-[#121214] gap-1">
        {/* Tab Switcher */}
        <div className="flex items-center p-0.5 bg-[#1b1b1f] border border-[#26262c] rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('backlinks')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              activeTab === 'backlinks'
                ? 'bg-[#27272e] text-[#f4f4f5] shadow-sm'
                : 'text-[#8e8e98] hover:text-[#d4d4d8]'
            }`}
          >
            <Link2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Backlinks</span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#151518] text-[#a1a1aa] ml-0.5">
              {acceptedLinks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('inspector')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              activeTab === 'inspector'
                ? 'bg-[#27272e] text-[#f4f4f5] shadow-sm'
                : 'text-[#8e8e98] hover:text-[#d4d4d8]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Inspector</span>
            {pendingLinks.length > 0 && (
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 ml-0.5 animate-pulse font-semibold">
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
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/35 shadow-sm'
                : 'bg-[#1b1b1f] text-[#71717a] border-[#2e2e36] hover:text-[#a1a1aa]'
            }`}
            title={`Toggle AI recommended links on graph (Currently ${showAILinks ? 'ON' : 'OFF'})`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${showAILinks ? 'bg-amber-400 animate-pulse' : 'bg-[#52525b]'}`} />
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
              <span className="text-xs font-semibold text-[#e4e4e7] flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-purple-400" />
                Incoming references ({acceptedLinks.length})
              </span>
            </div>

            {acceptedLinks.length === 0 ? (
              <div className="p-5 bg-[#111113] border border-[#26262c] rounded-xl text-center text-xs text-[#71717a] space-y-1">
                <p className="italic">No incoming backlinks to this note.</p>
                <p className="text-[11px] text-[#52525b]">
                  Other notes linking to [[{file.title}]] will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {acceptedLinks.map((link) => (
                  <div
                    key={link.id}
                    onClick={() => onSelectFile(link.source_file_id)}
                    className="p-2.5 rounded-lg bg-[#1a1a1e] hover:bg-[#202026] border border-[#26262c] hover:border-[#383842] cursor-pointer transition-all space-y-1.5 group shadow-sm"
                  >
                    <div className="flex items-center justify-between text-xs font-medium text-[#f4f4f5]">
                      <span className="group-hover:text-purple-300 transition-colors flex items-center gap-1.5 truncate">
                        {link.source_file_title}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-purple-400 shrink-0" />
                      </span>
                      {link.relationship && (
                        <span className="px-2 py-0.5 text-[11px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/25 rounded shrink-0 ml-1">
                          {link.relationship}
                        </span>
                      )}
                    </div>

                    {link.context && (
                      <p className="text-[11px] text-[#a1a1aa] line-clamp-2 leading-relaxed pl-1.5 border-l border-[#2e2e36]">
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
            <div className="p-3 rounded-xl bg-[#131316] border border-[#26262c] space-y-2">
              <span className="text-xs font-semibold text-[#e4e4e7] block">
                Note properties
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-[#1a1a1e] border border-[#242428]">
                  <span className="text-[#94a3b8] block text-[11px]">Words</span>
                  <span className="font-semibold text-[#f4f4f5]">{wordCount}</span>
                </div>
                <div className="p-2 rounded bg-[#1a1a1e] border border-[#242428]">
                  <span className="text-[#94a3b8] block text-[11px]">Characters</span>
                  <span className="font-semibold text-[#f4f4f5]">{charCount}</span>
                </div>
                <div className="col-span-2 p-2 rounded bg-[#1a1a1e] border border-[#242428] truncate">
                  <span className="text-[#94a3b8] block text-[11px]">File Path</span>
                  <span className="font-mono text-[#d4d4d8] text-[11px] truncate block">
                    {file.path || `${file.title}.md`}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Candidates & Validation Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  AI link candidates ({pendingLinks.length})
                </span>
                {pendingLinks.length > 0 && onOpenAIReview && (
                  <button
                    onClick={onOpenAIReview}
                    className="text-xs text-amber-300 hover:text-amber-200 underline font-medium cursor-pointer"
                  >
                    Review modal
                  </button>
                )}
              </div>

              {pendingLinks.length === 0 ? (
                <div className="p-4 bg-[#131316] border border-[#26262c] rounded-xl text-center text-xs text-[#71717a] space-y-1">
                  <p className="italic">No pending AI candidates.</p>
                  <p className="text-[11px] text-[#71717a]">
                    Click "Discover AI Links" below to propose contextual relationships.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Candidate Validation Authority Banner */}
                  <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/25 space-y-2">
                    <div className="text-xs text-amber-200/90 leading-relaxed">
                      Candidates appear as dotted lines on the graph. Confirm to consolidate into note, or discard all to remove.
                    </div>
                    <div className="flex items-center gap-2 pt-0.5">
                      {onAcceptAllLinks && (
                        <button
                          onClick={onAcceptAllLinks}
                          className="flex-1 py-1 px-2 rounded bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-colors text-center cursor-pointer shadow-sm"
                        >
                          Confirm All
                        </button>
                      )}
                      {onRejectAllLinks && (
                        <button
                          onClick={() => onRejectAllLinks(file.id)}
                          className="flex-1 py-1 px-2 rounded bg-rose-600/20 hover:bg-rose-600/35 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors text-center cursor-pointer shadow-sm"
                        >
                          Discard All
                        </button>
                      )}
                    </div>
                  </div>

                  {pendingLinks.map((link) => (
                    <div
                      key={link.id}
                      className="p-2.5 rounded-lg bg-[#1a1713] border border-amber-500/30 space-y-2 transition-all shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0 pr-1">
                          <span className="text-xs font-semibold text-amber-200 block truncate">
                            [[{link.target_title}]]
                          </span>
                          {link.relationship && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-[11px] font-mono font-medium bg-amber-500/15 text-amber-300 rounded border border-amber-500/25">
                              {link.relationship}
                            </span>
                          )}
                        </div>

                        {/* Accept / Reject Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => onAcceptLink(link.id)}
                            className="px-2 py-1 rounded bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/35 transition-colors shadow-sm text-xs font-medium flex items-center gap-1 cursor-pointer"
                            title="Confirm: Consolidate into permanent note link"
                          >
                            <Check className="w-3 h-3" />
                            <span>Confirm</span>
                          </button>
                          <button
                            onClick={() => onRejectLink(link.id)}
                            className="px-2 py-1 rounded bg-rose-600/25 hover:bg-rose-600/40 text-rose-300 border border-rose-500/35 transition-colors shadow-sm text-xs font-medium flex items-center gap-1 cursor-pointer"
                            title="Discard: Remove proposal from graph and vault"
                          >
                            <X className="w-3 h-3" />
                            <span>Discard</span>
                          </button>
                        </div>
                      </div>

                      {link.context && (
                        <p className="text-[11px] text-[#d4d4d8] leading-relaxed italic border-l-2 border-amber-500/40 pl-2">
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

      {/* Footer Process Button - Flat solid, deliberate color */}
      <div className="p-2.5 border-t border-[#26262c] bg-[#121214] shrink-0">
        <button
          onClick={() => onProcessAI(file.id)}
          disabled={isAIProcessing}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#4f46e5] hover:bg-[#4338ca] border border-indigo-400/40 text-white rounded-lg text-xs font-semibold shadow-sm active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
        >
          {isAIProcessing && (
            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
          )}
          <span>{isAIProcessing ? 'Discovering connections...' : 'Discover AI links'}</span>
        </button>
      </div>
    </div>
  );
}
