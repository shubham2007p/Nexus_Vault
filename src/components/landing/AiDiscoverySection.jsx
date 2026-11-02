import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  X,
  ShieldCheck,
  RotateCcw,
  FileText,
  Cpu,
  Link2,
  Bot,
  Zap,
  Server,
  Key,
} from 'lucide-react';

const SUPPORTED_PROVIDERS = [
  {
    name: 'Groq Cloud (LPU)',
    badge: 'Ultra-Fast LPU',
    models: 'gpt-oss-120b · llama-3.3-70b · qwen3',
    prefix: 'gsk_...',
    accent: 'text-orange-400 border-orange-500/30 bg-orange-950/20',
  },
  {
    name: 'Anthropic Claude',
    badge: 'Deep Nuance',
    models: 'claude-3-5-sonnet · haiku · opus',
    prefix: 'sk-ant-...',
    accent: 'text-amber-300 border-amber-500/30 bg-amber-950/20',
  },
  {
    name: 'OpenAI (ChatGPT)',
    badge: 'Industry Standard',
    models: 'gpt-4o · gpt-4o-mini · o3-mini',
    prefix: 'sk-...',
    accent: 'text-emerald-300 border-emerald-500/30 bg-emerald-950/20',
  },
  {
    name: 'Google Gemini',
    badge: 'Long Context',
    models: 'gemini-2.0-flash · 1.5-pro',
    prefix: 'AIza...',
    accent: 'text-sky-300 border-sky-500/30 bg-sky-950/20',
  },
  {
    name: 'OpenRouter',
    badge: 'Multi-Model Router',
    models: 'deepseek-chat · llama-3.3 · claude',
    prefix: 'sk-or-...',
    accent: 'text-purple-300 border-purple-500/30 bg-purple-950/20',
  },
  {
    name: 'Mistral AI',
    badge: 'Frontier Open',
    models: 'mistral-large · mistral-small',
    prefix: 'Bearer key',
    accent: 'text-rose-300 border-rose-500/30 bg-rose-950/20',
  },
  {
    name: 'Local / Custom',
    badge: '100% Offline',
    models: 'Ollama · LM Studio (localhost:11434)',
    prefix: 'No key needed',
    accent: 'text-stone-300 border-stone-600/40 bg-stone-800/40',
  },
];

