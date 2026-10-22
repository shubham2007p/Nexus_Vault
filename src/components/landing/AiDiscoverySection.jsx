import React, { useState } from 'react';
import { Sparkles, Check, X, ShieldCheck, ArrowRight, RotateCcw, AlertCircle, FileText, Cpu } from 'lucide-react';

export default function AiDiscoverySection() {
  const [step, setStep] = useState('idle'); // 'idle' | 'analyzing' | 'proposals'
  const [proposal1Status, setProposal1Status] = useState('pending'); // 'pending' | 'accepted' | 'rejected'
  const [proposal2Status, setProposal2Status] = useState('pending');

  const handleProcessFile = () => {
    setStep('analyzing');
    setTimeout(() => {
      setStep('proposals');
      setProposal1Status('pending');
      setProposal2Status('pending');
    }, 900);
  };

  const handleReset = () => {
    setStep('idle');
    setProposal1Status('pending');
    setProposal2Status('pending');
  };

  return (
    <section id="ai-discovery" className="py-24 md:py-32 px-6 bg-[#F4EFEA] border-y border-[#E7E2DA]">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D6D0C5] bg-white text-[#2D5A43] text-xs font-mono uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Human-in-the-Loop AI Assistant</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#1C1917] leading-[1.15] mb-5">
            Some connections are easy to miss. <br className="hidden sm:inline" />
            <span className="italic font-normal text-[#2D5A43]">Let Nexusvault look for them.</span>
          </h2>
          <p className="text-[#66605A] text-base sm:text-lg leading-relaxed">
            Nexusvault does not generate generic fluff or overwrite your words. 
            When you invoke <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-[#E7E2DA] font-semibold text-[#1C1917]">Process File</span>, 
            an AI agent scans your note against your vault titles, proposing relationships for you to review, accept, or reject.
          </p>
        </div>

        {/* Interactive "Process File" Workflow Simulator */}
        <div className="rounded-xl border border-[#D6D0C5] bg-[#111113] shadow-2xl overflow-hidden text-left">
          {/* Top Bar */}
          <div className="px-4 py-3 bg-[#151518] border-b border-[#26262c] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8e8e98]/40" />
              <span className="font-mono text-stone-300 font-medium">Interactive Workflow Demonstration</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-stone-400 font-mono hidden sm:inline">
                Tool: <code className="text-violet-400">propose_link</code> schema
              </span>
              {step !== 'idle' && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Demo</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[440px]">
            {/* Note Editor Area (7 cols) */}
            <div className="lg:col-span-7 p-6 sm:p-8 bg-[#131316] border-b lg:border-b-0 lg:border-r border-[#26262c] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-violet-400" />
                    <span className="font-mono text-xs text-stone-400">Transformer Attention.md</span>
                  </div>
                  <span className="text-[10px] font-mono text-stone-500 uppercase">
                    Word count: 184
                  </span>
                </div>

                <div className="text-xl font-serif font-bold text-white mb-3">
                  # Scaled Dot-Product Attention
                </div>

                <p className="text-stone-300 text-sm leading-relaxed mb-4">
                  Scaled dot-product attention computes compatibility between queries Q and keys K, scaled by the square root of the head dimension d_k.
                </p>

                <div className="p-3 rounded bg-[#1c1c20] border border-[#26262c] font-mono text-xs text-stone-200 mb-6">
                  Attention(Q, K, V) = softmax(Q · K^T / √d_k) · V
                </div>

                {/* Dynamic Appending Area when user accepts */}
                {proposal1Status === 'accepted' && (
                  <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs animate-in fade-in duration-300 mb-4">
                    <div className="font-mono text-[10px] uppercase text-emerald-400 font-semibold mb-1">
                      ## Related Connections (Persisted by You)
                    </div>
                    <div className="font-mono text-stone-200">
                      - [[Softmax | normalizes | Converts raw dot-product attention logits into valid probability distribution over tokens]]
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button Bar */}
              <div className="pt-4 border-t border-[#26262c] flex items-center justify-between">
                <div className="text-xs text-stone-400">
                  {step === 'idle' && 'Unlinked note. Ready for discovery.'}
                  {step === 'analyzing' && (
                    <span className="text-violet-300 flex items-center gap-1.5 animate-pulse">
                      <Cpu className="w-3.5 h-3.5" />
                      Analyzing note semantics against 14 vault titles...
                    </span>
                  )}
                  {step === 'proposals' && (
                    <span className="text-emerald-400 font-medium">
                      2 suggestions discovered. Review them on the right →
                    </span>
                  )}
                </div>

                <button
                  onClick={handleProcessFile}
                  disabled={step === 'analyzing'}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    step === 'idle'
                      ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/30'
                      : 'bg-[#27272e] text-stone-300 hover:bg-[#32323a]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{step === 'idle' ? 'Process File' : 'Re-run Discovery'}</span>
                </button>
              </div>
            </div>

            {/* AI Review Workspace (5 cols) */}
            <div className="lg:col-span-5 p-6 bg-[#17171a] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="font-mono text-xs uppercase tracking-wider text-stone-400 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Human Approval Panel</span>
                  </div>
                  <span className="text-[10px] font-mono text-stone-500">
                    {step === 'proposals' ? '2 Pending' : '0 Pending'}
                  </span>
                </div>

                {step === 'idle' && (
                  <div className="p-8 border border-dashed border-[#26262c] rounded-xl text-center text-xs text-stone-400 my-auto">
                    <Sparkles className="w-6 h-6 text-stone-600 mx-auto mb-3" />
                    <p className="font-medium text-stone-300 mb-1">Click "Process File" on the left</p>
                    <p className="text-[11px] text-stone-500">
                      The AI agent will analyze this note and present candidate contextual relationships for your approval.
                    </p>
                  </div>
                )}

                {step === 'analyzing' && (
                  <div className="p-8 border border-[#26262c] bg-[#1c1c20] rounded-xl text-center text-xs text-stone-400 my-auto space-y-3">
                    <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="font-mono text-stone-300 text-[11px]">Dispatching single-shot tool call...</p>
                    <p className="text-[10px] text-stone-500">Evaluating conceptual overlap with unlinked vault notes.</p>
                  </div>
                )}

                {step === 'proposals' && (
                  <div className="space-y-4">
                    {/* Proposal 1 */}
                    <div
                      className={`p-3.5 rounded-lg border transition-all ${
                        proposal1Status === 'accepted'
                          ? 'bg-emerald-950/20 border-emerald-500/40 opacity-75'
                          : proposal1Status === 'rejected'
                          ? 'bg-stone-900 border-stone-800 opacity-40 line-through'
                          : 'bg-[#1c1c20] border-[#26262c]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-xs text-white">Softmax.md</span>
                        <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-800/40">
                          normalizes
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-300 leading-snug mb-3">
                        "Converts raw dot-product attention logits into valid probability distribution over tokens"
                      </p>

                      {proposal1Status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setProposal1Status('accepted')}
                            className="flex-1 py-1.5 px-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => setProposal1Status('rejected')}
                            className="py-1.5 px-3 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}

                      {proposal1Status === 'accepted' && (
                        <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Appended to note & indexed in graph</span>
                        </div>
                      )}
                    </div>

                    {/* Proposal 2 */}
                    <div
                      className={`p-3.5 rounded-lg border transition-all ${
                        proposal2Status === 'accepted'
                          ? 'bg-emerald-950/20 border-emerald-500/40 opacity-75'
                          : proposal2Status === 'rejected'
                          ? 'bg-stone-900 border-stone-800 opacity-40'
                          : 'bg-[#1c1c20] border-[#26262c]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-xs text-white">Positional Encoding.md</span>
                        <span className="font-mono text-[10px] text-amber-400 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-800/40">
                          provides_order_to
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-300 leading-snug mb-3">
                        "Injects sequence position information since attention operations are permutation invariant"
                      </p>

                      {proposal2Status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setProposal2Status('accepted')}
                            className="flex-1 py-1.5 px-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => setProposal2Status('rejected')}
                            className="py-1.5 px-3 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}

                      {proposal2Status === 'rejected' && (
                        <div className="text-[10px] font-mono text-stone-400 flex items-center gap-1">
                          <X className="w-3 h-3" />
                          <span>Dismissed. File remained completely untouched.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Security & Agency Callout */}
              <div className="mt-6 pt-4 border-t border-[#26262c] text-[11px] text-stone-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>AI proposes. You dispose. No unexpected background rewrites.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
