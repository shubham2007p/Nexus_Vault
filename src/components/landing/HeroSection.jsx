import React, { useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Sparkles,
  FileText,
  BookMarked,
  FolderOpen,
  Bot,
  Link2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export default function HeroSection({ onLaunchApp }) {
  const [activeView, setActiveView] = useState('raw'); // 'raw' | 'formal'

  const scrollToProblem = () => {
    const el = document.getElementById('problem');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToSynthesis = () => {
    const el = document.getElementById('synthesis');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative pt-14 pb-24 md:pt-20 md:pb-32 px-6 overflow-hidden">
      {/* Subtle Background Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035] [background-image:radial-gradient(#1C1917_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Editorial Kicker */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#B7D0C2] bg-[#EBF2EE] text-[#1C3A2B] text-xs font-medium tracking-wide mb-7">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A43]" />
          <span>Local-First Markdown Vault · Universal AI Engine</span>
        </div>

        {/* Primary Headline */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#1C1917] leading-[1.08] mb-6 max-w-4xl mx-auto">
          Write messy notes freely. <br className="hidden sm:inline" />
          <span className="italic font-normal text-[#2D5A43]">
            Turn them into connected, formal knowledge.
          </span>
        </h1>

        {/* Supporting Subheadline */}
        <p className="text-base sm:text-xl text-[#66605A] max-w-2xl mx-auto leading-relaxed font-sans mb-9 font-normal">
          Capture fast, unstructured thoughts in <code className="font-mono text-sm bg-[#F4EFEA] px-1.5 py-0.5 rounded border border-[#E7E2DA] text-[#1C1917]">raw/</code>. With one click, synthesize textbook-grade companion notes in <code className="font-mono text-sm bg-[#F4EFEA] px-1.5 py-0.5 rounded border border-[#E7E2DA] text-[#1C1917]">process/</code> and uncover typed semantic links across a live knowledge graph—stored as plain <code className="font-mono text-sm">.md</code> files on your drive.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
          <button
            onClick={onLaunchApp}
            className="w-full sm:w-auto px-7 py-3.5 text-sm font-semibold text-white bg-[#2D5A43] hover:bg-[#1C3A2B] rounded-lg transition-all shadow-md shadow-[#2D5A43]/20 hover:shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Launch Live Workspace</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={scrollToProblem}
            className="w-full sm:w-auto px-6 py-3.5 text-sm font-medium text-[#1C1917] hover:text-[#2D5A43] bg-white hover:bg-[#F4EFEA] border border-[#E7E2DA] rounded-lg transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>See how it works</span>
            <ChevronDown className="w-4 h-4 text-[#66605A]" />
          </button>
        </div>

        {/* Low-Friction Reassurance Micro-Copy */}
        <p className="text-xs font-mono text-[#66605A] mb-12">
          Instant browser access · Pre-loaded starter CS &amp; AI vault · No account or signup required
        </p>

        {/* Core Principles Pill List */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-[#66605A] font-medium border-t border-[#E7E2DA] pt-7 mb-12">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2D5A43]" />
            <span>Dual Folders (<code className="font-mono">raw/</code> &amp; <code className="font-mono">process/</code>)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2D5A43]" />
            <span>3-Tuple Contextual Links</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2D5A43]" />
            <span>7 AI Providers + Local Ollama</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2D5A43]" />
            <span>Two-Way Physical <code className="font-mono">.md</code> Disk Sync</span>
          </div>
        </div>

        {/* Interactive Product Workspace Frame */}
        <div className="relative mx-auto rounded-xl border border-[#D6D0C5] bg-[#111113] p-1 sm:p-2 shadow-2xl shadow-stone-900/15 overflow-hidden text-left">
          {/* Mock Window Header & Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[#26262c] bg-[#151518] text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 font-mono text-[#a1a1aa] text-[11px] hidden sm:inline">
                {activeView === 'raw'
                  ? 'nexus-vault / raw / Backpropagation.md'
                  : 'nexus-vault / process / Backpropagation (Formal).md'}
              </span>
            </div>

            <div className="flex items-center gap-1 bg-[#1c1c20] p-0.5 rounded-md border border-[#26262c]">
              <button
                onClick={() => setActiveView('raw')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'raw'
                    ? 'bg-[#287D54] text-white shadow-xs'
                    : 'text-[#a1a1aa] hover:text-white'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>1. Raw Note (raw/)</span>
              </button>
              <button
                onClick={() => setActiveView('formal')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'formal'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-[#a1a1aa] hover:text-white'
                }`}
              >
                <BookMarked className="w-3 h-3" />
                <span>2. Formal Companion (process/)</span>
              </button>
            </div>
          </div>

          {/* Simulated v2.1.0 Editor Toolbar */}
          <div className="px-4 py-2 bg-[#18191E] border-b border-[#26262c] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                {activeView === 'raw'
                  ? 'Backpropagation'
                  : 'Backpropagation: Formal Foundations & Gradient Calculus'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                Saved to disk
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Robot AI Provider Pill */}
              <div
                className="px-2 py-1 rounded bg-[#1E1E24] border border-emerald-500/30 text-[11px] text-stone-200 flex items-center gap-1.5"
                title="Universal AI Model Hub"
              >
                <Bot className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline font-mono text-[10px]">Groq LPU</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>

              {/* Synthesize Toggle Button */}
              <button
                onClick={() => setActiveView(activeView === 'raw' ? 'formal' : 'raw')}
                className="px-2.5 py-1 rounded bg-[#1E1E24] hover:bg-[#27272E] border border-amber-500/40 text-[11px] text-amber-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <BookMarked className="w-3 h-3 text-amber-400" />
                <span>{activeView === 'raw' ? 'View Synthesized Companion' : 'Back to Raw Note'}</span>
              </button>

              {/* Discover Links Pill */}
              <div className="px-2.5 py-1 rounded bg-[#1E1E24] border border-[#272A32] text-[11px] text-stone-300 hidden md:flex items-center gap-1">
                <Link2 className="w-3 h-3 text-emerald-400" />
                <span>Discover Links</span>
              </div>
            </div>
          </div>

          {/* 3-Pane Workspace Body */}
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[450px] bg-[#131316]">
            {/* Left Vault Sidebar (3 cols) — Mirrors v2.1.0 raw/ and process/ folders */}
            <div className="hidden md:flex md:col-span-3 flex-col justify-between border-r border-[#26262c] bg-[#151518] p-3 text-xs text-[#a1a1aa]">
              <div className="space-y-4">
                {/* Folder 1: raw/ */}
                <div>
                  <div className="flex items-center justify-between px-1.5 py-1 text-[11px] font-semibold text-stone-200">
                    <span className="flex items-center gap-1.5 font-mono">
                      <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                      <span>raw/</span>
                      <span className="text-[10px] font-normal text-stone-400">(Raw Notes)</span>
                    </span>
                    <span className="text-[10px] font-mono px-1.5 rounded-full bg-[#272A32] text-stone-300">
                      21
                    </span>
                  </div>

                  <div className="space-y-0.5 pl-2 border-l border-[#272A32] ml-2 mt-1">
                    <button
                      onClick={() => setActiveView('raw')}
                      className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between transition-colors cursor-pointer ${
                        activeView === 'raw'
                          ? 'bg-[#22242B] text-white font-medium border-l-2 border-l-emerald-400'
                          : 'text-stone-400 hover:bg-[#1c1c20] hover:text-stone-200'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">Backpropagation</span>
                      </span>
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
                        title="Has Formal Companion Note"
                      />
                    </button>

                    <div className="px-2 py-1.5 rounded text-stone-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 truncate">
                        <FileText className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                        <span className="truncate">Chain Rule</span>
                      </span>
                    </div>

                    <div className="px-2 py-1.5 rounded text-stone-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 truncate">
                        <FileText className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                        <span className="truncate">Gradient Descent</span>
                      </span>
                    </div>

                    <div className="px-2 py-1.5 rounded text-stone-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 truncate">
                        <FileText className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                        <span className="truncate">Transformer Attention</span>
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Folder 2: process/ */}
                <div>
                  <div className="flex items-center justify-between px-1.5 py-1 text-[11px] font-semibold text-stone-200">
                    <span className="flex items-center gap-1.5 font-mono">
                      <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                      <span>process/</span>
                      <span className="text-[10px] font-normal text-stone-400">(Processed)</span>
                    </span>
                    <span className="text-[10px] font-mono px-1.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">
                      5
                    </span>
                  </div>

                  <div className="space-y-0.5 pl-2 border-l border-amber-500/30 ml-2 mt-1">
                    <button
                      onClick={() => setActiveView('formal')}
                      className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between gap-1 transition-colors cursor-pointer ${
                        activeView === 'formal'
                          ? 'bg-[#22242B] text-white font-medium border-l-2 border-l-amber-400'
                          : 'text-stone-400 hover:bg-[#1c1c20] hover:text-stone-200'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <BookMarked className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">Backpropagation (Formal)</span>
                      </span>
                      <span className="text-[9px] font-mono px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                        Formal
                      </span>
                    </button>

                    <div className="px-2 py-1.5 rounded text-stone-400 flex items-center justify-between gap-1">
                      <span className="flex items-center gap-1.5 truncate">
                        <BookMarked className="w-3.5 h-3.5 text-amber-400/70 shrink-0" />
                        <span className="truncate">Scaled Dot-Product Attention</span>
                      </span>
                      <span className="text-[9px] font-mono px-1 rounded bg-amber-500/15 text-amber-300/80 shrink-0">
                        Formal
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#26262c] flex items-center justify-between text-[11px] font-mono text-stone-400">
                <span>26 notes</span>
                <span className="px-1.5 py-0.5 rounded bg-[#272A32] text-stone-300">⌘K</span>
              </div>
            </div>

            {/* Center Editor Surface (6 cols) */}
            <div className="md:col-span-6 p-6 sm:p-8 font-sans text-sm text-[#e4e4e7] overflow-y-auto max-h-[500px]">
              {/* Companion Relationship Banner */}
              <div className="mb-5 px-3 py-2 rounded-lg bg-[#18191E] border border-[#272A32] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#272A32] text-stone-300">
                    {activeView === 'raw' ? 'Raw Notes (raw/)' : 'Formal Companion (process/)'}
                  </span>
                  <span className="text-stone-400 truncate">
                    {activeView === 'raw' ? 'Companion textbook note:' : 'Derived from raw note:'}
                  </span>
                </div>
                <button
                  onClick={() => setActiveView(activeView === 'raw' ? 'formal' : 'raw')}
                  className="text-emerald-400 hover:underline font-medium flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>{activeView === 'raw' ? 'Open Formal Note' : 'Open Raw Note'}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {activeView === 'raw' ? (
                <>
                  <div className="text-2xl font-bold tracking-tight text-[#f4f4f5] mb-4">
                    # Backpropagation in Deep Networks
                  </div>
                  <p className="leading-relaxed text-[#d4d4d8] mb-4">
                    Backpropagation computes the gradient of the loss function with respect to each layer weight by repeated application of the multivariable{' '}
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/35 text-amber-300 font-medium text-xs font-mono">
                      [[Chain Rule | relies_on | Computes layer gradients backwards through activation graph]]
                    </span>
                    .
                  </p>
                  <p className="leading-relaxed text-[#d4d4d8] mb-6">
                    Once gradients are derived in the backward pass, weights are iteratively updated using{' '}
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 font-medium text-xs font-mono">
                      [[Gradient Descent | optimizes | Minimizes empirical loss along continuous parameter surface]]
                    </span>
                    .
                  </p>

                  <div className="border-t border-[#26262c] pt-4 mt-6">
                    <div className="text-xs font-mono uppercase tracking-wider text-[#8e8e98] mb-2">
                      ## Related Connections
                    </div>
                    <ul className="space-y-1.5 text-xs text-[#a1a1aa] font-mono">
                      <li>- [[Loss Functions | calculates_error | Mean squared error or cross-entropy objective]]</li>
                      <li>- [[Matrix Calculus | provides_basis_for | Jacobian-vector products in backward pass]]</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="text-xl font-serif font-bold tracking-tight text-amber-200">
                    # Backpropagation: Formal Foundations &amp; Gradient Calculus
                  </div>

                  <div className="p-3.5 rounded-lg bg-amber-950/25 border border-amber-500/30 text-xs">
                    <div className="font-mono text-[10px] uppercase text-amber-300 font-semibold mb-1">
                      ## 1. Intuition Bridge (Preserved from Raw Note)
                    </div>
                    <p className="text-stone-200 leading-relaxed">
                      Instead of recomputing derivatives from scratch for every weight, backpropagation caches forward activations and passes a local error sensitivity signal δ<sup>(l)</sup> backward layer by layer.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#18191E] border border-[#272A32] text-xs space-y-2">
                    <div className="font-mono text-[10px] uppercase text-emerald-400 font-semibold">
                      ## 2. Formal Layerwise Recurrence
                    </div>
                    <div className="p-2.5 rounded bg-[#111113] border border-[#272A32] font-mono text-amber-200">
                      δ<sup>(l)</sup> = ((W<sup>(l+1)</sup>)<sup>T</sup> · δ<sup>(l+1)</sup>) ⊙ σ′(z<sup>(l)</sup>)
                      &nbsp;&nbsp;⇒&nbsp;&nbsp;
                      ∇<sub>W</sub> L = δ<sup>(l)</sup> · (a<sup>(l−1)</sup>)<sup>T</sup>
                    </div>
                    <p className="text-stone-300 text-[11px] leading-relaxed">
                      Grounded in <span className="font-mono text-emerald-300">[[Chain Rule | relies_on | Local Jacobian composition]]</span> and used by <span className="font-mono text-emerald-300">[[Gradient Descent | optimizes | Parameter update step]]</span>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Graph & Inspector Pane (3 cols) */}
            <div className="hidden md:flex md:col-span-3 flex-col border-l border-[#26262c] bg-[#151518]">
              {/* Mini Graph Preview */}
              <div className="h-52 p-3 border-b border-[#26262c] relative flex flex-col justify-between">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#a1a1aa] flex items-center justify-between">
                  <span>1-Hop Graph</span>
                  <span className="text-emerald-400 text-[10px]">5 nodes</span>
                </div>

                {/* Clean SVG mini topology */}
                <svg className="w-full h-36 my-auto" viewBox="0 0 160 110">
                  {/* Edges */}
                  <line x1="80" y1="58" x2="80" y2="18" stroke="#f59e0b" strokeWidth="1.75" strokeOpacity="0.8" />
                  <line x1="80" y1="58" x2="25" y2="38" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.65" />
                  <line x1="80" y1="58" x2="135" y2="38" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.65" />
                  <line x1="80" y1="58" x2="80" y2="95" stroke="#a8a29e" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.6" />

                  {/* Edge labels */}
                  <text x="108" y="34" fill="#fbbf24" fontSize="5.5" fontFamily="monospace">companion</text>
                  <text x="42" y="44" fill="#34d399" fontSize="5.5" fontFamily="monospace">relies_on</text>
                  <text x="115" y="55" fill="#34d399" fontSize="5.5" fontFamily="monospace">optimizes</text>

                  {/* Formal Companion Node */}
                  <circle cx="80" cy="18" r="7" fill="#2e2418" stroke="#f59e0b" strokeWidth="1.75" />
                  <text x="80" y="8" fill="#fde68a" fontSize="6.5" textAnchor="middle" fontFamily="sans-serif">Formal Note</text>

                  {/* Chain Rule */}
                  <circle cx="25" cy="38" r="6.5" fill="#1b2a22" stroke="#10b981" strokeWidth="1.5" />
                  <text x="25" y="28" fill="#d4d4d8" fontSize="6.5" textAnchor="middle" fontFamily="sans-serif">Chain Rule</text>

                  {/* Gradient Descent */}
                  <circle cx="135" cy="38" r="6.5" fill="#1b2a22" stroke="#10b981" strokeWidth="1.5" />
                  <text x="135" y="28" fill="#d4d4d8" fontSize="6.5" textAnchor="middle" fontFamily="sans-serif">Grad Descent</text>

                  {/* Unresolved phantom node */}
                  <circle cx="80" cy="95" r="5.5" fill="#18181b" stroke="#a8a29e" strokeWidth="1.5" strokeDasharray="2 2" />
                  <text x="80" y="106" fill="#d6d3d1" fontSize="6" textAnchor="middle" fontFamily="monospace">Loss Functions</text>

                  {/* Center Note */}
                  <circle cx="80" cy="58" r="9.5" fill={activeView === 'raw' ? '#287D54' : '#d97706'} stroke="#ffffff" strokeWidth="2" />
                  <text x="80" y="60.5" fill="#ffffff" fontSize="6.5" fontWeight="bold" textAnchor="middle">Active</text>
                </svg>
              </div>

              {/* Backlinks Panel */}
              <div className="flex-1 p-3 overflow-y-auto text-xs">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#a1a1aa] mb-2">
                  Incoming Backlinks (2)
                </div>
                <div className="space-y-2">
                  <div className="p-2 rounded bg-[#1c1c20] border border-[#26262c] text-[11px]">
                    <div className="font-semibold text-emerald-300">Neural Networks.md</div>
                    <div className="text-[10px] text-amber-300 font-mono mt-0.5">implements</div>
                    <div className="text-[10px] text-[#a1a1aa] italic mt-0.5">
                      "Trained via reverse-mode autodiff"
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subtitle Under Visual */}
          <div className="px-4 py-2.5 bg-[#151518] border-t border-[#26262c] flex flex-wrap items-center justify-between gap-2 text-xs text-[#a1a1aa]">
            <span>
              Interactive preview of Nexus Vault v2.1 · Click{' '}
              <button
                onClick={scrollToSynthesis}
                className="text-emerald-400 hover:underline font-medium cursor-pointer"
              >
                Raw → Formal Synthesis
              </button>{' '}
              below to explore further
            </span>
            <span className="font-mono text-emerald-400 text-[11px]">
              Two-way synced: ./raw/*.md &amp; ./process/*.md
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
