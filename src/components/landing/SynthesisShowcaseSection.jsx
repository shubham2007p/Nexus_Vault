import React, { useState } from 'react';
import {
  BookMarked,
  FileText,
  Sparkles,
  FolderOpen,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  History,
  HardDrive,
} from 'lucide-react';

const SYNTHESIS_EXAMPLES = [
  {
    id: 'attention',
    topic: 'Transformer Attention',
    rawFile: 'raw/Attention Intuition.md',
    formalFile: 'process/Scaled Dot-Product Attention (Formal).md',
    rawWrittenAt: 'During Lecture · 42 words',
    rawLines: [
      '# Attention mechanism quick notes',
      '',
      'Think of attention like a fuzzy database lookup:',
      '- Query (Q) = what I am looking for',
      '- Key (K) = label on each folder in the database',
      '- Value (V) = actual contents inside the folder',
      '',
      'We take dot product of Q and K to check similarity, divide by sqrt(d_k) so big numbers do not kill softmax gradients, then multiply by V.',
    ],
    intuitionBridge:
      'Preserving your fuzzy database analogy: each token emits a Query vector that probes Key vectors across the sequence via inner-product similarity. Instead of returning a single hard match, Softmax converts these similarity scores into continuous retrieval weights over the Value vectors.',
    definitionTerm: 'Scaled Dot-Product Attention',
    definitionBody:
      'Given packed query matrix Q ∈ ℝ^(n×d_k), key matrix K ∈ ℝ^(m×d_k), and value matrix V ∈ ℝ^(m×d_v), the attention operator computes a convex combination of values weighted by normalized query-key compatibility:',
    formula: 'Attention(Q, K, V) = softmax( (Q · Kᵀ) / √d_k ) · V',
    derivationTitle: 'Variance Stabilization via √d_k Scaling',
    derivationBody:
      'Assuming independent components q_i, k_i ~ N(0, 1), their dot product q · k has mean 0 and variance d_k. Dividing by √d_k restores unit variance Var(q·k / √d_k) = 1, preventing logits from saturating the flat regions of Softmax where gradients vanish.',
    links: [
      '[[Softmax | normalizes | Projects unscaled similarity logits onto the probability simplex]]',
      '[[Matrix Calculus | provides_basis_for | Batched Jacobian contractions across sequence length]]',
    ],
  },
  {
    id: 'backprop',
    topic: 'Backpropagation Calculus',
    rawFile: 'raw/Backprop Scratchpad.md',
    formalFile: 'process/Backpropagation: Formal Derivations.md',
    rawWrittenAt: 'Lab Session · 38 words',
    rawLines: [
      '# How backprop sends error backwards',
      '',
      'Forward pass: plug inputs in, multiply by weights W, apply activation layer by layer until we get loss L at the end.',
      '',
      'Backward pass: we want dL/dW for early layers. Instead of recalculating everything from scratch, reuse the upstream error delta from the next layer using chain rule!',
    ],
    intuitionBridge:
      'Building on your upstream error reuse insight: backpropagation is dynamic programming applied to the multivariable chain rule. By caching intermediate forward activations a^(l) and passing backward a local error signal δ^(l), each layer computes its weight gradient in O(1) upstream lookups.',
    definitionTerm: 'Layerwise Error Sensitivity (δ^(l))',
    definitionBody:
      'For layer l with pre-activation z^(l) = W^(l)·a^(l−1) + b^(l) and activation a^(l) = σ(z^(l)), the backpropagated sensitivity vector δ^(l) ≡ ∂L / ∂z^(l) satisfies the recurrence:',
    formula: 'δ^(l) = ( (W^(l+1))ᵀ · δ^(l+1) ) ⊙ σ′(z^(l))   ⇒   ∇_W^(l) L = δ^(l) · (a^(l−1))ᵀ',
    derivationTitle: 'Computational Efficiency vs. Naive Differentiation',
    derivationBody:
      'Evaluating ∂L/∂W_ij via forward finite differences requires O(|W|²) operations. Reverse-mode accumulation propagates sensitivities from scalar loss L in a single backward sweep, matching forward-pass complexity O(|W|).',
    links: [
      '[[Chain Rule | relies_on | Decomposes composite layer derivatives into local Jacobian products]]',
      '[[Gradient Descent | optimizes | Updates weight tensors using accumulated ∂L/∂W gradients]]',
    ],
  },
  {
    id: 'trees',
    topic: 'Tree Data Structures',
    rawFile: 'raw/Tree Notes Lecture 4.md',
    formalFile: 'process/Tree Data Structure: Formal Definitions.md',
    rawWrittenAt: 'Class Notes · 35 words',
    rawLines: [
      '# Trees in DSA',
      '',
      'A tree is basically a connected graph with no cycles.',
      '- Top node is the Root (no parent)',
      '- Nodes at the bottom with no kids = Leaf nodes',
      '- Binary tree means each node has at most 2 children (left & right).',
      '- N nodes always means N - 1 edges.',
    ],
    intuitionBridge:
      'Directly formalizing your cycle-free hierarchy intuition: a tree is a minimally connected acyclic graph. Removing any single edge disconnects the structure into two components, while adding any edge creates a unique simple cycle.',
    definitionTerm: 'Rooted Acyclic Graph & Arity Invariant',
    definitionBody:
      'A rooted tree is a directed tuple T = (V, E, r) where r ∈ V is the designated root with in-degree 0, every node v ∈ V \\ {r} has in-degree 1 (a unique parent), and |E| = |V| − 1. In a k-ary (or binary, k=2) tree, out-degree(v) ≤ k for all v ∈ V.',
    formula: '|E| = |V| − 1   and   h_min = ⌈log₂(|V| + 1)⌉ − 1  (for Binary Trees)',
    derivationTitle: 'Structural Induction on Edge Count',
    derivationBody:
      'Base case: |V| = 1 has |E| = 0. Inductive step: every non-root node v ∈ V \\ {r} contributes a unique incoming edge e_v = (parent(v), v). By bijection between V \\ {r} and E, |E| = |V| − 1.',
    links: [
      '[[Data Structures and Algorithms | generalizes | Hierarchical non-linear container for logarithmic search]]',
      '[[Graph Theory | specializes | Connected acyclic undirected graph with unique path between vertices]]',
    ],
  },
];

