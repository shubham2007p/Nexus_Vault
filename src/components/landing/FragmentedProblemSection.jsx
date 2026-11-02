import React, { useState } from 'react';
import { Unlink, Link2, Calendar, Lightbulb, AlertTriangle } from 'lucide-react';

export default function FragmentedProblemSection() {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <section id="problem" className="py-24 md:py-32 bg-[#F4EFEA] border-y border-[#E7E2DA] px-6 relative">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D6D0C5] bg-white text-[#66605A] text-xs font-mono uppercase tracking-wider mb-4">
            <span>The Capture-Time Dilemma</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#1C1917] leading-[1.15] mb-5">
            The problem isn't taking notes. <br className="hidden sm:inline" />
            <span className="italic font-normal text-[#2D5A43]">It's what happens after you close the file.</span>
          </h2>
          <p className="text-[#66605A] text-base sm:text-lg leading-relaxed">
            When you are in a fast-paced lecture or debugging a complex system, stopping to format equations, organize folders, and link past notes breaks your focus. Over time, notes written weeks apart become isolated islands of dark data.
          </p>

          {/* Interactive State Toggle */}
          <div className="inline-flex flex-wrap items-center justify-center p-1 bg-white border border-[#E7E2DA] rounded-lg mt-8 shadow-2xs gap-1">
            <button
              onClick={() => setIsConnected(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                !isConnected
                  ? 'bg-[#1C1917] text-white shadow-xs'
                  : 'text-[#66605A] hover:text-[#1C1917]'
              }`}
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>1. Isolated Notes (Traditional Capture)</span>
            </button>
            <button
              onClick={() => setIsConnected(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                isConnected
                  ? 'bg-[#2D5A43] text-white shadow-xs'
                  : 'text-[#66605A] hover:text-[#2D5A43]'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>2. Connected Lineage (With Nexus Vault)</span>
            </button>
          </div>
        </div>

        {/* 3 Coherent Notes Showcase */}
        <div className="relative">
          {/* Connector Visual Lines in Connected Mode */}
          {isConnected && (
            <div className="hidden lg:block absolute inset-0 pointer-events-none z-0">
              <svg className="w-full h-full" viewBox="0 0 900 320" fill="none">
                <path
                  d="M 280 150 C 340 100, 360 100, 420 150"
                  stroke="#2D5A43"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                  className="animate-pulse"
                />
                <path
                  d="M 580 150 C 640 200, 660 200, 720 150"
                  stroke="#2D5A43"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                  className="animate-pulse"
                />
              </svg>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* Note 1: Mathematics Concept */}
            <div
              className={`rounded-xl border transition-all duration-300 p-6 flex flex-col justify-between ${
                isConnected
                  ? 'bg-white border-[#2D5A43]/40 shadow-md ring-1 ring-[#2D5A43]/20'
                  : 'bg-white/80 border-[#E7E2DA] shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[#8C827A] mb-3 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Sept 12 (Calculus III)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E7E2DA] text-[10px]">
                    raw/Mathematics
                  </span>
                </div>
                <h3 className="font-serif text-xl font-bold text-[#1C1917] mb-2">
                  Multivariable Chain Rule
                </h3>
                <p className="text-xs text-[#66605A] leading-relaxed mb-4">
                  For composite functions <span className="font-serif italic text-[#1C1917]">z = f(u, v)</span> where <span className="font-serif italic text-[#1C1917]">u = g(t)</span> and <span className="font-serif italic text-[#1C1917]">v = h(t)</span>, the total derivative accumulates partial differentials along every intermediate path.
                </p>
                <div className="p-2.5 rounded bg-[#FAF8F5] border border-[#E7E2DA] font-mono text-[11px] text-[#44403C]">
                  dz/dt = (∂z/∂u)·(du/dt) + (∂z/∂v)·(dv/dt)
                </div>
              </div>

              {/* Status / Link Banner */}
              <div className="mt-6 pt-4 border-t border-[#E7E2DA]">
                {isConnected ? (
                  <div className="text-[11px] font-mono text-[#2D5A43] bg-[#EBF2EE] p-2.5 rounded border border-[#B7D0C2]">
                    <div className="font-semibold flex items-center gap-1">
                      <span>→ prerequisite_for: Backpropagation</span>
                    </div>
                    <div className="text-[10px] text-[#1C3A2B] mt-0.5 font-sans">
                      "Computes backward error propagation through layered composite transformations"
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-[#8C827A] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600/80 shrink-0" />
                    <span>Isolated scribble. No links created during class.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Note 2: Machine Learning Concept */}
            <div
              className={`rounded-xl border transition-all duration-300 p-6 flex flex-col justify-between ${
                isConnected
                  ? 'bg-white border-[#2D5A43] shadow-lg ring-2 ring-[#2D5A43]/20 md:scale-[1.02]'
                  : 'bg-white/80 border-[#E7E2DA] shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[#8C827A] mb-3 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Oct 03 (ML Foundations)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E7E2DA] text-[10px]">
                    raw/Deep Learning
                  </span>
                </div>
                <h3 className="font-serif text-xl font-bold text-[#1C1917] mb-2">
                  Backpropagation Algorithm
                </h3>
                <p className="text-xs text-[#66605A] leading-relaxed mb-4">
                  Computes the loss gradient per weight tensor via reverse-mode automatic differentiation, passing error signals backward from the output layer.
                </p>
                <div className="p-2.5 rounded bg-[#FAF8F5] border border-[#E7E2DA] font-mono text-[11px] text-[#44403C]">
                  ∇<sub>W</sub> L = δ<sup>(l)</sup> · (a<sup>(l−1)</sup>)<sup>T</sup>
                </div>
              </div>

              {/* Status / Link Banner */}
              <div className="mt-6 pt-4 border-t border-[#E7E2DA]">
                {isConnected ? (
                  <div className="text-[11px] font-mono text-[#2D5A43] bg-[#EBF2EE] p-2.5 rounded border border-[#B7D0C2]">
                    <div className="font-semibold flex items-center gap-1">
                      <span>← relies_on Chain Rule · → guides Quantization</span>
                    </div>
                    <div className="text-[10px] text-[#1C3A2B] mt-0.5 font-sans">
                      "Bridges foundational calculus to downstream model compression constraints"
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-[#8C827A] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600/80 shrink-0" />
                    <span>Orphaned note. Mathematical lineage unrecorded.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Note 3: Engineering / Project Concept */}
            <div
              className={`rounded-xl border transition-all duration-300 p-6 flex flex-col justify-between ${
                isConnected
                  ? 'bg-white border-[#2D5A43]/40 shadow-md ring-1 ring-[#2D5A43]/20'
                  : 'bg-white/80 border-[#E7E2DA] shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[#8C827A] mb-3 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Oct 14 (Systems Lab)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E7E2DA] text-[10px]">
                    raw/Edge Systems
                  </span>
                </div>
                <h3 className="font-serif text-xl font-bold text-[#1C1917] mb-2">
                  Quantized Model Inference
                </h3>
                <p className="text-xs text-[#66605A] leading-relaxed mb-4">
                  Compressing FP32 weight tensors to INT8 integers to satisfy edge-device memory bandwidth limits while bounding accuracy degradation.
                </p>
                <div className="p-2.5 rounded bg-[#FAF8F5] border border-[#E7E2DA] font-mono text-[11px] text-[#44403C]">
                  q = round(r / Scale) + ZeroPoint
                </div>
              </div>

              {/* Status / Link Banner */}
              <div className="mt-6 pt-4 border-t border-[#E7E2DA]">
                {isConnected ? (
                  <div className="text-[11px] font-mono text-[#2D5A43] bg-[#EBF2EE] p-2.5 rounded border border-[#B7D0C2]">
                    <div className="font-semibold flex items-center gap-1">
                      <span>← constrained_by: Backpropagation</span>
                    </div>
                    <div className="text-[10px] text-[#1C3A2B] mt-0.5 font-sans">
                      "Quantization sensitivity analysis uses backward loss gradients to protect salient weights"
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-[#8C827A] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600/80 shrink-0" />
                    <span>Filed under 'Systems', invisible when studying ML.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Narrative Takeaway Box */}
        <div className="mt-12 p-6 rounded-xl bg-white border border-[#E7E2DA] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#EBF2EE] flex items-center justify-center text-[#2D5A43] shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <div className="font-serif font-bold text-base text-[#1C1917]">
                {isConnected
                  ? 'Decouple Raw Capture from Organization'
                  : 'Why Traditional Folders & Plain Links Fall Short'}
              </div>
              <p className="text-xs text-[#66605A] leading-relaxed mt-0.5">
                {isConnected
                  ? 'Nexus Vault lets you write fast in the moment, then helps you formalize messy notes into textbook-grade companions and discover how Calculus, Backpropagation, and Systems Engineering fit together.'
                  : 'These three notes form a single continuous chain of reasoning—yet because they were written weeks apart in different classes, they sit disconnected until you intentionally synthesize and link them.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsConnected(!isConnected)}
            className="px-4 py-2 text-xs font-semibold rounded-md border border-[#D6D0C5] bg-[#FAF8F5] hover:bg-[#F4EFEA] text-[#1C1917] shrink-0 transition-colors cursor-pointer"
          >
            {isConnected ? 'Show Isolated View' : 'Connect with Nexus Vault →'}
          </button>
        </div>
      </div>
    </section>
  );
}
