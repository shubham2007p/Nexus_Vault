import React, { useState } from 'react';
import { GraduationCap, Terminal, Microscope, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function RealWorkUseCasesSection({ onLaunchApp }) {
  const [activeTab, setActiveTab] = useState(0);

  const workflows = [
    {
      id: 'students',
      role: 'Computer Science & Engineering Students',
      icon: GraduationCap,
      headline: 'Turn rushed lecture scribbles into linked, exam-ready companions.',
      scenario:
        'You write hurried, informal notes on "Singular Value Decomposition" during linear algebra class. Two months later, in a machine learning lab, you study "Principal Component Analysis" without realizing they share the exact same math.',
      withNexusVault:
        'Your original intuition stays untouched in raw/, while Synthesize generates a textbook-grade derivation in process/. Clicking Discover Links connects them via [[SVD | provides_basis_for | Decomposes covariance matrix to extract principal variance vectors]].',
      exampleNotes: ['raw/SVD Lecture.md', 'process/SVD (Formal).md', 'raw/PCA Lab.md'],
    },
    {
      id: 'engineers',
      role: 'Software Engineers & System Architects',
      icon: Terminal,
      headline: 'Connect Architecture Decision Records (ADRs) to operational realities.',
      scenario:
        'You jot down rough debugging notes during an incident on WebSocket connection drops behind corporate proxies, weeks after writing the original architecture spec for real-time sync.',
      withNexusVault:
        'Nexus Vault formalizes your incident scratchpad into a structured engineering note in process/ and maps it back to your original design via [[Canvas Sync ADR | constrained_by | HTTP/2 sticky session routing requirements on load balancer]].',
      exampleNotes: ['raw/Proxy Debug Log.md', 'process/WebSocket Postmortem.md', 'raw/Canvas Sync ADR.md'],
    },
    {
      id: 'researchers',
      role: 'Researchers & Technical Authors',
      icon: Microscope,
      headline: 'Trace mathematical lineages across dense literature.',
      scenario:
        'You read dozens of preprints across Transformer attention, recurrent networks, and state-space models. Standard folders and bare citation tags fail to capture how their underlying equations compare.',
      withNexusVault:
        'Synthesize formal mathematical comparisons in process/ and link papers by explicit mechanism: [[Transformer Attention | generalizes | Replaces sequential recurrence with parallel query-key similarity]] and [[Mamba SSM | improves_efficiency_of | Linear-time state space scaling vs quadratic attention]].',
      exampleNotes: ['raw/Attention Notes.md', 'process/Scaled Dot-Product (Formal).md', 'raw/Mamba SSM.md'],
    },
  ];

  const current = workflows[activeTab];
  const IconComponent = current.icon;

  return (
    <section id="use-cases" className="py-24 md:py-32 px-6 bg-[#F4EFEA] border-t border-[#E7E2DA]">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D6D0C5] bg-white text-[#2D5A43] text-xs font-mono uppercase tracking-wider mb-4">
            <span>Real-World Workflows</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#1C1917] leading-[1.15] mb-5">
            From individual notes <br className="hidden sm:inline" />
            <span className="italic font-normal text-[#2D5A43]">to a lasting body of knowledge.</span>
          </h2>
          <p className="text-[#66605A] text-base sm:text-lg leading-relaxed">
            Nexus Vault adapts to the way technical learners and builders actually work. Here is how students, engineers, and researchers combine <code className="font-mono text-xs text-[#1C1917]">raw/</code> capture, <code className="font-mono text-xs text-[#1C1917]">process/</code> synthesis, and contextual links.
          </p>
        </div>

        {/* Audience Selector Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {workflows.map((wf, idx) => (
            <button
              key={wf.id}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === idx
                  ? 'bg-[#1C1917] text-white shadow-xs'
                  : 'bg-white text-[#66605A] border border-[#E7E2DA] hover:bg-[#FAF8F5]'
              }`}
            >
              <wf.icon className="w-4 h-4" />
              <span>{wf.role}</span>
            </button>
          ))}
        </div>

        {/* Selected Workflow Editorial Card */}
        <div className="rounded-xl border border-[#D6D0C5] bg-white p-6 sm:p-10 shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[#E7E2DA] mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#EBF2EE] flex items-center justify-center text-[#2D5A43] shrink-0">
                <IconComponent className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#2D5A43] font-semibold">
                  {current.role}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] mt-0.5">
                  {current.headline}
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {current.exampleNotes.map((n) => (
                <span
                  key={n}
                  className={`px-2 py-0.5 rounded border text-[10px] font-mono ${
                    n.startsWith('process/')
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 font-semibold'
                      : 'bg-[#FAF8F5] border-[#E7E2DA] text-stone-600'
                  }`}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm leading-relaxed">
            {/* The Fragmented Reality */}
            <div className="p-5 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA]">
              <div className="text-xs font-mono uppercase tracking-wider text-[#8C827A] mb-2 font-semibold">
                Without Nexus Vault
              </div>
              <p className="text-[#66605A]">{current.scenario}</p>
            </div>

            {/* With Nexus Vault */}
            <div className="p-5 rounded-lg bg-[#EBF2EE] border border-[#B7D0C2]">
              <div className="text-xs font-mono uppercase tracking-wider text-[#1C3A2B] mb-2 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#2D5A43]" />
                <span>With Nexus Vault (raw/ + process/ + Graph)</span>
              </div>
              <p className="text-[#1C3A2B]">{current.withNexusVault}</p>
            </div>
          </div>

          {onLaunchApp && (
            <div className="mt-6 pt-5 border-t border-[#E7E2DA] flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-[#66605A] font-mono">
                Try this exact workflow with pre-loaded notes in the live workspace
              </span>
              <button
                onClick={onLaunchApp}
                className="inline-flex items-center gap-1.5 font-semibold text-[#2D5A43] hover:text-[#1C3A2B] cursor-pointer"
              >
                <span>Open Live Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
