import React, { useState } from 'react';
import { Network, Info, CheckCircle2 } from 'lucide-react';

const LOCAL_NODES = [
  {
    id: 'Backpropagation',
    label: 'Backpropagation',
    folder: 'raw/Backpropagation.md',
    type: 'raw',
    badge: 'Center Note (raw/)',
    cx: 300,
    cy: 170,
    r: 22,
    color: '#10b981',
    desc: 'Core gradient computation algorithm via reverse-mode automatic differentiation across network layers.',
    rel: null,
    context: 'Currently active note in editor with 5 connected neighbors (including 1 formal companion).',
  },
  {
    id: 'Backpropagation (Formal)',
    label: 'Backpropagation (Formal)',
    folder: 'process/Backpropagation (Formal).md',
    type: 'formal',
    badge: 'Formal Companion (process/)',
    cx: 300,
    cy: 48,
    labelY: 24,
    r: 16,
    color: '#f59e0b',
    edgeLabelX: 300,
    edgeLabelY: 105,
    rel: 'synthesizes',
    desc: 'Textbook-grade companion note with Intuition Bridge, Jacobian-vector theorems, and step-by-step LaTeX derivations.',
    context: 'Bidirectionally linked companion note generated in process/ folder.',
  },
  {
    id: 'Chain Rule',
    label: 'Chain Rule',
    folder: 'raw/Chain Rule.md',
    type: 'raw',
    badge: 'Raw Note (raw/)',
    cx: 130,
    cy: 95,
    labelY: 68,
    r: 16,
    color: '#10b981',
    edgeLabelX: 205,
    edgeLabelY: 122,
    rel: 'relies_on',
    desc: 'Multivariable calculus foundation for compounding partial derivatives along computational paths.',
    context: '[[Chain Rule | relies_on | Computes layer gradients backwards through activation graph]]',
  },
  {
    id: 'Gradient Descent',
    label: 'Gradient Descent',
    folder: 'raw/Gradient Descent.md',
    type: 'raw',
    badge: 'Raw Note (raw/)',
    cx: 470,
    cy: 95,
    labelY: 68,
    r: 16,
    color: '#10b981',
    edgeLabelX: 395,
    edgeLabelY: 122,
    rel: 'optimizes',
    desc: 'First-order iterative optimizer updating weight tensors opposite to the loss gradient.',
    context: '[[Gradient Descent | optimizes | Minimizes empirical loss along continuous parameter surface]]',
  },
  {
    id: 'Neural Networks',
    label: 'Neural Networks',
    folder: 'raw/Neural Networks.md',
    type: 'raw',
    badge: 'Raw Note (raw/)',
    cx: 140,
    cy: 255,
    labelY: 284,
    r: 16,
    color: '#10b981',
    edgeLabelX: 215,
    edgeLabelY: 218,
    rel: 'implements',
    desc: 'Parameterized multi-layer architecture trained via forward pass activations and backward error propagation.',
    context: 'Incoming backlink from Neural Networks.md ("Trained via reverse-mode autodiff").',
  },
  {
    id: 'Loss Functions',
    label: 'Loss Functions',
    folder: 'Unwritten Note (Phantom)',
    type: 'ghost',
    badge: 'Phantom Node',
    cx: 460,
    cy: 255,
    labelY: 284,
    r: 14,
    color: '#a8a29e',
    edgeLabelX: 385,
    edgeLabelY: 218,
    rel: 'calculates_error',
    desc: 'Unwritten target referenced via [[Loss Functions | calculates_error | Quantifies scalar discrepancy]]. Automatically resolves when created.',
    context: '[[Loss Functions | calculates_error | Mean squared error or cross-entropy objective]]',
  },
];

