import React, { useState } from 'react';
import { Check, Info } from 'lucide-react';

export default function ContextualLinksSection() {
  const [selectedExample, setSelectedExample] = useState(0);

  const examples = [
    {
      domain: 'Deep Learning',
      standard: '[[Gradient Descent]]',
      target: 'Gradient Descent',
      relationship: 'optimizes',
      context: 'Minimizes empirical risk loss function across high-dimensional parameter surfaces',
      noteSnippet: 'Once layer gradients are computed via backpropagation, we apply ',
    },
    {
      domain: 'Software Architecture',
      standard: '[[Redis Cache]]',
      target: 'Redis Cache',
      relationship: 'mitigates_bottleneck',
      context: 'Absorbs read spike bursts to prevent relational Postgres connection pool exhaustion',
      noteSnippet: 'To scale our timeline service within p99 latency budgets, the API gateway relies on ',
    },
    {
      domain: 'Systems Biology',
      standard: '[[ATP Synthase]]',
      target: 'ATP Synthase',
      relationship: 'harnesses_energy_from',
      context: 'Proton electrochemical gradient across the inner mitochondrial membrane drives rotary catalysis',
      noteSnippet: 'During oxidative phosphorylation, the electron transport chain builds a proton force that ',
    },
  ];

  const current = examples[selectedExample];

  return (
    <section id="contextual-links" className="py-24 md:py-32 px-6 bg-[#FAF8F5]">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D6D0C5] bg-[#F4EFEA] text-[#2D5A43] text-xs font-mono uppercase tracking-wider mb-4">
            <span>Meaningful Connections (Target + Relationship + Why)</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#1C1917] leading-[1.15] mb-5">
            A link is far more useful <br className="hidden sm:inline" />
            <span className="italic font-normal text-[#2D5A43]">when you remember why you made it.</span>
          </h2>
          <p className="text-[#66605A] text-base sm:text-lg leading-relaxed">
            Standard wikilinks only record that two notes touch—forcing you to re-read both files months later to remember how they relate. Nexus Vault upgrades links into self-documenting relationships right inside plain Markdown.
          </p>
        </div>

        {/* Domain Switcher */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
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
              {ex.domain} Example
            </button>
          ))}
        </div>

        {/* Side-by-Side Comparison: Bare Wikilink vs Nexus Vault Contextual Link */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-14">
          {/* Left: Standard Wikilink */}
          <div className="rounded-xl border border-[#E7E2DA] bg-white p-7 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-[#8C827A] font-semibold">
                  Standard Wikilink
                </span>
                <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E7E2DA] text-[10px] text-[#78716C] font-mono">
                  Destination Only
                </span>
              </div>

              <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA] font-mono text-sm text-[#1C1917] mb-5">
                {current.standard}
              </div>

              <h4 className="font-serif font-bold text-lg text-[#1C1917] mb-2">
                What happens 6 months later:
              </h4>
              <p className="text-sm text-[#66605A] leading-relaxed mb-4">
                You see a line between two notes on your graph, but have no clue whether Note A depends on Note B, contradicts it, or implements it without opening and re-reading both files.
              </p>

              <div className="space-y-2 text-xs text-[#8C827A] pt-4 border-t border-[#E7E2DA]">
                <div className="flex items-center gap-2 text-rose-700/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>No relationship action recorded</span>
                </div>
                <div className="flex items-center gap-2 text-rose-700/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>No explanation of why the notes connect</span>
                </div>
                <div className="flex items-center gap-2 text-rose-700/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>Backlinks panel shows zero context</span>
                </div>
              </div>
            </div>

            <div className="mt-8 text-xs font-mono text-[#8C827A] p-2.5 rounded bg-[#FAF8F5] border border-[#E7E2DA]">
              Supported in Nexus Vault for quick links: <code className="text-[#1C1917]">[[Target Note]]</code>
            </div>
          </div>

          {/* Right: Nexus Vault Contextual Link */}
          <div className="rounded-xl border-2 border-[#2D5A43] bg-white p-7 shadow-md flex flex-col justify-between relative overflow-hidden">
            {/* Top Accent Strip */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#2D5A43]" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-[#2D5A43] font-bold">
                  Nexus Vault Contextual Link
                </span>
                <span className="px-2 py-0.5 rounded bg-[#EBF2EE] border border-[#B7D0C2] text-[10px] text-[#1C3A2B] font-mono font-semibold">
                  Target + Relationship + Why
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
                What happens 6 months later:
              </h4>
              <p className="text-sm text-[#66605A] leading-relaxed mb-4">
                At a glance—inside your note, in the Backlinks panel, and on the Graph—you immediately see <strong>which note</strong> is linked, <strong>how it relates</strong>, and <strong>the exact reason</strong>.
              </p>

              <div className="space-y-2 text-xs text-[#1C3A2B] pt-4 border-t border-[#E7E2DA]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#2D5A43] shrink-0" />
                  <span>Can be proposed automatically by AI or typed by hand</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#2D5A43] shrink-0" />
                  <span>Relationship verb labels every edge on your Knowledge Graph</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#2D5A43] shrink-0" />
                  <span>Context sentence appears in the target note's Backlinks inspector</span>
                </div>
              </div>
            </div>

            <div className="mt-8 text-xs font-mono text-[#2D5A43] p-2.5 rounded bg-[#EBF2EE] border border-[#B7D0C2] flex items-center justify-between">
              <span>Portable 3-Tuple Markdown Syntax</span>
              <span className="font-sans font-bold">100% Plain Text</span>
            </div>
          </div>
        </div>

        {/* Anatomy of a Contextual Link Breakdown */}
        <div className="rounded-xl border border-[#E7E2DA] bg-[#F4EFEA] p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#66605A] mb-4">
            <Info className="w-4 h-4 text-[#2D5A43]" />
            <span>How a 3-Part Contextual Link Works</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-white border border-[#E7E2DA]">
              <div className="text-[10px] font-mono uppercase text-[#8C827A] mb-1">Part 1 · Where</div>
              <div className="font-serif font-bold text-base text-[#1C1917] mb-1">Destination Note</div>
              <p className="text-xs text-[#66605A] leading-relaxed">
                The title of the connected note (e.g., <code className="font-mono text-[#1C1917] bg-[#FAF8F5] px-1 rounded">{current.target}</code>). If that note hasn't been written yet, Nexus Vault displays a phantom node on the graph until you create it.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white border border-[#E7E2DA]">
              <div className="text-[10px] font-mono uppercase text-[#2D5A43] mb-1">Part 2 · How</div>
              <div className="font-serif font-bold text-base text-[#1C1917] mb-1">Relationship Action</div>
              <p className="text-xs text-[#66605A] leading-relaxed">
                A concise action verb describing the link: <code className="font-mono text-emerald-800 bg-[#EBF2EE] px-1 rounded">prerequisite_for</code>, <code className="font-mono text-emerald-800 bg-[#EBF2EE] px-1 rounded">relies_on</code>, <code className="font-mono text-emerald-800 bg-[#EBF2EE] px-1 rounded">optimizes</code>, <code className="font-mono text-emerald-800 bg-[#EBF2EE] px-1 rounded">implements</code>, or <code className="font-mono text-emerald-800 bg-[#EBF2EE] px-1 rounded">complements</code>.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white border border-[#E7E2DA]">
              <div className="text-[10px] font-mono uppercase text-amber-700 mb-1">Part 3 · Why</div>
              <div className="font-serif font-bold text-base text-[#1C1917] mb-1">Context Explanation</div>
              <p className="text-xs text-[#66605A] leading-relaxed">
                A short one-line note to your future self explaining <em>why</em> these two concepts intersect—eliminating guesswork when reviewing for exams or design reviews.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
