import React, { useEffect } from 'react';
import {
  Sparkles,
  X,
  Command,
  Search,
  Network,
  Edit3,
  Bot,
  Keyboard,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export default function PatchNotesModal({ isOpen, onClose }) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="patch-notes-title"
    >
      <div
        className="relative w-full max-w-2xl bg-[#17171a] border border-[#2e2e36] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#26262c] flex items-center justify-between bg-[#131316] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="patch-notes-title" className="text-sm font-semibold text-[#f4f4f5]">
                  NexusVault Patch Notes & Power Guide
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25 font-semibold">
                  v1.2.0
                </span>
              </div>
              <p className="text-xs text-[#8e8e98] mt-0.5">
                Pro tips and hidden workflow techniques to navigate the application flawlessly
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717a] hover:text-[#f4f4f5] hover:bg-[#222227] transition-colors"
            aria-label="Close patch notes"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-[#d4d4d8]">
          {/* Quick Switcher Highlight */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/30 to-[#1e1c24] border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs">
                <Command className="w-4 h-4 text-purple-400" />
                <span>The Invisible Power Tool: Quick Switcher</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[10px] bg-[#111113] px-2 py-0.5 rounded border border-[#2e2e36] text-[#a1a1aa]">
                <kbd className="text-[#f4f4f5] font-semibold">⌘K</kbd> / <kbd className="text-[#f4f4f5] font-semibold">Ctrl+K</kbd>
              </div>
            </div>
            <p className="text-[#a1a1aa] leading-relaxed">
              The Quick Switcher is embedded directly into the workspace. Press <strong className="text-[#f4f4f5]">Ctrl+K</strong> or <strong className="text-[#f4f4f5]">⌘K</strong> from anywhere in the application to summon the modal, filter across all vault files instantly, navigate using <kbd className="px-1 py-0.2 bg-[#222227] rounded text-[#d4d4d8]">↑</kbd> <kbd className="px-1 py-0.2 bg-[#222227] rounded text-[#d4d4d8]">↓</kbd>, and press <kbd className="px-1 py-0.2 bg-[#222227] rounded text-[#d4d4d8]">Enter</kbd> to jump straight into any note without touching your mouse.
            </p>
          </div>

          {/* Section: Collapsible Search Icon */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#f4f4f5]">
              <Search className="w-4 h-4 text-purple-400" />
              <span>Collapsible On-Demand Search</span>
            </div>
            <p className="text-[#a1a1aa] leading-relaxed pl-6">
              Instead of occupying fixed vertical space, the sidebar search is now an on-demand icon. Click the search emblem right where it is to open the search bar with instant focus. Type to filter your notes in real-time, and click the close icon or hit <kbd className="px-1 bg-[#222227] rounded">Esc</kbd> to collapse it back.
            </p>
          </div>

          {/* Section: Connected Knowledge Graph */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#f4f4f5]">
              <Network className="w-4 h-4 text-purple-400" />
              <span>Full-Screen & Corner Knowledge Graph Viewers</span>
            </div>
            <div className="pl-6 space-y-1.5 text-[#a1a1aa] leading-relaxed">
              <p>
                <strong className="text-[#f4f4f5]">Full-Screen Mode:</strong> Click the maximize button in the graph header to expand the graph over your entire screen. View only your interconnected ideas with expanded zoom and pan, search queries, and click any node to immediately navigate or open it in the editor. Press <kbd className="px-1 bg-[#222227] rounded text-[#d4d4d8]">Esc</kbd> or click <em>Minimize</em> to return to the corner panel.
              </p>
              <p>
                <strong className="text-[#f4f4f5]">Global vs Local Perspectives:</strong> Switch between the full vault cluster map (degree-weighted node sizes) and the focused radial local neighborhood (1-hop vs 2-hop depth toggle with zero label collisions).
              </p>
            </div>
          </div>

          {/* Section: Editorial Markdown Writing */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#f4f4f5]">
              <Edit3 className="w-4 h-4 text-purple-400" />
              <span>Editorial Writing & Wikilinks</span>
            </div>
            <div className="pl-6 space-y-1.5 text-[#a1a1aa] leading-relaxed">
              <p>
                Writing area is centered to a comfortable 740px reading width with proportional typography, high-contrast headings, and live word/link counts.
              </p>
              <p>
                Use standard internal wikilinks like <code className="text-purple-300 bg-[#222227] px-1.5 py-0.5 rounded text-[11px]">[[Note Title]]</code> or contextual relationships like <code className="text-purple-300 bg-[#222227] px-1.5 py-0.5 rounded text-[11px]">[[Target Note|implements|context]]</code>.
              </p>
            </div>
          </div>

          {/* Section: AI Link Discovery */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#f4f4f5]">
              <Bot className="w-4 h-4 text-amber-400" />
              <span>AI Semantic Link Agent</span>
            </div>
            <p className="text-[#a1a1aa] leading-relaxed pl-6">
              Click <strong className="text-[#f4f4f5]">Process Note</strong> in the editor or <strong className="text-[#f4f4f5]">Discover AI Links</strong> in the inspector. The agent scans your note and proposes semantic links with relationship tags. Review proposals and approve them with one click to auto-append to your note.
            </p>
          </div>

          {/* Section: Quick Keyboard Shortcuts Table */}
          <div className="space-y-2.5 pt-2 border-t border-[#26262c]">
            <div className="flex items-center gap-2 font-semibold text-[#f4f4f5]">
              <Keyboard className="w-4 h-4 text-purple-400" />
              <span>Essential Keyboard Shortcuts</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-[#1a1a1e] border border-[#26262c] flex items-center justify-between">
                <span className="text-[#a1a1aa]">Quick Switcher</span>
                <kbd className="px-1.5 py-0.5 bg-[#222227] border border-[#2e2e36] text-[#f4f4f5] rounded font-mono">⌘K / Ctrl+K</kbd>
              </div>
              <div className="p-2.5 rounded-lg bg-[#1a1a1e] border border-[#26262c] flex items-center justify-between">
                <span className="text-[#a1a1aa]">Save Active Note</span>
                <kbd className="px-1.5 py-0.5 bg-[#222227] border border-[#2e2e36] text-[#f4f4f5] rounded font-mono">Ctrl+S / ⌘S</kbd>
              </div>
              <div className="p-2.5 rounded-lg bg-[#1a1a1e] border border-[#26262c] flex items-center justify-between">
                <span className="text-[#a1a1aa]">Dismiss / Close Dialog</span>
                <kbd className="px-1.5 py-0.5 bg-[#222227] border border-[#2e2e36] text-[#f4f4f5] rounded font-mono">Escape</kbd>
              </div>
              <div className="p-2.5 rounded-lg bg-[#1a1a1e] border border-[#26262c] flex items-center justify-between">
                <span className="text-[#a1a1aa]">Confirm / Jump to Note</span>
                <kbd className="px-1.5 py-0.5 bg-[#222227] border border-[#2e2e36] text-[#f4f4f5] rounded font-mono">Enter ↵</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-3 border-t border-[#26262c] flex items-center justify-between bg-[#131316] shrink-0 text-xs text-[#71717a]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Workspace updated and running smoothly
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#222228] hover:bg-purple-600/30 text-[#f4f4f5] hover:text-purple-200 border border-[#2e2e36] hover:border-purple-500/40 rounded-lg font-medium transition-all shadow-sm"
          >
            Got it, let's work
          </button>
        </div>
      </div>
    </div>
  );
}