const GLOBAL_NODES = [
  // Cluster 1: Optimization & Calculus
  { id: 'Backpropagation', label: 'Backpropagation', type: 'raw', cx: 210, cy: 165, r: 14, folder: 'raw/Backpropagation.md', rel: 'Hub Note (5 links)', desc: 'Central gradient computation note connecting calculus foundations to deep architectures.' },
  { id: 'Backpropagation (Formal)', label: 'Backprop (Formal)', type: 'formal', cx: 210, cy: 85, r: 12, folder: 'process/Backpropagation (Formal).md', rel: 'Formal Companion', desc: 'Synthesized textbook derivation of reverse-mode automatic differentiation.' },
  { id: 'Chain Rule', label: 'Chain Rule', type: 'raw', cx: 105, cy: 120, r: 11, folder: 'raw/Chain Rule.md', rel: 'prerequisite_for', desc: 'Multivariable chain rule across composite tensor functions.' },
  { id: 'Matrix Calculus', label: 'Matrix Calculus', type: 'raw', cx: 100, cy: 215, r: 11, folder: 'raw/Matrix Calculus.md', rel: 'provides_basis_for', desc: 'Jacobian and Hessian matrix operations for vector-valued derivatives.' },
  { id: 'Gradient Descent', label: 'Gradient Descent', type: 'raw', cx: 295, cy: 235, r: 12, folder: 'raw/Gradient Descent.md', rel: 'optimizes', desc: 'Iterative parameter updates using learning rate schedules and momentum.' },
  { id: 'Loss Functions', label: 'Loss Functions', type: 'ghost', cx: 195, cy: 270, r: 9, folder: 'Unwritten Phantom Node', rel: 'calculates_error', desc: 'Unresolved wikilink target waiting to be created in the vault.' },

  // Cluster 2: Sequence & Attention Architectures
  { id: 'Neural Networks', label: 'Neural Networks', type: 'raw', cx: 345, cy: 145, r: 13, folder: 'raw/Neural Networks.md', rel: 'Bridge Note (4 links)', desc: 'Foundational deep learning architecture linking optimization to sequence models.' },
  { id: 'Transformer Attention', label: 'Transformer Attention', type: 'raw', cx: 465, cy: 155, r: 14, folder: 'raw/Transformer Attention.md', rel: 'Hub Note (4 links)', desc: 'Scaled dot-product and multi-head attention mechanisms.' },
  { id: 'Attention (Formal)', label: 'Attention (Formal)', type: 'formal', cx: 475, cy: 75, r: 12, folder: 'process/Scaled Dot-Product Attention (Formal).md', rel: 'Formal Companion', desc: 'Formal matrix formulation: Attention(Q,K,V) = softmax(QK^T / sqrt(d_k))V.' },
  { id: 'Softmax', label: 'Softmax', type: 'raw', cx: 565, cy: 125, r: 10, folder: 'raw/Softmax.md', rel: 'normalizes', desc: 'Normalizes unscaled attention logits into a probability simplex.' },
  { id: 'Positional Encoding', label: 'Positional Encoding', type: 'raw', cx: 555, cy: 220, r: 10, folder: 'raw/Positional Encoding.md', rel: 'provides_order_to', desc: 'Trigonometric and rotary embeddings injecting token order into attention.' },
  { id: 'Quantized Inference', label: 'Quantized Inference', type: 'raw', cx: 425, cy: 255, r: 11, folder: 'raw/Quantized Inference.md', rel: 'constrained_by', desc: 'INT8 weight quantization for memory-bounded edge deployment.' },
];

const GLOBAL_EDGES = [
  { from: 'Backpropagation', to: 'Backpropagation (Formal)', style: 'formal' },
  { from: 'Backpropagation', to: 'Chain Rule', style: 'raw' },
  { from: 'Backpropagation', to: 'Matrix Calculus', style: 'raw' },
  { from: 'Backpropagation', to: 'Gradient Descent', style: 'raw' },
  { from: 'Backpropagation', to: 'Loss Functions', style: 'ghost' },
  { from: 'Backpropagation', to: 'Neural Networks', style: 'raw' },
  { from: 'Chain Rule', to: 'Matrix Calculus', style: 'raw' },
  { from: 'Gradient Descent', to: 'Neural Networks', style: 'raw' },
  { from: 'Neural Networks', to: 'Transformer Attention', style: 'raw' },
  { from: 'Transformer Attention', to: 'Attention (Formal)', style: 'formal' },
  { from: 'Transformer Attention', to: 'Softmax', style: 'raw' },
  { from: 'Transformer Attention', to: 'Positional Encoding', style: 'raw' },
  { from: 'Transformer Attention', to: 'Quantized Inference', style: 'raw' },
  { from: 'Gradient Descent', to: 'Quantized Inference', style: 'raw' },
];