export default function SynthesisShowcaseSection() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const current = SYNTHESIS_EXAMPLES[selectedIdx];

  return (
    <section id="synthesis" className="py-24 md:py-32 px-6 bg-[#FAF8F5] border-b border-[#E7E2DA]">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D6D0C5] bg-[#F4EFEA] text-[#2D5A43] text-xs font-mono uppercase tracking-wider mb-4">
            <BookMarked className="w-3.5 h-3.5" />
            <span>Dual-Folder Companion Architecture (raw/ → process/)</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#1C1917] leading-[1.15] mb-5">
            Keep your messy intuition. <br className="hidden sm:inline" />
            <span className="italic font-normal text-[#2D5A43]">Synthesize a textbook-grade companion.</span>
          </h2>
          <p className="text-[#66605A] text-base sm:text-lg leading-relaxed">
            Most AI note tools overwrite your personal voice with generic summaries. Nexus Vault separates your workspace into two mirrored folders: your original scribbles stay 100% untouched in{' '}
            <code className="font-mono text-xs bg-[#F4EFEA] px-1.5 py-0.5 rounded border border-[#E7E2DA] text-[#2D5A43] font-semibold">
              raw/
            </code>
            , while clicking <strong>Synthesize</strong> generates a linked, formal companion note in{' '}
            <code className="font-mono text-xs bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 text-amber-800 font-semibold">
              process/
            </code>
            .
          </p>
        </div>

        {/* Example Topic Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          <span className="text-xs font-mono text-[#8C827A] mr-2">Inspect Transformation:</span>
          {SYNTHESIS_EXAMPLES.map((ex, idx) => (
            <button
              key={ex.id}
              onClick={() => setSelectedIdx(idx)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                selectedIdx === idx
                  ? 'bg-[#1C1917] text-white shadow-xs'
                  : 'bg-white text-[#66605A] border border-[#E7E2DA] hover:bg-[#F4EFEA]'
              }`}
            >
              {idx + 1}. {ex.topic}
            </button>
          ))}
        </div>

        {/* Side-by-Side Raw -> Process Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: raw/ Folder Note (5 cols) */}
          <div className="lg:col-span-5 rounded-xl border border-[#D6D0C5] bg-white shadow-sm flex flex-col justify-between overflow-hidden">
            <div>
              {/* Folder Header Bar */}
              <div className="px-4 py-3 bg-[#F4EFEA] border-b border-[#E7E2DA] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <FolderOpen className="w-4 h-4 text-[#287D54] shrink-0" />
                  <span className="font-mono font-semibold text-[#1C1917] truncate">
                    {current.rawFile}
                  </span>
                  <span
                    className="w-2 h-2 rounded-full bg-[#E7A23B] shrink-0"
                    title="Golden Dot: Has Linked Formal Companion in process/"
                  />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#E7E2DA] text-[#287D54] font-semibold shrink-0">
                  Untouched Original
                </span>
              </div>

              {/* Raw Note Content */}
              <div className="p-6">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#8C827A] mb-3">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#287D54]" />
                    <span>Student / Engineer Scratchpad</span>
                  </span>
                  <span>{current.rawWrittenAt}</span>
                </div>

                <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA] font-mono text-xs text-[#242824] space-y-1.5 leading-relaxed">
                  {current.rawLines.map((line, i) => (
                    <div
                      key={i}
                      className={
                        line.startsWith('#')
                          ? 'font-sans font-bold text-sm text-[#1C1917] pb-1'
                          : line.startsWith('-')
                          ? 'pl-2 text-[#44403C]'
                          : 'text-[#44403C]'
                      }
                    >
                      {line || '\u00A0'}
                    </div>
                  ))}
                </div>

                {/* Golden Dot Explanation Callout */}
                <div className="mt-5 p-3.5 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA] text-xs text-[#66605A] space-y-1.5">
                  <div className="font-semibold text-[#1C1917] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#E7A23B] inline-block" />
                    <span>Why keep the raw note separate?</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Your informal analogies are often the fastest way to recall a concept. Nexus Vault never mutates your <code className="font-mono">raw/</code> file—it marks the note with a golden companion indicator and links it to its formal counterpart.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Action Indicator */}
            <div className="px-5 py-3 bg-[#FAF8F5] border-t border-[#E7E2DA] flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] text-[#66605A]">
                Disk path: <code className="text-[#1C1917]">./{current.rawFile}</code>
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#287D54]">
                <span>Synthesize</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Right Column: process/ Formal Companion Note (7 cols) */}
          <div className="lg:col-span-7 rounded-xl border-2 border-[#D97706]/50 bg-[#131316] text-[#F4F4F5] shadow-xl flex flex-col justify-between overflow-hidden">
            <div>
              {/* Formal Header Bar */}
              <div className="px-4 py-3 bg-[#18191E] border-b border-[#272A32] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <BookMarked className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-mono font-semibold text-amber-200 truncate">
                    {current.formalFile}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                    Formal Companion
                  </span>
                </div>
              </div>

              {/* Companion Relationship Banner (Mirrors Editor.jsx line 389) */}
              <div className="px-4 py-2 bg-[#17181C] border-b border-[#272A32] flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono px-1.5 py-0.5 rounded bg-[#272A32] text-stone-300">
                    Derived from original note:
                  </span>
                  <span className="text-emerald-400 font-medium truncate">
                    "{current.rawFile.replace('raw/', '').replace('.md', '')}"
                  </span>
                </div>
                <span className="font-mono text-stone-400 hidden sm:inline">
                  Bidirectionally Linked
                </span>
              </div>

              {/* Structured Academic Sections */}
              <div className="p-6 space-y-4 text-xs">
                {/* 1. Intuition Bridge */}
                <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-500/30">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-amber-300 font-semibold mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>1. Intuition Bridge (Preserves Your Mental Model)</span>
                  </div>
                  <p className="text-stone-200 leading-relaxed">
                    {current.intuitionBridge}
                  </p>
                </div>

                {/* 2. Formal Definition & Equation */}
                <div className="p-3.5 rounded-lg bg-[#1A1B20] border border-[#272A32] space-y-2">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
                    2. Formal Definition & Mathematical Formulation
                  </div>
                  <div className="font-serif font-bold text-sm text-white">
                    {current.definitionTerm}
                  </div>
                  <p className="text-stone-300 leading-relaxed">
                    {current.definitionBody}
                  </p>
                  <div className="p-2.5 rounded bg-[#111113] border border-[#272A32] font-mono text-xs text-amber-200 overflow-x-auto">
                    {current.formula}
                  </div>
                </div>

                {/* 3. Derivation & Vault Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-[#1A1B20] border border-[#272A32]">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-purple-300 font-semibold mb-1">
                      3. Key Proof / Property
                    </div>
                    <div className="font-semibold text-white mb-1">{current.derivationTitle}</div>
                    <p className="text-[11px] text-stone-300 leading-relaxed">
                      {current.derivationBody}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#1A1B20] border border-[#272A32] flex flex-col justify-between">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mb-1.5">
                        4. Auto-Synced Graph Links
                      </div>
                      <div className="space-y-1.5 font-mono text-[10px] text-stone-300">
                        {current.links.map((lnk, idx) => (
                          <div key={idx} className="p-1.5 rounded bg-[#111113] border border-[#272A32] text-emerald-300 break-words">
                            {lnk}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Metadata Bar */}
            <div className="px-5 py-3 bg-[#18191E] border-t border-[#272A32] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-stone-400">
              <span>Disk path: <code className="text-amber-300">./{current.formalFile}</code></span>
              <span>Version History Archived · Overwrite Protected</span>
            </div>
          </div>
        </div>

        {/* 3 Architectural Guarantees Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="p-4 rounded-xl bg-white border border-[#E7E2DA] flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#2D5A43] shrink-0 mt-0.5" />
            <div>
              <div className="font-serif font-bold text-sm text-[#1C1917]">Non-Destructive Guarantee</div>
              <p className="text-xs text-[#66605A] leading-relaxed mt-0.5">
                Synthesizing a note never alters your <code className="font-mono">raw/</code> file. If you delete a processed companion note, the golden indicator clears automatically.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E7E2DA] flex items-start gap-3">
            <History className="w-5 h-5 text-[#2D5A43] shrink-0 mt-0.5" />
            <div>
              <div className="font-serif font-bold text-sm text-[#1C1917]">Version History & Review</div>
              <p className="text-xs text-[#66605A] leading-relaxed mt-0.5">
                Preview and edit synthesized Markdown before saving, or re-synthesize later with automatic version archiving and conflict protection.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E7E2DA] flex items-start gap-3">
            <HardDrive className="w-5 h-5 text-[#2D5A43] shrink-0 mt-0.5" />
            <div>
              <div className="font-serif font-bold text-sm text-[#1C1917]">Two-Way Physical Disk Sync</div>
              <p className="text-xs text-[#66605A] leading-relaxed mt-0.5">
                Every raw and formal note is mirrored as a standard <code className="font-mono">.md</code> file inside <code className="font-mono">./raw/</code> and <code className="font-mono">./process/</code> on your local drive.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
