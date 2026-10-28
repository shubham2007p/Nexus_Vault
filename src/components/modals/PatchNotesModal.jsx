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
  FolderTree,
  Zap,
  BookOpen,
  Sun,
  ShieldCheck,
  FileCode,
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
        className="relative w-full max-w-2xl bg-[#17171a] border border-[#2e2e36] rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#26262c] flex items-center justify-between bg-[#131316] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="patch-notes-title" className="text-sm font-semibold text-[#f4f4f5]">
                  NexusVault Patch Notes & Power Guide
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                  v2.1.0 Universal
                </span>
              </div>
              <p className="text-xs text-[#8e8e98] mt-0.5">
                Complete guide to raw vs process folders, Universal AI models, semantic graphs, and workflows
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717a] hover:text-[#f4f4f5] hover:bg-[#222227] transition-colors cursor-pointer"
            aria-label="Close patch notes"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-[#d4d4d8]">
          {/* Universal AI Hub Feature Callout */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#181a20] to-[#17171a] border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
                <Bot className="w-4 h-4 text-emerald-400" />
                <span>New: Universal AI Hub & Robot Model Selector</span>
              </div>
              <span className="text-[10px] font-mono bg-[#111113] px-2 py-0.5 rounded border border-[#2e2e36] text-emerald-400">
                Top Bar Next to Save
              </span>
            </div>
            <p className="text-[#a1a1aa] leading-relaxed">
              Click the <strong className="text-[#f4f4f5]">AI / Robot button</strong> right next to the Save button in the editor to configure and switch AI models on the fly. Nexus Vault now supports <strong className="text-emerald-300">Groq Cloud (LPU)</strong>, <strong className="text-amber-300">Anthropic Claude</strong>, <strong className="text-emerald-400">OpenAI (ChatGPT)</strong>, <strong className="text-blue-400">Google Gemini</strong>, <strong className="text-purple-400">OpenRouter</strong>, <strong className="text-orange-400">Mistral AI</strong>, and <strong className="text-zinc-400">Local Ollama / LM Studio</strong>. Features real-time API key auto-detection and a live <em>Test Key & Model</em> latency benchmark.
            </p>
          </div>

          {/* Section: Raw vs. Process Dual Folder Architecture */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#f4f4f5]">
              <FolderTree className="w-4 h-4 text-emerald-400" />
              <span>Dual Folder Architecture: raw/ and process/</span>
            </div>
            <div className="pl-6 space-y-2 text-[#a1a1aa] leading-relaxed">
              <p>
                The vault is strictly bifurcated into two dedicated folders, both in the UI sidebar and physically on disk:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong className="text-[#f4f4f5]">📁 raw/ (Raw Notes):</strong> Your informal scratchpad for quick, unstructured lecture scribbles, personal mental models, and unedited thoughts.
                </li>
                <li>
                  <strong className="text-[#f4f4f5]">📁 process/ (Processed Notes):</strong> AI-synthesized, textbook-grade companion notes with rigorous LaTeX formulas, mathematical derivations, theorems, and core definitions.
                </li>
                <li>
                  <strong className="text-[#f4f4f5]">Two-Way Disk Sync:</strong> All notes are automatically mirrored into the physical <code className="text-zinc-300 bg-[#222227] px-1 py-0.5 rounded">raw/</code> and <code className="text-zinc-300 bg-[#222227] px-1 py-0.5 rounded">process/</code> folders on your drive.
                </li>
              </ul>
            </div>
          </div>

          {/* Section: Academic Note Synthesis Engine */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#f4f4f5]">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Academic Note Synthesizer (Raw → Formal Companion)</span>
            </div>
            <div className="pl-6 space-y-1.5 text-[#a1a1aa] leading-relaxed">
              <p>
                Click <strong className="text-amber-300">Synthesize Note</strong> on any raw note. The AI agent:
              </p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Preserves your raw intuition, metaphors, and intuitive bridges.</li>
                <li>Derives rigorous mathematical formulas and proofs formatted in clean LaTeX ($...$ and $$...$$).</li>
                <li>Extracts core definitions, theorems, and practical computational caveats.</li>
                <li>Generates a companion formal note in <code className="text-amber-300 bg-[#222227] px-1 py-0.5 rounded">process/</code> linked directly to the original raw note without modifying the raw note content.</li>
                <li>Archives previous versions in a synthesis history table with full conflict safeguards.</li>
              </ol>
            </div>
          </div>

          {/* Section: AI Semantic Link Discovery */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#f4f4f5]">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>AI Semantic Link Agent & Human-in-the-Loop Review</span>
            </div>
            <p className="text-[#a1a1aa] leading-relaxed pl-6">
              Click <strong className="text-[#f4f4f5]">Discover Links</strong> in the editor toolbar or <strong className="text-[#f4f4f5]">Discover AI Links</strong> in the right inspector. The agent scans your note alongside all available vault titles to propose typed contextual links (e.g. <code className="text-emerald-300 bg-[#222227] px-1 py-0.5 rounded">[[Target | relies_on | Context]]</code>). Review suggestions in the interactive review modal to accept or discard each link with one click.
            </p>
          </div>

          {/* Section: Knowledge Graph Viewers */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#f4f4f5]">
              <Network className="w-4 h-4 text-purple-400" />
              <span>Interactive Knowledge Graph (Global & Local Views)</span>
            </div>
            <div className="pl-6 space-y-1.5 text-[#a1a1aa] leading-relaxed">
              <p>
                <strong className="text-[#f4f4f5]">Global vs Local Neighborhood:</strong> Switch seamlessly between the entire vault cluster map (degree-weighted node sizes) and the focused 1-hop / 2-hop local neighborhood of your active note.
              </p>
              <p>
                <strong className="text-[#f4f4f5]">Fullscreen Expansion:</strong> Click the expand button or press <kbd className="px-1.5 py-0.5 bg-[#222227] rounded text-[#d4d4d8] font-mono">G</kbd> to enter full-screen graph visualization with zoom, pan, and real-time node navigation.
              </p>
            </div>
          </div>

          {/* Section: Real-Time Sidebar Search */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#f4f4f5]">
              <Search className="w-4 h-4 text-purple-400" />
              <span>Real-Time Folder Search</span>
            </div>
            <p className="text-[#a1a1aa] leading-relaxed pl-6">
              The sidebar search bar is always visible at the top of the file tree. It filters notes across both <code className="text-zinc-300 bg-[#222227] px-1 py-0.5 rounded">raw/</code> and <code className="text-zinc-300 bg-[#222227] px-1 py-0.5 rounded">process/</code> folders simultaneously, showing matching counts for each folder in real time.
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
                <span className="text-[#a1a1aa]">Fullscreen Graph</span>
                <kbd className="px-1.5 py-0.5 bg-[#222227] border border-[#2e2e36] text-[#f4f4f5] rounded font-mono">G / Expand</kbd>
              </div>
              <div className="p-2.5 rounded-lg bg-[#1a1a1e] border border-[#26262c] flex items-center justify-between">
                <span className="text-[#a1a1aa]">Dismiss Dialog / Exit Fullscreen</span>
                <kbd className="px-1.5 py-0.5 bg-[#222227] border border-[#2e2e36] text-[#f4f4f5] rounded font-mono">Escape</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-3 border-t border-[#26262c] flex items-center justify-between bg-[#131316] shrink-0 text-xs text-[#71717a]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Nexus Vault v2.1.0 • Universal AI Engine Active
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#287D54] hover:bg-[#206644] text-white rounded-lg font-medium transition-all shadow-sm cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