export default function KnowledgeGraphSection() {
  const [selectedLocalId, setSelectedLocalId] = useState('Backpropagation (Formal)');
  const [selectedGlobalId, setSelectedGlobalId] = useState('Transformer Attention');
  const [viewMode, setViewMode] = useState('local'); // 'local' | 'global'

  const centerNode = LOCAL_NODES[0];
  const neighborNodes = LOCAL_NODES.slice(1);
  const activeLocalNode = LOCAL_NODES.find((n) => n.id === selectedLocalId) || LOCAL_NODES[0];
  const activeGlobalNode = GLOBAL_NODES.find((n) => n.id === selectedGlobalId) || GLOBAL_NODES[0];

  const activeInfo = viewMode === 'local' ? activeLocalNode : activeGlobalNode;

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
            <span className="italic font-normal text-[#2D5A43]">See how raw captures and formal notes connect.</span>
          </h2>
          <p className="text-[#66605A] text-base sm:text-lg leading-relaxed">
            In standard note apps, knowledge is buried inside linear folders. Nexus Vault renders a live, force-directed graph showing how your raw intuitions (<code className="font-mono text-xs text-[#2D5A43]">raw/</code>), formal companions (<code className="font-mono text-xs text-amber-700">process/</code>), and unwritten concepts link together.
          </p>
        </div>

        {/* Graph Exploration Surface */}
        <div className="rounded-xl border border-[#D6D0C5] bg-[#111113] shadow-2xl overflow-hidden">
          {/* Graph Toolbar */}
          <div className="px-5 py-3.5 bg-[#151518] border-b border-[#26262c] flex flex-wrap items-center justify-between gap-3 text-xs text-stone-300">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-semibold text-white">Interactive Graph Explorer</span>
              <span className="px-2 py-0.5 rounded bg-[#1c1c20] border border-[#26262c] text-[10px] text-emerald-300 font-mono">
                Click any node to inspect its relationship
              </span>
            </div>

            <div className="flex items-center gap-2 bg-[#1c1c20] p-1 rounded border border-[#26262c]">
              <button
                onClick={() => setViewMode('local')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'local'
                    ? 'bg-[#287D54] text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                1-Hop Neighborhood
              </button>
              <button
                onClick={() => setViewMode('global')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'global'
                    ? 'bg-[#287D54] text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Global Vault Overview
              </button>
            </div>
          </div>

          {/* Interactive Graph Canvas */}
          <div className="relative min-h-[460px] bg-[#111113] p-4 flex flex-col lg:flex-row items-center justify-between gap-6 overflow-hidden">
            {/* Subtle graph grid */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />

            <div className="w-full lg:w-2/3 flex items-center justify-center relative z-10">
              {viewMode === 'local' ? (
                <svg className="w-full max-w-2xl h-88 select-none" viewBox="0 0 600 330">
                  {/* Edges from Center to Neighbors */}
                  {neighborNodes.map((node) => {
                    const isSelected = selectedLocalId === node.id;
                    const strokeColor =
                      node.type === 'formal'
                        ? '#f59e0b'
                        : node.type === 'ghost'
                        ? '#a8a29e'
                        : '#10b981';
                    return (
                      <g key={`edge-${node.id}`}>
                        <line
                          x1={centerNode.cx}
                          y1={centerNode.cy}
                          x2={node.cx}
                          y2={node.cy}
                          stroke={strokeColor}
                          strokeWidth={isSelected ? '3' : '1.75'}
                          strokeDasharray={node.type === 'ghost' ? '4 4' : undefined}
                          strokeOpacity={isSelected ? '1' : '0.45'}
                        />
                        {/* Edge Label Pill */}
                        <g
                          onClick={() => setSelectedLocalId(node.id)}
                          className="cursor-pointer"
                        >
                          <rect
                            x={node.edgeLabelX - 42}
                            y={node.edgeLabelY - 9}
                            width="84"
                            height="18"
                            rx="4"
                            fill={isSelected ? '#1f2421' : '#151518'}
                            stroke={isSelected ? strokeColor : '#26262c'}
                            strokeWidth={isSelected ? '1.5' : '1'}
                          />
                          <text
                            x={node.edgeLabelX}
                            y={node.edgeLabelY + 3}
                            fill={
                              node.type === 'formal'
                                ? '#fbbf24'
                                : node.type === 'ghost'
                                ? '#d6d3d1'
                                : '#34d399'
                            }
                            fontSize="9"
                            fontFamily="monospace"
                            textAnchor="middle"
                            fontWeight={isSelected ? 'bold' : 'normal'}
                          >
                            {node.rel}
                          </text>
                        </g>
                      </g>
                    );
                  })}

                  {/* Neighbor Nodes */}
                  {neighborNodes.map((node) => {
                    const isSelected = selectedLocalId === node.id;
                    return (
                      <g
                        key={node.id}
                        onClick={() => setSelectedLocalId(node.id)}
                        className="cursor-pointer"
                      >
                        {isSelected && (
                          <circle
                            cx={node.cx}
                            cy={node.cy}
                            r={node.r + 7}
                            fill="none"
                            stroke={node.color}
                            strokeWidth="1.5"
                            strokeOpacity="0.6"
                          />
                        )}
                        <circle
                          cx={node.cx}
                          cy={node.cy}
                          r={node.r}
                          fill={isSelected ? node.color : '#1b1c22'}
                          fillOpacity={isSelected ? '0.25' : '1'}
                          stroke={node.color}
                          strokeWidth={isSelected ? '3' : '2'}
                          strokeDasharray={node.type === 'ghost' ? '3 3' : undefined}
                        />
                        <text
                          x={node.cx}
                          y={node.labelY}
                          fill={isSelected ? '#ffffff' : '#e4e4e7'}
                          fontSize="11"
                          fontWeight={isSelected ? '700' : '600'}
                          textAnchor="middle"
                          fontFamily="sans-serif"
                        >
                          {node.label}
                        </text>
                        <text
                          x={node.cx}
                          y={node.cy + 3}
                          fill={
                            node.type === 'formal'
                              ? '#fbbf24'
                              : node.type === 'ghost'
                              ? '#a8a29e'
                              : '#34d399'
                          }
                          fontSize="8"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {node.type === 'formal' ? 'process' : node.type === 'ghost' ? 'ghost' : 'raw'}
                        </text>
                      </g>
                    );
                  })}

                  {/* Center Note Node */}
                  <g
                    onClick={() => setSelectedLocalId(centerNode.id)}
                    className="cursor-pointer"
                  >
                    {selectedLocalId === centerNode.id && (
                      <circle
                        cx={centerNode.cx}
                        cy={centerNode.cy}
                        r={centerNode.r + 8}
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="1.5"
                        strokeOpacity="0.6"
                      />
                    )}
                    <circle
                      cx={centerNode.cx}
                      cy={centerNode.cy}
                      r={centerNode.r}
                      fill="#287D54"
                      stroke="#ffffff"
                      strokeWidth={selectedLocalId === centerNode.id ? '3' : '2'}
                    />
                    <text
                      x={centerNode.cx}
                      y={centerNode.cy + 3}
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="sans-serif"
                    >
                      Backprop
                    </text>
                  </g>
                </svg>
              ) : (
                /* Global Vault Overview Mode (Interactive Multi-Cluster SVG) */
                <svg className="w-full max-w-2xl h-88 select-none" viewBox="0 0 650 320">
                  {/* Edges */}
                  {GLOBAL_EDGES.map((edge, idx) => {
                    const source = GLOBAL_NODES.find((n) => n.id === edge.from);
                    const target = GLOBAL_NODES.find((n) => n.id === edge.to);
                    if (!source || !target) return null;
                    const isConnectedToSelected =
                      selectedGlobalId === source.id || selectedGlobalId === target.id;
                    const stroke =
                      edge.style === 'formal'
                        ? '#f59e0b'
                        : edge.style === 'ghost'
                        ? '#a8a29e'
                        : '#10b981';
                    return (
                      <line
                        key={idx}
                        x1={source.cx}
                        y1={source.cy}
                        x2={target.cx}
                        y2={target.cy}
                        stroke={stroke}
                        strokeWidth={isConnectedToSelected ? '2.5' : '1.25'}
                        strokeDasharray={edge.style === 'ghost' ? '3 3' : undefined}
                        strokeOpacity={isConnectedToSelected ? '0.95' : '0.32'}
                      />
                    );
                  })}

                  {/* Nodes */}
                  {GLOBAL_NODES.map((node) => {
                    const isSelected = selectedGlobalId === node.id;
                    const color =
                      node.type === 'formal'
                        ? '#f59e0b'
                        : node.type === 'ghost'
                        ? '#a8a29e'
                        : '#10b981';
                    return (
                      <g
                        key={node.id}
                        onClick={() => setSelectedGlobalId(node.id)}
                        className="cursor-pointer"
                      >
                        {isSelected && (
                          <circle
                            cx={node.cx}
                            cy={node.cy}
                            r={node.r + 6}
                            fill="none"
                            stroke={color}
                            strokeWidth="1.5"
                            strokeOpacity="0.75"
                          />
                        )}
                        <circle
                          cx={node.cx}
                          cy={node.cy}
                          r={node.r}
                          fill={isSelected ? color : '#181920'}
                          fillOpacity={isSelected ? '0.35' : '1'}
                          stroke={color}
                          strokeWidth={isSelected ? '2.5' : '1.75'}
                          strokeDasharray={node.type === 'ghost' ? '3 3' : undefined}
                        />
                        <text
                          x={node.cx}
                          y={node.cy - node.r - 6}
                          fill={isSelected ? '#ffffff' : '#d4d4d8'}
                          fontSize="9.5"
                          fontWeight={isSelected ? '700' : '500'}
                          textAnchor="middle"
                          fontFamily="sans-serif"
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>

            {/* Selected Node Inspector Panel */}
            <div className="w-full lg:w-1/3 z-10">
              <div className="p-5 rounded-xl bg-[#16171d] border border-[#272a34] text-xs text-stone-300 shadow-xl space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-[#26262c] pb-2.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400">
                    Selected Node Inspector
                  </span>
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded border font-semibold ${
                      activeInfo.type === 'formal'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : activeInfo.type === 'ghost'
                        ? 'bg-stone-500/15 text-stone-300 border-stone-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {activeInfo.type === 'formal'
                      ? 'process/ Formal'
                      : activeInfo.type === 'ghost'
                      ? 'Phantom Node'
                      : 'raw/ Note'}
                  </span>
                </div>

                <div>
                  <div className="font-serif font-bold text-white text-base">
                    {activeInfo.label}
                  </div>
                  <div className="font-mono text-[11px] text-stone-400 mt-0.5">
                    {activeInfo.folder}
                  </div>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed">
                  {activeInfo.desc}
                </p>

                {activeInfo.rel && (
                  <div className="p-2.5 rounded-lg bg-[#111113] border border-[#26262c] space-y-1">
                    <div className="text-[10px] font-mono text-stone-400 uppercase">
                      Semantic Edge Relationship
                    </div>
                    <div className="font-mono text-xs text-emerald-400 font-semibold">
                      {viewMode === 'local'
                        ? `Backpropagation → ${activeInfo.rel} → ${activeInfo.label}`
                        : activeInfo.rel}
                    </div>
                    {activeInfo.context && (
                      <div className="text-[11px] font-mono text-stone-400 pt-1">
                        {activeInfo.context}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-1 flex items-center gap-1.5 text-[11px] text-stone-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    In the live workspace, clicking any node opens that note or expands to fullscreen with <kbd className="px-1.5 py-0.5 rounded bg-[#23242b] text-stone-200 font-mono text-[10px]">G</kbd>.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Graph Legend & Status */}
          <div className="px-5 py-3 bg-[#151518] border-t border-[#26262c] flex flex-wrap items-center justify-between gap-4 text-xs text-[#8e8e98]">
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Raw Note (<code className="font-mono text-[11px] text-stone-300">raw/</code>)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span>Synthesized Companion (<code className="font-mono text-[11px] text-stone-300">process/</code>)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border border-dashed border-stone-400 inline-block" />
                <span>Unwritten Target (Phantom Node)</span>
              </div>
            </div>

            <div className="font-mono text-[11px] text-stone-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-stone-500" />
              <span>2D Force-Directed Graph · Radial 1-Hop & Community Clustering</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
