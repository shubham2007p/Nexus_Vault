import React from 'react';
import { ArrowLeftRight, Check, X, Sparkles, Link2, ExternalLink } from 'lucide-react';

export default function Backlinks({
  file,
  backlinks = [],
  onAcceptLink,
  onRejectLink,
  onSelectFile,
  onProcessAI,
  isAIProcessing,
}) {
  if (!file) {
    return (
      <div className="w-80 bg-[#181818] border-l border-[#282828] flex flex-col h-full p-6 justify-center items-center text-[#777777] text-xs select-none text-center">
        <ArrowLeftRight className="w-8 h-8 mb-2 text-[#444444]" />
        <p className="font-medium text-[#888888]">No Note Selected</p>
        <p className="text-[11px] text-[#555555] mt-1">Select a note to inspect backlinks & AI connections</p>
      </div>
    );
  }

  const safeBacklinks = Array.isArray(backlinks) ? backlinks : [];
  const acceptedLinks = safeBacklinks.filter((b) => b.status === 'accepted');
  const pendingLinks = safeBacklinks.filter((b) => b.status === 'pending');

  return (
    <div className="w-80 bg-[#181818] border-l border-[#282828] flex flex-col h-full select-none overflow-hidden">
      {/* Header */}
      <div className="px-3.5 py-3 border-b border-[#282828] flex items-center justify-between shrink-0 bg-[#141414]">
        <div className="flex items-center gap-2 font-semibold text-[#dcddde] text-xs tracking-wide">
          <ArrowLeftRight className="w-4 h-4 text-[#e2e8f0]" />
          <span>Backlinks & AI Inspector</span>
        </div>
        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#242424] text-[#888888] border border-[#333333]">
          {acceptedLinks.length + pendingLinks.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 space-y-5">
        {/* Pending AI Proposals Section */}
        {pendingLinks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                AI Suggested Links ({pendingLinks.length})
              </span>
            </div>

            <div className="space-y-2.5">
              {pendingLinks.map((link) => (
                <div
                  key={link.id}
                  className="p-3 rounded-md bg-[#221f18] border border-amber-500/40 space-y-2 relative transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="pr-2 min-w-0">
                      <span className="text-xs font-semibold text-amber-200 block truncate">
                        [[{link.target_title}]]
                      </span>
                      {link.relationship && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-mono font-medium bg-amber-500/15 text-amber-300 rounded border border-amber-500/30">
                          {link.relationship}
                        </span>
                      )}
                    </div>

                    {/* Accept / Reject Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onAcceptLink(link.id)}
                        className="p-1.5 rounded bg-emerald-600/30 hover:bg-emerald-600/60 text-emerald-300 border border-emerald-500/40 transition-colors shadow-sm"
                        title="Accept link & append to note"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onRejectLink(link.id)}
                        className="p-1.5 rounded bg-rose-600/30 hover:bg-rose-600/60 text-rose-300 border border-rose-500/40 transition-colors shadow-sm"
                        title="Reject link proposal"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {link.context && (
                    <p className="text-[11px] text-[#cccccc] leading-relaxed italic border-l-2 border-amber-500/40 pl-2">
                      "{link.context}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accepted Backlinks Section */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#999999] flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-[#e2e8f0]" />
              Incoming Links ({acceptedLinks.length})
            </span>
          </div>

          {acceptedLinks.length === 0 ? (
            <div className="p-4 bg-[#141414] border border-[#282828] rounded-md text-center text-xs text-[#777777] italic">
              No incoming backlinks to this note
            </div>
          ) : (
            <div className="space-y-2">
              {acceptedLinks.map((link) => (
                <div
                  key={link.id}
                  onClick={() => onSelectFile(link.source_file_id)}
                  className="p-2.5 rounded-md bg-[#222222] hover:bg-[#282828] border border-[#2e2e2e] hover:border-[#404040] cursor-pointer transition-all space-y-1.5 group shadow-sm"
                >
                  <div className="flex items-center justify-between text-xs font-medium text-[#dcddde]">
                    <span className="group-hover:text-[#ffffff] transition-colors flex items-center gap-1.5 truncate">
                      {link.source_file_title}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#e2e8f0]" />
                    </span>
                    {link.relationship && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono bg-[#c4b5fd]/15 text-[#ddd6fe] border border-[#c4b5fd]/30 rounded shrink-0 ml-1">
                        {link.relationship}
                      </span>
                    )}
                  </div>

                  {link.context && (
                    <p className="text-[11px] text-[#aaaaaa] line-clamp-2 leading-relaxed">
                      {link.context}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Process Button */}
      <div className="p-3 border-t border-[#282828] bg-[#141414] shrink-0">
        <button
          onClick={() => onProcessAI(file.id)}
          disabled={isAIProcessing}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#242424] hover:bg-[#303030] border border-[#333333] text-[#dcddde] hover:text-[#ffffff] rounded-md text-xs font-semibold transition-all disabled:opacity-50 shadow-sm"
        >
          <Sparkles
            className={`w-3.5 h-3.5 text-amber-400 ${
              isAIProcessing ? 'animate-spin' : ''
            }`}
          />
          <span>{isAIProcessing ? 'Analyzing Connections...' : 'Discover AI Links'}</span>
        </button>
      </div>
    </div>
  );
}
