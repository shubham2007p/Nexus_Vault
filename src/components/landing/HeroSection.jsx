import React, { useState } from 'react';
import { ArrowRight, ChevronDown, Sparkles, FileText, Share2, Compass, Layers, CheckCircle2 } from 'lucide-react';

export default function HeroSection({ onLaunchApp }) {
  const [activeTab, setActiveTab] = useState('interactive');

  const scrollToProblem = () => {
    const el = document.getElementById('problem');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 px-6 overflow-hidden">
      {/* Editorial Watermark / Subtle Background Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035] [background-image:radial-gradient(#1C1917_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Editorial Sub-kicker */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#B7D0C2] bg-[#EBF2EE] text-[#1C3A2B] text-xs font-medium tracking-wide mb-8 animate-in fade-in duration-500">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A43]" />
          <span>Markdown-First Knowledge Engineering</span>
        </div>

        {/* Primary Headline */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#1C1917] leading-[1.08] mb-6 max-w-4xl mx-auto">
          Capture freely. <br className="hidden sm:inline" />
          <span className="italic font-normal text-[#2D5A43]">Discover the connections.</span>
        </h1>

        {/* Supporting Statement */}
        <p className="text-lg sm:text-xl text-[#66605A] max-w-2xl mx-auto leading-relaxed font-sans mb-10 font-normal">
          Your notes hold what you learn. Nexusvault helps you uncover how those ideas relate—with contextual links, a visual knowledge graph, and AI suggestions you control.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={onLaunchApp}
            className="w-full sm:w-auto px-7 py-3.5 text-sm font-semibold text-white bg-[#2D5A43] hover:bg-[#1C3A2B] rounded-lg transition-all shadow-md shadow-[#2D5A43]/20 hover:shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Try Nexusvault free</span>
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

        {/* Core Principles Pill List */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#66605A] font-medium border-t border-[#E7E2DA] pt-8 mb-14">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2D5A43]" />
            <span>Zero Friction at Capture Time</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2D5A43]" />
            <span>Typed 3-Tuple Semantic Links</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2D5A43]" />
            <span>Human-in-the-Loop AI Curation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2D5A43]" />
            <span>Physical Markdown Files on Disk</span>
          </div>
        </div>

        {/* Product Visual Container (Editorial Frame) */}
        <div className="relative mx-auto rounded-xl border border-[#D6D0C5] bg-[#111113] p-1 sm:p-2.5 shadow-2xl shadow-stone-900/15 overflow-hidden text-left">
          {/* Mock Window Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#26262c] bg-[#151518] text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-3 font-mono text-[#8e8e98] text-[11px] hidden sm:inline">
                nexus-vault / notes / Backpropagation.md
              </span>
            </div>

            <div className="flex items-center gap-1 bg-[#1c1c20] p-0.5 rounded border border-[#26262c]">
              <button
                onClick={() => setActiveTab('interactive')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                  activeTab === 'interactive'
                    ? 'bg-[#27272e] text-[#f4f4f5]'
                    : 'text-[#8e8e98] hover:text-[#d4d4d8]'
                }`}
              >
                Interactive Note
              </button>
              <button
                onClick={() => setActiveTab('screenshot')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                  activeTab === 'screenshot'
                    ? 'bg-[#27272e] text-[#f4f4f5]'
                    : 'text-[#8e8e98] hover:text-[#d4d4d8]'
                }`}
              >
                Actual Workspace Capture
              </button>
            </div>
          </div>

          {/* View Content */}
          {activeTab === 'interactive' ? (
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px] bg-[#131316]">
              {/* Left Vault Sidebar (3 cols) */}
              <div className="hidden md:block md:col-span-3 border-r border-[#26262c] bg-[#151518] p-3 text-xs text-[#8e8e98]">
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#5a5a64] mb-3 px-1">
                  Vault Files (12)
                </div>
                <div className="space-y-1">
                  <div className="px-2 py-1.5 rounded bg-[#27272e] text-[#f4f4f5] font-medium flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-violet-400" />
                    <span>Backpropagation.md</span>
                  </div>
                  <div className="px-2 py-1.5 rounded hover:bg-[#1c1c20] text-[#a1a1aa] flex items-center gap-2 cursor-pointer transition-colors">
                    <FileText className="w-3.5 h-3.5 text-[#5a5a64]" />
                    <span>Chain Rule.md</span>
                  </div>
                  <div className="px-2 py-1.5 rounded hover:bg-[#1c1c20] text-[#a1a1aa] flex items-center gap-2 cursor-pointer transition-colors">
                    <FileText className="w-3.5 h-3.5 text-[#5a5a64]" />
                    <span>Gradient Descent.md</span>
                  </div>
                  <div className="px-2 py-1.5 rounded hover:bg-[#1c1c20] text-[#a1a1aa] flex items-center gap-2 cursor-pointer transition-colors">
                    <FileText className="w-3.5 h-3.5 text-[#5a5a64]" />
                    <span>Neural Networks.md</span>
                  </div>
                  <div className="px-2 py-1.5 rounded hover:bg-[#1c1c20] text-[#a1a1aa] flex items-center gap-2 cursor-pointer transition-colors">
                    <FileText className="w-3.5 h-3.5 text-[#5a5a64]" />
                    <span>Quantized Inference.md</span>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-[#26262c]/60">
                  <div className="text-[11px] text-[#5a5a64] px-1 mb-2 font-mono">AI AGENT STATE</div>
                  <div className="p-2 rounded bg-[#1c1c20] border border-[#26262c] text-[11px] text-emerald-400 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Ready for proposal extraction</span>
                  </div>
                </div>
              </div>

              {/* Center Editor Surface (6 cols) */}
              <div className="md:col-span-6 p-6 sm:p-8 font-sans text-sm text-[#e4e4e7] overflow-y-auto max-h-[500px]">
                <div className="text-2xl font-bold tracking-tight text-[#f4f4f5] mb-4">
                  # Backpropagation in Deep Networks
                </div>
                <p className="leading-relaxed text-[#d4d4d8] mb-4">
                  Backpropagation computes the gradient of the loss function with respect to each weight by repeated application of the multivariable{' '}
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-violet-500/15 border border-violet-500/35 text-violet-300 font-medium text-xs font-mono">
                    [[Chain Rule | relies_on | Computes layer gradients backwards through activation graph]]
                  </span>
                  .
                </p>
                <p className="leading-relaxed text-[#d4d4d8] mb-6">
                  Once gradients are derived, weights are iteratively updated using an optimization algorithm such as{' '}
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
                    <li>- [[Loss Functions | calculates_error | Mean squared error or categorical cross-entropy]]</li>
                    <li>- [[Matrix Calculus | provides_basis_for | Jacobian-vector products in backward pass]]</li>
                  </ul>
                </div>
              </div>

              {/* Right Graph & Inspector Pane (3 cols) */}
              <div className="hidden md:flex md:col-span-3 flex-col border-l border-[#26262c] bg-[#151518]">
                {/* Mini Graph Preview */}
                <div className="h-44 p-3 border-b border-[#26262c] relative flex flex-col justify-between">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#5a5a64] flex items-center justify-between">
                    <span>1-Hop Graph</span>
                    <span className="text-[#a78bfa] text-[9px]">4 nodes</span>
                  </div>
                  
                  {/* Clean SVG mini topology */}
                  <svg className="w-full h-28 my-auto" viewBox="0 0 160 100">
                    {/* Edges */}
                    <line x1="80" y1="50" x2="25" y2="25" stroke="#8b5cf6" strokeWidth="1.5" strokeOpacity="0.6" />
                    <line x1="80" y1="50" x2="135" y2="30" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.6" />
                    <line x1="80" y1="50" x2="80" y2="85" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.6" />
                    
                    {/* Edge labels */}
                    <text x="45" y="32" fill="#a78bfa" fontSize="6" fontFamily="monospace">relies_on</text>
                    <text x="105" y="35" fill="#34d399" fontSize="6" fontFamily="monospace">optimizes</text>

                    {/* Nodes */}
                    {/* Chain Rule */}
                    <circle cx="25" cy="25" r="7" fill="#2e2e38" stroke="#8b5cf6" strokeWidth="1.5" />
                    <text x="25" y="14" fill="#d4d4d8" fontSize="7" textAnchor="middle" fontFamily="sans-serif">Chain Rule</text>
                    
                    {/* Gradient Descent */}
                    <circle cx="135" cy="30" r="7" fill="#2e2e38" stroke="#10b981" strokeWidth="1.5" />
                    <text x="135" y="19" fill="#d4d4d8" fontSize="7" textAnchor="middle" fontFamily="sans-serif">Gradient Descent</text>

                    {/* Unresolved phantom node */}
                    <circle cx="80" cy="85" r="6" fill="#18181b" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />
                    <text x="80" y="96" fill="#fbbf24" fontSize="6" textAnchor="middle" fontFamily="monospace">Loss Functions</text>

                    {/* Center Note */}
                    <circle cx="80" cy="50" r="10" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2" />
                    <text x="80" y="53" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">Target</text>
                  </svg>
                </div>

                {/* Backlinks Panel */}
                <div className="flex-1 p-3 overflow-y-auto text-xs">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#5a5a64] mb-2">
                    Incoming Backlinks (1)
                  </div>
                  <div className="p-2 rounded bg-[#1c1c20] border border-[#26262c] text-[11px]">
                    <div className="font-semibold text-violet-300">Neural Networks.md</div>
                    <div className="text-[10px] text-emerald-400 font-mono mt-0.5">implements</div>
                    <div className="text-[10px] text-[#8e8e98] italic mt-0.5">
                      "Trained via reverse mode autodiff"
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative bg-[#131316] flex items-center justify-center p-2">
              <img
                src="/knowledge_graph_ui.jpg"
                alt="Nexusvault Real Application Interface"
                className="w-full h-auto rounded border border-[#26262c] object-cover max-h-[500px]"
                loading="eager"
              />
            </div>
          )}

          {/* Subtitle Under Visual */}
          <div className="px-4 py-2.5 bg-[#151518] border-t border-[#26262c] flex flex-wrap items-center justify-between text-xs text-[#8e8e98]">
            <span>Authentic Nexusvault interface running on local Markdown repository</span>
            <span className="font-mono text-[#a78bfa] text-[11px]">Single Source of Truth: .md on disk</span>
          </div>
        </div>
      </div>
    </section>
  );
}