export default function AiDiscoverySection() {
  const [step, setStep] = useState('idle'); // 'idle' | 'analyzing' | 'proposals'
  const [proposal1Status, setProposal1Status] = useState('pending'); // 'pending' | 'accepted' | 'rejected'
  const [proposal2Status, setProposal2Status] = useState('pending'); // 'pending' | 'accepted' | 'rejected'

  const handleDiscoverLinks = () => {
    setStep('analyzing');
    setTimeout(() => {
      setStep('proposals');
      setProposal1Status('pending');
      setProposal2Status('pending');
    }, 650);
  };

  const handleAcceptAll = () => {
    if (proposal1Status === 'pending') setProposal1Status('accepted');
    if (proposal2Status === 'pending') setProposal2Status('accepted');
  };

  const handleReset = () => {
    setStep('idle');
    setProposal1Status('pending');
    setProposal2Status('pending');
  };

  const anyAccepted = proposal1Status === 'accepted' || proposal2Status === 'accepted';
  const pendingCount =
    (proposal1Status === 'pending' ? 1 : 0) + (proposal2Status === 'pending' ? 1 : 0);

  return (
    <section id="ai-discovery" className="py-24 md:py-32 px-6 bg-[#F4EFEA] border-y border-[#E7E2DA]">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D6D0C5] bg-white text-[#2D5A43] text-xs font-mono uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Human-in-the-Loop AI Discovery</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#1C1917] leading-[1.15] mb-5">
            Some connections are easy to miss. <br className="hidden sm:inline" />
            <span className="italic font-normal text-[#2D5A43]">Let Nexus Vault surface them for your review.</span>
          </h2>
          <p className="text-[#66605A] text-base sm:text-lg leading-relaxed">
            You never have to memorize or hand-type long link syntax. When you click{' '}
            <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-[#E7E2DA] font-semibold text-[#1C1917]">
              Discover Links
            </span>
            , your chosen AI model compares your current note against every title in your vault and proposes candidate relationships—which only enter your note when you click <strong>Accept</strong>.
          </p>
        </div>

        {/* Interactive "Discover Links" Workflow Simulator */}
        <div className="rounded-xl border border-[#D6D0C5] bg-[#111113] shadow-2xl overflow-hidden text-left">
          {/* Top Bar */}
          <div className="px-4 py-3 bg-[#151518] border-b border-[#26262c] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="font-mono text-stone-300 font-medium">
                Interactive Sandbox: Try Discovering & Approving Links
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-stone-400 font-mono hidden sm:inline">
                Simulated preview · Does not modify your local files
              </span>
              {step !== 'idle' && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#1c1c20] border border-[#26262c] text-[11px] text-stone-300 hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Sandbox</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[450px]">
            {/* Note Editor Area (7 cols) */}
            <div className="lg:col-span-7 p-6 sm:p-8 bg-[#131316] border-b lg:border-b-0 lg:border-r border-[#26262c] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono text-xs text-stone-300">raw/Transformer Attention.md</span>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400 uppercase px-2 py-0.5 rounded bg-[#1c1c20] border border-[#26262c]">
                    Raw Note
                  </span>
                </div>

                <div className="text-xl font-serif font-bold text-white mb-3">
                  # Scaled Dot-Product Attention
                </div>

                <p className="text-stone-300 text-sm leading-relaxed mb-4">
                  Scaled dot-product attention computes compatibility between queries <em>Q</em> and keys <em>K</em>, scaled by the square root of the head dimension <em>d<sub>k</sub></em> to prevent large dot products from pushing gradients into vanishing regions.
                </p>

                <div className="p-3 rounded bg-[#1c1c20] border border-[#26262c] font-mono text-xs text-stone-200 mb-6">
                  Attention(Q, K, V) = softmax(Q · Kᵀ / √d_k) · V
                </div>

                {/* Dynamic Appending Area when user accepts */}
                {anyAccepted && (
                  <div className="p-4 rounded-lg bg-emerald-950/25 border border-emerald-500/35 text-xs animate-in fade-in duration-200 mb-4 space-y-2">
                    <div className="font-mono text-[10px] uppercase text-emerald-400 font-semibold flex items-center justify-between">
                      <span>## Related Connections (Approved & Appended)</span>
                      <span>{proposal1Status === 'accepted' && proposal2Status === 'accepted' ? '2 links' : '1 link'}</span>
                    </div>
                    {proposal1Status === 'accepted' && (
                      <div className="font-mono text-stone-200 leading-relaxed bg-[#111113]/80 p-2 rounded border border-emerald-500/20">
                        - <span className="text-emerald-300">[[Softmax | normalizes | Converts raw dot-product attention logits into a valid probability distribution over tokens]]</span>
                      </div>
                    )}
                    {proposal2Status === 'accepted' && (
                      <div className="font-mono text-stone-200 leading-relaxed bg-[#111113]/80 p-2 rounded border border-amber-500/20">
                        - <span className="text-amber-300">[[Positional Encoding | provides_order_to | Injects sequence position information since attention operations are permutation invariant]]</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button Bar */}
              <div className="pt-4 border-t border-[#26262c] flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-stone-400">
                  {step === 'idle' && (
                    <span>Click <strong className="text-stone-200">Discover Links</strong> to scan against your vault titles →</span>
                  )}
                  {step === 'analyzing' && (
                    <span className="text-emerald-300 flex items-center gap-1.5 animate-pulse">
                      <Cpu className="w-3.5 h-3.5" />
                      Scanning note semantics against vault titles...
                    </span>
                  )}
                  {step === 'proposals' && (
                    <span className="text-emerald-400 font-medium">
                      {pendingCount > 0
                        ? `${pendingCount} candidate connection${pendingCount > 1 ? 's' : ''} awaiting your decision on the right →`
                        : 'All proposals reviewed! Click Reset Sandbox at the top to try again.'}
                    </span>
                  )}
                </div>

                <button
                  onClick={handleDiscoverLinks}
                  disabled={step === 'analyzing'}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    step === 'idle'
                      ? 'bg-[#287D54] hover:bg-[#1F6342] text-white shadow-md shadow-[#287D54]/30'
                      : 'bg-[#27272e] text-stone-300 hover:bg-[#32323a]'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>{step === 'idle' ? 'Discover Links' : 'Re-run Discovery'}</span>
                </button>
              </div>
            </div>

            {/* AI Review Workspace (5 cols) */}
            <div className="lg:col-span-5 p-6 bg-[#17171a] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="font-mono text-xs uppercase tracking-wider text-stone-300 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Human Approval Inspector</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {step === 'proposals' && pendingCount > 1 && (
                      <button
                        onClick={handleAcceptAll}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
                      >
                        Accept All ({pendingCount})
                      </button>
                    )}
                    <span className="text-[10px] font-mono text-stone-400">
                      {step === 'proposals' ? `${pendingCount} Pending` : '0 Pending'}
                    </span>
                  </div>
                </div>

                {step === 'idle' && (
                  <div className="p-8 border border-dashed border-[#26262c] rounded-xl text-center text-xs text-stone-400 my-auto">
                    <Link2 className="w-6 h-6 text-emerald-500/70 mx-auto mb-3" />
                    <p className="font-medium text-stone-200 mb-1">Click "Discover Links" in the editor</p>
                    <p className="text-[11px] text-stone-400 leading-relaxed mb-4">
                      The AI agent will analyze this note and present candidate 3-tuple relationships here for your approval.
                    </p>
                    <button
                      onClick={handleDiscoverLinks}
                      className="px-3.5 py-1.5 rounded-md bg-[#287D54] hover:bg-[#1F6342] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Run Discovery Demo</span>
                    </button>
                  </div>
                )}

                {step === 'analyzing' && (
                  <div className="p-8 border border-[#26262c] bg-[#1c1c20] rounded-xl text-center text-xs text-stone-400 my-auto space-y-3">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="font-mono text-stone-300 text-[11px]">Comparing against vault titles...</p>
                    <p className="text-[10px] text-stone-400">Proposing typed relationships and context explanations.</p>
                  </div>
                )}

                {step === 'proposals' && (
                  <div className="space-y-4">
                    {/* Proposal 1 */}
                    <div
                      className={`p-3.5 rounded-lg border transition-all ${
                        proposal1Status === 'accepted'
                          ? 'bg-emerald-950/20 border-emerald-500/40'
                          : proposal1Status === 'rejected'
                          ? 'bg-stone-900/60 border-stone-800 opacity-50'
                          : 'bg-[#1c1c20] border-[#26262c]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-xs text-white">Softmax.md</span>
                        <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-800/40">
                          normalizes
                        </span>
                      </div>
                      <p className={`text-[11px] text-stone-300 leading-snug mb-3 ${proposal1Status === 'rejected' ? 'line-through text-stone-500' : ''}`}>
                        "Converts raw dot-product attention logits into a valid probability distribution over tokens"
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
                        <div className="text-[10px] font-mono text-emerald-400 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Appended to note & indexed in graph</span>
                          </span>
                          <button
                            onClick={() => setProposal1Status('pending')}
                            className="text-stone-400 hover:text-white underline cursor-pointer"
                          >
                            Undo
                          </button>
                        </div>
                      )}

                      {proposal1Status === 'rejected' && (
                        <div className="text-[10px] font-mono text-stone-400 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <X className="w-3 h-3" />
                            <span>Dismissed. Note remained untouched.</span>
                          </span>
                          <button
                            onClick={() => setProposal1Status('pending')}
                            className="text-stone-400 hover:text-white underline cursor-pointer"
                          >
                            Undo
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Proposal 2 */}
                    <div
                      className={`p-3.5 rounded-lg border transition-all ${
                        proposal2Status === 'accepted'
                          ? 'bg-emerald-950/20 border-emerald-500/40'
                          : proposal2Status === 'rejected'
                          ? 'bg-stone-900/60 border-stone-800 opacity-50'
                          : 'bg-[#1c1c20] border-[#26262c]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-xs text-white">Positional Encoding.md</span>
                        <span className="font-mono text-[10px] text-amber-400 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-800/40">
                          provides_order_to
                        </span>
                      </div>
                      <p className={`text-[11px] text-stone-300 leading-snug mb-3 ${proposal2Status === 'rejected' ? 'line-through text-stone-500' : ''}`}>
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

                      {proposal2Status === 'accepted' && (
                        <div className="text-[10px] font-mono text-emerald-400 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Appended to note & indexed in graph</span>
                          </span>
                          <button
                            onClick={() => setProposal2Status('pending')}
                            className="text-stone-400 hover:text-white underline cursor-pointer"
                          >
                            Undo
                          </button>
                        </div>
                      )}

                      {proposal2Status === 'rejected' && (
                        <div className="text-[10px] font-mono text-stone-400 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <X className="w-3 h-3" />
                            <span>Dismissed. Note remained untouched.</span>
                          </span>
                          <button
                            onClick={() => setProposal2Status('pending')}
                            className="text-stone-400 hover:text-white underline cursor-pointer"
                          >
                            Undo
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Security & Agency Callout */}
              <div className="mt-6 pt-4 border-t border-[#26262c] text-[11px] text-stone-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>AI proposes. You decide. Zero silent background rewrites.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Universal BYOK AI Model Hub Showcase */}
        <div className="mt-10 rounded-xl border border-[#D6D0C5] bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E7E2DA]">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#EBF2EE] border border-[#B7D0C2] flex items-center justify-center text-[#2D5A43] shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-serif text-xl font-bold text-[#1C1917]">
                    Universal AI Model Hub — Bring Your Own Key or Run Locally
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#EBF2EE] border border-[#B7D0C2] text-[10px] font-mono font-semibold text-[#1C3A2B]">
                    7 Providers Supported
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#66605A] mt-1 leading-relaxed">
                  Click the <strong>Robot (<code className="font-mono text-xs">Bot</code>) button</strong> next to Save in the editor toolbar to switch models at any time. Paste an API key for automatic provider detection and verify connectivity with a live millisecond latency test.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 text-[11px] font-mono text-[#2D5A43]">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-[#E7E2DA]">
                <Key className="w-3 h-3" /> Auto-Detects Key Prefix
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-[#E7E2DA]">
                <Zap className="w-3 h-3" /> Live Ping Test
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-6">
            {SUPPORTED_PROVIDERS.map((prov) => (
              <div
                key={prov.name}
                className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA] flex flex-col justify-between hover:border-[#2D5A43]/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-xs text-[#1C1917]">{prov.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-[#E7E2DA] text-[#2D5A43] font-medium">
                      {prov.badge}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-[#66605A] truncate" title={prov.models}>
                    {prov.models}
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-[#E7E2DA]/70 flex items-center justify-between text-[10px] font-mono text-[#8C827A]">
                  <span>Signature:</span>
                  <code className="text-[#1C1917] bg-white px-1.5 py-0.2 rounded border border-[#E7E2DA]">
                    {prov.prefix}
                  </code>
                </div>
              </div>
            ))}

            {/* Fallback Heuristic Card */}
            <div className="p-3.5 rounded-lg bg-[#EBF2EE]/60 border border-[#B7D0C2] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-xs text-[#1C3A2B]">Lexical Fallback</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-[#B7D0C2] text-[#2D5A43] font-medium">
                    Built-In
                  </span>
                </div>
                <p className="text-[11px] text-[#1C3A2B] leading-snug">
                  Even without an API key configured, lexical co-occurrence matching remains available for offline link discovery.
                </p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-[#B7D0C2]/60 flex items-center justify-between text-[10px] font-mono text-[#2D5A43]">
                <span className="flex items-center gap-1">
                  <Server className="w-3 h-3" /> Local SQLite + Disk
                </span>
                <span>Zero Lock-In</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
