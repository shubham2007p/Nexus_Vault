import React, { useState } from 'react';
import { GraduationCap, Terminal, Microscope, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function RealWorkUseCasesSection() {
  const [activeTab, setActiveTab] = useState(0);

  const workflows = [
    {
      id: 'students',
      role: 'Computer Science & Engineering Students',
      icon: GraduationCap,
      headline: 'Connecting concepts across multidisciplinary courses.',
      scenario: 'You write a hurried lecture note on "Singular Value Decomposition" in linear algebra. Two months later, in a computer vision lab, you study "Principal Component Analysis".',
      withNexusvault: 'Nexusvault identifies the mathematical bridge, proposing [[SVD | provides_basis_for | Decomposes covariance matrix to extract principal variance vectors]]. Your notes accumulate into a cohesive mental model across semesters.',
      exampleNotes: ['Singular Value Decomposition.md', 'Principal Component Analysis.md', 'Image Compression.md']
    },
    {
      id: 'engineers',
      role: 'Software Engineers & System Architects',
      icon: Terminal,
      headline: 'Connecting Architecture Decision Records (ADRs) to operational constraints.',
      scenario: 'You document a decision to migrate from polling to WebSockets for a collaborative canvas. Weeks later, you troubleshoot edge-case connection drops behind corporate proxies.',
      withNexusvault: 'Nexusvault maps your debugging notes directly to your original decision record via [[Canvas Sync ADR | constrained_by | HTTP/2 sticky session routing requirements on load balancer]], preserving historical engineering rationale.',
      exampleNotes: ['Canvas Sync Architecture.md', 'Proxy Drop Postmortem.md', 'Load Balancer Config.md']
    },
    {
      id: 'researchers',
      role: 'Researchers & Technical Authors',
      icon: Microscope,
      headline: 'Tracing conceptual lineages across dense research literature.',
      scenario: 'You read dozens of preprint papers across attention mechanisms, recurrent models, and state-space architectures (Mamba). Citations alone do not explain how hypotheses compare.',
      withNexusvault: 'Nexusvault allows you to link papers by exact conceptual relationships: [[Transformer Attention | generalizes | Eliminates recurrence constraints of LSTM]] and [[Mamba SSM | improves_efficiency_of | Linear time sequence modeling vs quadratic self-attention]].',
      exampleNotes: ['Attention Is All You Need.md', 'Mamba SSM Paper.md', 'Memory Scaling Tradeoffs.md']
    }
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
            <span className="italic font-normal text-[#2D5A43]">to a body of knowledge.</span>
          </h2>
          <p className="text-[#66605A] text-base sm:text-lg leading-relaxed">
            Nexusvault adapts to the way technical thinkers actually work. 
            Here is how students, developers, and researchers turn isolated captures into enduring knowledge bases.
          </p>
        </div>

        {/* Audience Selector Tabs */}
        <div className="flex justify-center gap-3 mb-10 overflow-x-auto pb-2">
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
        <div className="rounded-xl border border-[#D6D0C5] bg-white p-8 sm:p-12 shadow-md">
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

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-[#8C827A] font-mono">Related Vault Cluster:</span>
              <div className="flex gap-1.5">
                {current.exampleNotes.map(n => (
                  <span key={n} className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E7E2DA] text-[10px] font-mono text-stone-600">
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm leading-relaxed">
            {/* The Fragmented Reality */}
            <div className="p-5 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA]">
              <div className="text-xs font-mono uppercase tracking-wider text-[#8C827A] mb-2 font-semibold">
                Without Contextual Discovery
              </div>
              <p className="text-[#66605A]">
                {current.scenario}
              </p>
            </div>

            {/* With Nexusvault */}
            <div className="p-5 rounded-lg bg-[#EBF2EE] border border-[#B7D0C2]">
              <div className="text-xs font-mono uppercase tracking-wider text-[#1C3A2B] mb-2 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#2D5A43]" />
                <span>With Nexusvault</span>
              </div>
              <p className="text-[#1C3A2B]">
                {current.withNexusvault}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
