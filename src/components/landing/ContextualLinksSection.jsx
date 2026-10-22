import React, { useState } from 'react';
import { ArrowRight, Code, HelpCircle, Check, Info, Sparkles } from 'lucide-react';

export default function ContextualLinksSection() {
  const [selectedExample, setSelectedExample] = useState(0);

  const examples = [
    {
      domain: 'Deep Learning',
      standard: '[[Gradient Descent]]',
      target: 'Gradient Descent',
      relationship: 'optimizes',
      context: 'Minimizes empirical risk loss function across high-dimensional parameter surfaces',
      noteSnippet: 'In neural network training, we calculate loss derivatives with respect to weights, which '
    },
    {
      domain: 'Software Architecture',
      standard: '[[Redis Cache]]',
      target: 'Redis Cache',
      relationship: 'mitigates_bottleneck',
      context: 'Absorbs read spike bursts to prevent relational Postgres pool exhaustion',
      noteSnippet: 'To scale our user feed without exceeding p99 database latency budgets, our service '
    },
    {
      domain: 'Systems Biology',
      standard: '[[ATP Synthase]]',
      target: 'ATP Synthase',
      relationship: 'harnesses_energy_from',
      context: 'Proton electrochemical gradient across the inner mitochondrial membrane drives rotary catalysis',
      noteSnippet: 'During oxidative phosphorylation, the electron transport chain establishes a proton motive force that '
    }
  ];

  const current = examples[selectedExample];

  return (
    <section id="contextual-links" className="py-24 md:py-32 px-6 bg-[#FAF8F5]">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D6D0C5] bg-[#F4EFEA] text-[#2D5A43] text-xs font-mono uppercase tracking-wider mb-4">
            <span>The 3-Tuple Semantic Link</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#1C1917] leading-[1.15] mb-5">
            A connection is more useful <br className="hidden sm:inline" />
            <span className="italic font-normal text-[#2D5A43]">when you know why it exists.</span>
          </h2>
          <p className="text-[#66605A] text-base sm:text-lg leading-relaxed">
            Standard wikilinks record that two notes touch, but tell you nothing about the connection. 
            Nexusvault upgrades ordinary links into 3-tuple relationships that preserve the reason for the link.
          </p>
        </div>

        {/* Domain Switcher */}
        <div className="flex justify-center gap-2 mb-10 overflow-x-auto pb-2">
          {examples.map((ex, idx) => (
            <button
              key={ex.domain}
              onClick={() => setSelectedExample(idx)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                selectedExample === idx
                  ? 'bg-[#1C1917] text-white shadow-xs'
                  : 'bg-white text-[#66605A] border border-[#E7E2DA] hover:bg-[#F4EFEA]'
              }`}
            >
              {ex.domain}
            </button>
          ))}
        </div>

        {/* Side-by-Side Comparison: 1-Tuple vs 3-Tuple */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Left: Standard Wikilink */}
          <div className="rounded-xl border border-[#E7E2DA] bg-white p-7 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-[#8C827A]">
                  Traditional 1-Tuple Link
                </span>
                <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E7E2DA] text-[10px] text-[#78716C] font-mono">
                  Untyped Binary Edge
                </span>
              </div>

              <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA] font-mono text-sm text-[#1C1917] mb-5">
                {current.standard}
              </div>

              <h4 className="font-serif font-bold text-lg text-[#1C1917] mb-2">
                What it conveys:
              </h4>
              <p className="text-sm text-[#66605A] leading-relaxed mb-4">
                An edge connects these two notes. When you review your vault 6 months later, you must re-read both entire documents to reconstruct why you linked them.
              </p>

              <div className="space-y-2 text-xs text-[#8C827A] pt-4 border-t border-[#E7E2DA]">
                <div className="flex items-center gap-2 text-rose-700/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>No relationship type recorded</span>
                </div>
                <div className="flex items-center gap-2 text-rose-700/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>No context or reason preserved</span>
                </div>
                <div className="flex items-center gap-2 text-rose-700/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>Graph renders as an unweighted line</span>
                </div>
              </div>
            </div>

            <div className="mt-8 text-xs font-mono text-[#8C827A] p-2.5 rounded bg-[#FAF8F5] border border-[#E7E2DA]">
              Obsidian / Roam default syntax
            </div>
          </div>

          {/* Right: Nexusvault Contextual Link */}
          <div className="rounded-xl border-2 border-[#2D5A43] bg-white p-7 shadow-md flex flex-col justify-between relative overflow-hidden">
            {/* Top Accent Strip */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#2D5A43]" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-[#2D5A43] font-bold">
                  Nexusvault 3-Tuple Link
                </span>
                <span className="px-2 py-0.5 rounded bg-[#EBF2EE] border border-[#B7D0C2] text-[10px] text-[#1C3A2B] font-mono font-semibold">
                  Semantic Typed Edge
                </span>
              </div>

              <div className="p-4 rounded-lg bg-[#111113] border border-[#26262c] font-mono text-sm mb-5 text-[#f4f4f5] overflow-x-auto">
                <span className="text-stone-400">[[</span>
                <span className="text-white font-semibold">{current.target}</span>
                <span className="text-purple-400"> | </span>
                <span className="text-emerald-400 font-semibold">{current.relationship}</span>
                <span className="text-purple-400"> | </span>
                <span className="text-amber-300 italic">{current.context}</span>
                <span className="text-stone-400">]]</span>
              </div>

              <h4 className="font-serif font-bold text-lg text-[#1C1917] mb-2">
                What it conveys:
              </h4>
              <p className="text-sm text-[#66605A] leading-relaxed mb-4">
                The connection explicitly communicates the target note, the precise ontological dependency, and the qualifying rationale directly inside your prose.
              </p>

              <div className="space-y-2 text-xs text-[#1C3A2B] pt-4 border-t border-[#E7E2DA]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#2D5A43] shrink-0" />
                  <span>Target Note resolves to destination file</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#2D5A43] shrink-0" />
                  <span>Relationship label rendered in Graph and Backlinks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#2D5A43] shrink-0" />
                  <span>Context explanation surfaces immediately without opening target note</span>
                </div>
              </div>
            </div>

            <div className="mt-8 text-xs font-mono text-[#2D5A43] p-2.5 rounded bg-[#EBF2EE] border border-[#B7D0C2] flex items-center justify-between">
              <span>Standard Markdown compatible</span>
              <span className="font-sans font-bold">100% Plain Text</span>
            </div>
          </div>
        </div>

        {/* Anatomy of a Contextual Link Breakdown */}
        <div className="rounded-xl border border-[#E7E2DA] bg-[#F4EFEA] p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#66605A] mb-4">
            <Info className="w-4 h-4 text-[#2D5A43]" />
            <span>Grammar & Parsing Breakdown</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-white border border-[#E7E2DA]">
              <div className="text-[10px] font-mono uppercase text-[#8C827A] mb-1">Segment 1</div>
              <div className="font-serif font-bold text-base text-[#1C1917] mb-1">Target Note Title</div>
              <p className="text-xs text-[#66605A] leading-relaxed">
                The exact name of the destination note. If the file doesn't exist yet, Nexusvault creates a phantom node that resolves automatically once created.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white border border-[#E7E2DA]">
              <div className="text-[10px] font-mono uppercase text-[#2D5A43] mb-1">Segment 2</div>
              <div className="font-serif font-bold text-base text-[#1C1917] mb-1">Relationship Type</div>
              <p className="text-xs text-[#66605A] leading-relaxed">
                Short ontological action: <code className="font-mono text-emerald-800 bg-[#EBF2EE] px-1 rounded">prerequisite_for</code>, <code className="font-mono text-emerald-800 bg-[#EBF2EE] px-1 rounded">relies_on</code>, <code className="font-mono text-emerald-800 bg-[#EBF2EE] px-1 rounded">optimizes</code>, <code className="font-mono text-emerald-800 bg-[#EBF2EE] px-1 rounded">implements</code>.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white border border-[#E7E2DA]">
              <div className="text-[10px] font-mono uppercase text-amber-700 mb-1">Segment 3</div>
              <div className="font-serif font-bold text-base text-[#1C1917] mb-1">Context Rationale</div>
              <p className="text-xs text-[#66605A] leading-relaxed">
                A concise qualitative sentence explaining why the two thoughts intersect. Prevents cognitive drift when revisiting your vault months later.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
