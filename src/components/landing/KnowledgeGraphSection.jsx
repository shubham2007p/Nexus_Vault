import React, { useState } from 'react';
import { Network, Eye, Layers, Compass, ZoomIn, Info } from 'lucide-react';

export default function KnowledgeGraphSection() {
  const [activeCenter, setActiveCenter] = useState('Backpropagation');
  const [viewMode, setViewMode] = useState('local'); // 'local' | 'global'

  const nodes = [
    { id: 'Backpropagation', label: 'Backpropagation', type: 'center', desc: 'Core gradient computation algorithm via reverse-mode autodiff.' },
    { id: 'Chain Rule', label: 'Chain Rule', type: 'math', rel: 'relies_on', desc: 'Calculus foundation for compounding composite derivatives.' },
    { id: 'Gradient Descent', label: 'Gradient Descent', type: 'opt', rel: 'optimizes', desc: 'Iterative optimizer adjusting parameters against surface gradient.' },
    { id: 'Neural Networks', label: 'Neural Networks', type: 'sys', rel: 'implements', desc: 'Architecture topology composed of parameterized layer weights.' },
    { id: 'Loss Functions', label: 'Loss Functions', type: 'unresolved', rel: 'calculates_error', desc: 'Scalar objective quantifying discrepancy between prediction and ground truth.' },
    { id: 'Matrix Calculus', label: 'Matrix Calculus', type: 'math', rel: 'provides_basis_for', desc: 'Jacobian-vector products and multi-dimensional tensor contractions.' }
  ];

  const activeNodeInfo = nodes.find(n => n.id === activeCenter) || nodes[0];

  return (
    <section id="graph-view" className="py-24 md:py-32 px-6 bg-[#FAF8F5]">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D6D0C5] bg-[#F4EFEA] text-[#2D5A43] text-xs font-mono uppercase tracking-wider mb-4">
            <Network className="w-3.5 h-3.5" />
            <span>Topological Exploration</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#1C1917] leading-[1.15] mb-5">
            Step back. <br className="hidden sm:inline" />
            <span className="italic font-normal text-[#2D5A43]">See what your notes have in common.</span>
          </h2>
          <p className="text-[#66605A] text-base sm:text-lg leading-relaxed">
            In standard note apps, knowledge is locked in linear folders. 
            Nexusvault renders a real-time, interactive graph of your notes and their semantic relationships, allowing you to navigate your second brain spatially.
          </p>
        </div>

        {/* Graph Exploration Surface */}
        <div className="rounded-xl border border-[#D6D0C5] bg-[#111113] shadow-2xl overflow-hidden">
          {/* Graph Toolbar */}
          <div className="px-5 py-3.5 bg-[#151518] border-b border-[#26262c] flex flex-wrap items-center justify-between gap-3 text-xs text-stone-300">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-semibold text-white">Interactive Graph Explorer</span>
              <span className="px-2 py-0.5 rounded bg-[#1c1c20] border border-[#26262c] text-[10px] text-purple-300 font-mono">
                Click any node to re-center
              </span>
            </div>

            <div className="flex items-center gap-2 bg-[#1c1c20] p-1 rounded border border-[#26262c]">
              <button
                onClick={() => setViewMode('local')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'local'
                    ? 'bg-[#27272e] text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                1-Hop Neighborhood
              </button>
              <button
                onClick={() => setViewMode('global')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'global'
                    ? 'bg-[#27272e] text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Global Vault Overview
              </button>
            </div>
          </div>

          {/* Interactive Graph Canvas */}
          <div className="relative min-h-[440px] bg-[#111113] p-4 flex items-center justify-center overflow-hidden">
            {/* Subtle graph grid */}
            <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />

            {viewMode === 'local' ? (
              <svg className="w-full max-w-2xl h-88 relative z-10" viewBox="0 0 600 340">
                {/* Edges from Center to Neighbors */}
                <line x1="300" y1="170" x2="140" y2="90" stroke="#8b5cf6" strokeWidth="2" strokeOpacity="0.8" />
                <line x1="300" y1="170" x2="460" y2="100" stroke="#10b981" strokeWidth="2" strokeOpacity="0.8" />
                <line x1="300" y1="170" x2="150" y2="250" stroke="#a78bfa" strokeWidth="2" strokeOpacity="0.8" />
                <line x1="300" y1="170" x2="440" y2="240" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" strokeOpacity="0.8" />
                <line x1="300" y1="170" x2="300" y2="50" stroke="#6366f1" strokeWidth="2" strokeOpacity="0.8" />

                {/* Edge Text Labels */}
                <rect x="180" y="115" width="60" height="16" rx="3" fill="#151518" stroke="#26262c" />
                <text x="210" y="126" fill="#a78bfa" fontSize="9" fontFamily="monospace" textAnchor="middle">relies_on</text>

                <rect x="360" y="120" width="60" height="16" rx="3" fill="#151518" stroke="#26262c" />
                <text x="390" y="131" fill="#34d399" fontSize="9" fontFamily="monospace" textAnchor="middle">optimizes</text>

                <rect x="185" y="200" width="70" height="16" rx="3" fill="#151518" stroke="#26262c" />
                <text x="220" y="211" fill="#c4b5fd" fontSize="9" fontFamily="monospace" textAnchor="middle">implements</text>

                <rect x="345" y="195" width="85" height="16" rx="3" fill="#151518" stroke="#26262c" />
                <text x="387" y="206" fill="#fbbf24" fontSize="9" fontFamily="monospace" textAnchor="middle">calculates_error</text>

                <rect x="260" y="90" width="80" height="16" rx="3" fill="#151518" stroke="#26262c" />
                <text x="300" y="101" fill="#818cf8" fontSize="9" fontFamily="monospace" textAnchor="middle">provides_basis</text>

                {/* Neighbor Nodes */}
                {/* Node: Chain Rule */}
                <g onClick={() => setActiveCenter('Chain Rule')} className="cursor-pointer group">
                  <circle cx="140" cy="90" r="16" fill="#1e1e24" stroke="#8b5cf6" strokeWidth="2" className="group-hover:fill-purple-900/40 transition-colors" />
                  <text x="140" y="65" fill="#f4f4f5" fontSize="11" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">Chain Rule</text>
                  <text x="140" y="94" fill="#a78bfa" fontSize="9" textAnchor="middle" fontFamily="monospace">math</text>
                </g>

                {/* Node: Gradient Descent */}
                <g onClick={() => setActiveCenter('Gradient Descent')} className="cursor-pointer group">
                  <circle cx="460" cy="100" r="16" fill="#1e1e24" stroke="#10b981" strokeWidth="2" className="group-hover:fill-emerald-900/40 transition-colors" />
                  <text x="460" y="75" fill="#f4f4f5" fontSize="11" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">Gradient Descent</text>
                  <text x="460" y="104" fill="#34d399" fontSize="9" textAnchor="middle" fontFamily="monospace">opt</text>
                </g>

                {/* Node: Neural Networks */}
                <g onClick={() => setActiveCenter('Neural Networks')} className="cursor-pointer group">
                  <circle cx="150" cy="250" r="16" fill="#1e1e24" stroke="#a78bfa" strokeWidth="2" className="group-hover:fill-purple-900/40 transition-colors" />
                  <text x="150" y="280" fill="#f4f4f5" fontSize="11" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">Neural Networks</text>
                  <text x="150" y="254" fill="#c4b5fd" fontSize="9" textAnchor="middle" fontFamily="monospace">sys</text>
                </g>

                {/* Node: Loss Functions (Phantom / Unresolved) */}
                <g onClick={() => setActiveCenter('Loss Functions')} className="cursor-pointer group">
                  <circle cx="440" cy="240" r="14" fill="#18181b" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" className="group-hover:fill-amber-900/30 transition-colors" />
                  <text x="440" y="270" fill="#fbbf24" fontSize="11" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">Loss Functions</text>
                  <text x="440" y="244" fill="#fbbf24" fontSize="8" textAnchor="middle" fontFamily="monospace">unwritten</text>
                </g>

                {/* Node: Matrix Calculus */}
                <g onClick={() => setActiveCenter('Matrix Calculus')} className="cursor-pointer group">
                  <circle cx="300" cy="50" r="14" fill="#1e1e24" stroke="#6366f1" strokeWidth="2" className="group-hover:fill-indigo-900/40 transition-colors" />
                  <text x="300" y="28" fill="#f4f4f5" fontSize="11" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">Matrix Calculus</text>
                  <text x="300" y="54" fill="#818cf8" fontSize="8" textAnchor="middle" fontFamily="monospace">math</text>
                </g>

                {/* Center Note Node */}
                <g onClick={() => setActiveCenter('Backpropagation')} className="cursor-pointer">
                  <circle cx="300" cy="170" r="24" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2.5" className="shadow-lg" />
                  <circle cx="300" cy="170" r="30" fill="none" stroke="#a78bfa" strokeWidth="1" strokeOpacity="0.4" className="animate-ping" style={{ animationDuration: '3s' }} />
                  <text x="300" y="174" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                    {activeCenter === 'Backpropagation' ? 'Active Note' : 'Center'}
                  </text>
                </g>
              </svg>
            ) : (
              /* Global Vault Overview Mode */
              <div className="w-full max-w-2xl py-6 flex flex-col items-center justify-center text-center">
                <img
                  src="/knowledge_graph_ui.jpg"
                  alt="Full Knowledge Graph"
                  className="rounded-lg border border-[#26262c] max-h-72 object-cover shadow-lg mb-3"
                />
                <p className="text-xs text-stone-400 font-mono">
                  Displaying interconnected clusters across all 14 notes in vault.
                </p>
              </div>
            )}

            {/* Selected Node Details Card Overlay */}
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-xs p-3.5 rounded-lg bg-[#151518]/95 border border-[#26262c] backdrop-blur-md text-xs text-stone-300 shadow-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white text-sm">{activeNodeInfo.label}</span>
                <span className="font-mono text-[10px] text-purple-300 uppercase">
                  {activeNodeInfo.type}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 leading-snug">
                {activeNodeInfo.desc}
              </p>
              {activeNodeInfo.rel && (
                <div className="mt-2 text-[10px] font-mono text-emerald-400">
                  Relation to Backpropagation: {activeNodeInfo.rel}
                </div>
              )}
            </div>
          </div>

          {/* Graph Legend & Status */}
          <div className="px-5 py-3 bg-[#151518] border-t border-[#26262c] flex flex-wrap items-center justify-between gap-4 text-xs text-[#8e8e98]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                <span>Active Center</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Resolved Note</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border border-dashed border-amber-500 inline-block" />
                <span>Unwritten Note (Phantom)</span>
              </div>
            </div>

            <div className="font-mono text-[11px] text-stone-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-stone-500" />
              <span>Physics: 2D Force-Directed D3 Simulation</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
