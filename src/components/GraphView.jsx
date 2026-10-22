import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import ForceGraph2D from 'react-force-graph-2d';
import {
  Network,
  Globe,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Search,
  Compass,
  X,
  Maximize2,
  Minimize2,
  FileText
} from 'lucide-react';
import { forceCollide, forceCenter } from 'd3-force-3d';

export default function GraphView({
  graphData,
  globalGraphData,
  activeFileId,
  onSelectFile,
  showAILinks = true,
  onToggleShowAILinks,
  isFullscreen: externalIsFullscreen,
  onToggleFullscreen,
}) {
  const fgRef = useRef();
  const containerRef = useRef();
  const drawnLabelBoxesRef = useRef([]);
  const nodePositionsRef = useRef(new Map());
  const [dimensions, setDimensions] = useState({ width: 320, height: 270 });
  const [perspective, setPerspective] = useState('local'); // 'local' | 'global'
  const [hoveredNode, setHoveredNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [internalIsFullscreen, setInternalIsFullscreen] = useState(false);

  const isFullscreen = externalIsFullscreen !== undefined ? externalIsFullscreen : internalIsFullscreen;
  const setIsFullscreen = (val) => {
    const nextVal = typeof val === 'function' ? val(isFullscreen) : val;
    if (onToggleFullscreen) {
      onToggleFullscreen(nextVal);
    } else {
      setInternalIsFullscreen(nextVal);
    }
  };

  // Update canvas bounds dynamically for sidebar corner vs portal fullscreen
  const updateBounds = () => {
    if (isFullscreen) {
      setDimensions({
        width: window.innerWidth,
        height: Math.max(300, window.innerHeight - 52),
      });
    } else if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth || 320,
        height: Math.max(180, (containerRef.current.clientHeight || 288) - 40),
      });
    }
  };

  useEffect(() => {
    updateBounds();
    const handleResize = () => updateBounds();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen]);

  // When toggling fullscreen or perspective, adjust bounds & zoomToFit
  useEffect(() => {
    updateBounds();
    const timer = setTimeout(() => {
      updateBounds();
      fgRef.current?.d3ReheatSimulation?.();
      fgRef.current?.zoomToFit?.(380, isFullscreen ? 55 : 28);
    }, 120);
    return () => clearTimeout(timer);
  }, [isFullscreen, perspective]);

  // Escape key exits fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // When AI links toggle on/off, force instant canvas repaint & simulation reheat
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3ReheatSimulation?.();
      if (typeof fgRef.current.refresh === 'function') {
        fgRef.current.refresh();
      }
    }
  }, [showAILinks]);

  // Determine current active dataset based on perspective
  const activeDataset = perspective === 'global' ? globalGraphData : graphData;
  const nodes = Array.isArray(activeDataset?.nodes) ? activeDataset.nodes : [];
  const rawLinks = Array.isArray(activeDataset?.links)
    ? activeDataset.links
    : Array.isArray(activeDataset?.edges)
    ? activeDataset.edges
    : [];

  // Filter links based on showAILinks toggle
  const effectiveLinks = useMemo(() => {
    return rawLinks.filter((l) => {
      const isAI = l.status === 'pending' || Number(l.is_ai_suggested) === 1 || l.is_ai_suggested === true;
      if (!showAILinks && isAI) {
        return false;
      }
      return true;
    });
  }, [rawLinks, showAILinks]);

  // Compute safe graph data with layout annotations & AI link filtering
  // NOTE: hoveredNode is deliberately excluded from dependencies to prevent repoping/reheating on hover!
  const safeGraphData = useMemo(() => {
    let filteredNodes = nodes;
    if (perspective === 'local') {
      if (!showAILinks) {
        const connectedNodeIds = new Set();
        connectedNodeIds.add(String(activeFileId));
        effectiveLinks.forEach((l) => {
          const sId = typeof l.source === 'object' ? l.source.id : l.source;
          const tId = typeof l.target === 'object' ? l.target.id : l.target;
          if (sId !== undefined && sId !== null) connectedNodeIds.add(String(sId));
          if (tId !== undefined && tId !== null) connectedNodeIds.add(String(tId));
        });
        filteredNodes = nodes.filter((n) => connectedNodeIds.has(String(n.id)) || n.isCenter);
      }
    }

    const sorted = [...filteredNodes].sort((a, b) => {
      const aCenter = a.isCenter || a.id === activeFileId;
      const bCenter = b.isCenter || b.id === activeFileId;
      if (aCenter && !bCenter) return -1;
      if (!aCenter && bCenter) return 1;
      return (b.degree || 0) - (a.degree || 0);
    });

    return {
      nodes: sorted.map((n) => {
        const saved = nodePositionsRef.current.get(n.id);
        return {
          ...n,
          isCenter: n.isCenter || n.id === activeFileId,
          x: saved?.x ?? n.x,
          y: saved?.y ?? n.y,
          vx: saved?.vx ?? n.vx,
          vy: saved?.vy ?? n.vy,
        };
      }),
      links: effectiveLinks.map((e) => ({ ...e })),
    };
  }, [nodes, effectiveLinks, activeFileId, perspective, showAILinks]);

  // Apply Obsidian-like physical charge and spring forces
  // Only reconfigures when perspective changes (local vs global)
  useEffect(() => {
    if (fgRef.current && safeGraphData.nodes.length > 0) {
      try {
        const fg = fgRef.current;

        // 1. Center force: subtle centering so cluster floats comfortably in view
        fg.d3Force('center', forceCenter(0, 0));

        // 2. Repel force: Coulomb electrostatic repulsion (like charges pushing each other away)
        const charge = fg.d3Force('charge');
        if (charge) {
          if (perspective === 'local') {
            const count = safeGraphData.nodes.length;
            const centerRepel = count > 12 ? -360 : count > 6 ? -280 : -200;
            const nodeRepel = count > 12 ? -160 : count > 6 ? -120 : -90;
            charge
              .strength((node) => (node.isCenter ? centerRepel : nodeRepel))
              .distanceMin(25)
              .distanceMax(550);
          } else {
            charge
              .strength((node) => -60 - Math.min((node.degree || 0) * 14, 85))
              .distanceMin(15)
              .distanceMax(450);
          }
        }

        // 3. Link force: spring tension pulling connected notes gently
        const link = fg.d3Force('link');
        if (link) {
          const count = safeGraphData.nodes.length;
          const baselineDist = perspective === 'local'
            ? (isFullscreen ? (count > 12 ? 120 : 105) : (count > 12 ? 85 : 75))
            : 70;
          link
            .distance((l) => (l.relationship ? baselineDist + 15 : baselineDist))
            .strength(0.65);
        }

        // 4. Collision force: prevent nodes from ever overlapping each other physically
        fg.d3Force(
          'collide',
          forceCollide()
            .radius((node) => (node.isCenter ? (isFullscreen ? 32 : 24) : (isFullscreen ? 20 : 16)))
            .iterations(2)
        );

        fg.d3Force('radial', null);
        fg.d3ReheatSimulation();
      } catch (err) {
        console.warn('Graph force configuration error:', err);
      }
    }
  }, [perspective, isFullscreen]);

  // ZoomToFit smoothly when selecting a file, switching perspective, or toggling fullscreen
  useEffect(() => {
    const timer = setTimeout(() => {
      fgRef.current?.zoomToFit?.(320, isFullscreen ? 50 : 18);
    }, 140);
    return () => clearTimeout(timer);
  }, [activeFileId, perspective, isFullscreen]);

  const handleZoomIn = () => fgRef.current?.zoom?.(fgRef.current.zoom() * 1.3, 250);
  const handleZoomOut = () => fgRef.current?.zoom?.(fgRef.current.zoom() / 1.3, 250);
  const handleReset = () => {
    fgRef.current?.d3ReheatSimulation?.();
    fgRef.current?.zoomToFit?.(300, 30);
  };

  const activeNodeTitle = useMemo(() => {
    const target = nodes.find((n) => n.id === activeFileId);
    return target?.title || 'Selected Note';
  }, [nodes, activeFileId]);

  const graphContent = (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#111113] flex flex-col w-screen h-screen select-none animate-in fade-in duration-150'
          : 'h-72 bg-[#151518] border-b border-[#26262c] flex flex-col relative select-none shrink-0'
      }
    >
      {/* Header Toolbar */}
      {isFullscreen ? (
        /* MAXIMIZED HEADER - FULL TOOLBAR */
        <div className="h-13 px-5 bg-[#141417] border-b border-[#26262c] flex items-center justify-between shrink-0 gap-3">
          {/* Left Section: Title + Perspective Switcher + Metrics */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 pr-3 border-r border-[#26262c]">
              <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400">
                <Network className="w-4 h-4" />
              </div>
              <span className="font-semibold text-xs text-[#f4f4f5]">Vault Knowledge Graph</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25 font-semibold">
                Full Screen
              </span>
            </div>

            {/* Perspective Switcher - ONLY ON MAXIMIZED VIEW */}
            <div className="flex items-center p-0.5 bg-[#1b1b1f] border border-[#26262c] rounded-lg text-xs">
              <button
                onClick={() => {
                  setPerspective('local');
                  setSearchQuery('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  perspective === 'local'
                    ? 'bg-[#27272e] text-[#f4f4f5] shadow-sm'
                    : 'text-[#8e8e98] hover:text-[#d4d4d8]'
                }`}
                title="Local neighborhood of selected note"
              >
                <Compass className="w-3.5 h-3.5 text-purple-400" />
                <span>Local</span>
              </button>
              <button
                onClick={() => setPerspective('global')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  perspective === 'global'
                    ? 'bg-[#27272e] text-[#f4f4f5] shadow-sm'
                    : 'text-[#8e8e98] hover:text-[#d4d4d8]'
                }`}
                title="Full global graph of all notes and clusters in vault"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Global</span>
              </button>
            </div>

            <span className="text-xs text-[#71717a] font-mono hidden md:inline">
              {safeGraphData.nodes.length} notes • {safeGraphData.links.length} connections
            </span>
          </div>

          {/* Right Section: Search, AI Toggle, Zoom Controls, Minimize */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Search Bar */}
            <div className="flex items-center bg-[#1c1c20] border border-[#2e2e36] focus-within:border-purple-500/50 rounded-lg px-2.5 py-1">
              <Search className="w-3.5 h-3.5 text-purple-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find note in graph..."
                className="w-36 md:w-52 bg-transparent text-xs text-[#f4f4f5] focus:outline-none placeholder-[#71717a]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-0.5 text-[#71717a] hover:text-[#f4f4f5] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* AI Recommended Links Toggle */}
            {onToggleShowAILinks && (
              <button
                onClick={() => onToggleShowAILinks(!showAILinks)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border transition-all cursor-pointer ${
                  showAILinks
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-[#1b1b1f] text-[#71717a] border-[#2e2e36] hover:text-[#a1a1aa]'
                }`}
                title={`Toggle AI recommended links on graph (Currently ${showAILinks ? 'ON' : 'OFF'})`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${showAILinks ? 'bg-amber-400 animate-pulse' : 'bg-[#52525b]'}`} />
                <span>AI Graph: {showAILinks ? 'ON' : 'OFF'}</span>
              </button>
            )}

            {/* Zoom In, Zoom Out, Reset - ONLY ON MAXIMIZED VIEW */}
            <div className="flex items-center gap-1 border-l border-[#26262c] pl-2">
              <button
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-[#232328] text-[#8e8e98] hover:text-[#f4f4f5] rounded-md transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-[#232328] text-[#8e8e98] hover:text-[#f4f4f5] rounded-md transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleReset}
                className="p-1.5 hover:bg-[#232328] text-[#8e8e98] hover:text-[#f4f4f5] rounded-md transition-colors cursor-pointer"
                title="Reset Graph Layout"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Minimize / Exit Fullscreen Button */}
            <button
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#27272e] hover:bg-[#34343d] text-[#f4f4f5] border border-[#3e3e4a] rounded-lg text-xs font-semibold transition-all shadow-sm ml-1 cursor-pointer"
              title="Minimize back to sidebar (Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Minimize (Esc)</span>
            </button>
          </div>
        </div>
      ) : (
        /* MINIMIZED HEADER - CLEAN & PRISTINE (NO ZOOM, NO DEPTH, NO LOCAL/GLOBAL) */
        <div className="h-10 px-3.5 bg-[#121214] border-b border-[#26262c] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Network className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-semibold text-xs text-[#f4f4f5]">Graph View</span>
          </div>

          <button
            onClick={() => setIsFullscreen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1e1e24] hover:bg-[#282832] text-[#d4d4d8] hover:text-[#f4f4f5] border border-[#2e2e36] text-[11px] font-medium transition-all shadow-sm cursor-pointer"
            title="Expand to Full Screen Graph (G)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Maximize</span>
          </button>
        </div>
      )}

      {/* Canvas or Empty State */}
      {nodes.length === 0 ? (
        <div className="flex-1 bg-[#131316] flex flex-col items-center justify-center p-4 text-center">
          <Network className="w-8 h-8 mb-2 text-[#3f3f46] animate-pulse" />
          <p className="text-xs font-medium text-[#a1a1aa]">
            {perspective === 'local' ? 'No connections for this note' : 'No graphable notes in vault'}
          </p>
          <p className="text-[11px] text-[#71717a] mt-1 max-w-[220px]">
            {perspective === 'local'
              ? 'Add [[wikilinks]] or discover AI relationships in the inspector below.'
              : 'Create notes and links to visualize your knowledge graph clusters.'}
          </p>
        </div>
      ) : (
        <div className="flex-1 w-full relative overflow-hidden bg-[#131316]">
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={safeGraphData}
            backgroundColor="#131316"
            nodeRelSize={4.5}
            nodeVal={(node) => (node.isCenter ? 9 : node.degree ? 3 + Math.min(node.degree, 8) : 3.5)}
            nodeLabel=""
            d3VelocityDecay={0.28}
            d3AlphaDecay={0.02}
            cooldownTicks={120}
            onNodeHover={(node) => setHoveredNode(node || null)}
            enableNodeDrag={true}
            onNodeDrag={(node) => {
              // Pin node firmly to cursor coordinates while dragging
              node.fx = node.x;
              node.fy = node.y;
            }}
            onNodeDragEnd={(node) => {
              // Fluid release: clear pinned coordinates so it floats organically
              node.fx = null;
              node.fy = null;
              fgRef.current?.d3ReheatSimulation?.();
            }}
            nodeCanvasObject={(node, ctx, globalScale) => {
              // Cache live coordinates to prevent jumping
              if (node.x !== undefined && node.y !== undefined) {
                nodePositionsRef.current.set(node.id, {
                  x: node.x,
                  y: node.y,
                  vx: node.vx,
                  vy: node.vy,
                });
              }

              // Reset collision bounding box registry on first node of each frame
              if (node === safeGraphData.nodes[0]) {
                drawnLabelBoxesRef.current = [];
              }

              const isCenter = node.isCenter || node.id === activeFileId;
              const isHovered = hoveredNode && hoveredNode.id === node.id;
              const isUnresolved = node.isUnresolved;
              const isMatch =
                searchQuery &&
                node.title &&
                node.title.toLowerCase().includes(searchQuery.toLowerCase().trim());

              // Node radius: compact, sleek Obsidian sizing
              const baseR = isCenter ? 5.8 : isHovered ? 5.2 : isUnresolved ? 3.2 : 3.8;
              const displayLabel = node.title || 'Untitled';

              // 1. Halo aura on Hover, Center, or Search match
              if (isHovered || isCenter || isMatch) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, baseR + (isCenter ? 4.5 : 3.5), 0, 2 * Math.PI, false);
                ctx.fillStyle = isMatch
                  ? 'rgba(234, 179, 8, 0.28)'
                  : isCenter
                  ? 'rgba(167, 139, 250, 0.32)'
                  : 'rgba(139, 92, 246, 0.22)';
                ctx.fill();
              }

              // 2. Node Circle Fill
              ctx.beginPath();
              ctx.arc(node.x, node.y, baseR, 0, 2 * Math.PI, false);

              if (isCenter) {
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                ctx.shadowBlur = 8;
              } else if (isMatch) {
                ctx.fillStyle = '#fde047';
                ctx.shadowColor = '#fde047';
                ctx.shadowBlur = 5;
              } else if (isUnresolved) {
                ctx.fillStyle = '#52525b';
                ctx.shadowBlur = 0;
              } else if (perspective === 'global') {
                if ((node.degree || 0) >= 3) {
                  ctx.fillStyle = '#c4b5fd';
                  ctx.shadowColor = '#a78bfa';
                  ctx.shadowBlur = 3;
                } else if ((node.degree || 0) >= 1) {
                  ctx.fillStyle = '#e4e4e7';
                  ctx.shadowBlur = 0;
                } else {
                  ctx.fillStyle = '#71717a';
                  ctx.shadowBlur = 0;
                }
              } else {
                ctx.fillStyle = isHovered ? '#ffffff' : '#c4b5fd';
                ctx.shadowBlur = isHovered ? 3 : 0;
                ctx.shadowColor = '#c4b5fd';
              }
              ctx.fill();
              ctx.shadowBlur = 0;

              // 3. Label Text & Non-Overlapping Pill Engine
              // RULES:
              // - In Local view & Fullscreen: Show labels with collision avoidance
              // - In Global view: Priority given to Hovered, Center, Search match, and high-degree hubs
              const shouldAttemptLabel = isFullscreen
                ? true
                : perspective === 'local' || isHovered || isCenter || isMatch;

              if (shouldAttemptLabel) {
                const fontSize = Math.max(3.2, Math.min(4.8, 9.5 / (globalScale || 1)));
                ctx.font = `500 ${fontSize}px Inter, -apple-system, sans-serif`;
                const textWidth = ctx.measureText(displayLabel).width;
                const pillPadX = 3.5;
                const pillPadY = 1.2;
                const pillW = textWidth + pillPadX * 2;
                const pillH = fontSize + pillPadY * 2;
                const pillX = node.x - pillW / 2;
                const pillY = node.y + baseR + 2.0;

                const myBox = {
                  x1: pillX - 2,
                  y1: pillY - 2,
                  x2: pillX + pillW + 2,
                  y2: pillY + pillH + 2,
                };

                // Check collision against previously drawn label boxes
                const hasCollision = drawnLabelBoxesRef.current.some(
                  (b) => !(myBox.x2 < b.x1 || myBox.x1 > b.x2 || myBox.y2 < b.y1 || myBox.y1 > b.y2)
                );

                // Priority: Hovered, Center, and Search matches always draw
                // Other nodes are HIDDEN if they would overlap with an existing label!
                const isHighPriority = isHovered || isCenter || isMatch;

                if (isHighPriority || !hasCollision) {
                  drawnLabelBoxesRef.current.push(myBox);

                  // Pill Background
                  ctx.fillStyle = isCenter
                    ? 'rgba(24, 24, 28, 0.94)'
                    : isMatch
                    ? 'rgba(40, 32, 10, 0.94)'
                    : isHovered
                    ? 'rgba(26, 26, 32, 0.96)'
                    : 'rgba(18, 18, 22, 0.88)';
                  ctx.beginPath();
                  if (typeof ctx.roundRect === 'function') {
                    ctx.roundRect(pillX, pillY, pillW, pillH, 2.5);
                  } else {
                    ctx.rect(pillX, pillY, pillW, pillH);
                  }
                  ctx.fill();

                  // Pill Border
                  ctx.strokeStyle = isCenter
                    ? 'rgba(167, 139, 250, 0.6)'
                    : isMatch
                    ? 'rgba(234, 179, 8, 0.7)'
                    : isHovered
                    ? 'rgba(196, 181, 253, 0.7)'
                    : 'rgba(255, 255, 255, 0.08)';
                  ctx.lineWidth = 0.7 / (globalScale || 1);
                  ctx.stroke();

                  // Label Text
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = isCenter
                    ? '#ffffff'
                    : isMatch
                    ? '#fef08a'
                    : isHovered
                    ? '#ffffff'
                    : isUnresolved
                    ? '#a1a1aa'
                    : '#d4d4d8';
                  ctx.fillText(displayLabel, node.x, pillY + pillH / 2);
                }
              }
            }}
            nodePointerAreaPaint={(node, color, ctx) => {
              const r = node.isCenter ? 12 : 9;
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
              ctx.fill();
            }}
            linkCanvasObject={(link, ctx, globalScale) => {
              const start = typeof link.source === 'object' ? link.source : null;
              const end = typeof link.target === 'object' ? link.target : null;

              if (
                !start ||
                !end ||
                start.x === undefined ||
                start.y === undefined ||
                end.x === undefined ||
                end.y === undefined
              ) {
                return;
              }

              const isPending = link.status === 'pending' || Number(link.is_ai_suggested) === 1 || link.is_ai_suggested === true;
              
              // If AI links are turned OFF, do not draw pending AI links
              if (!showAILinks && isPending) {
                return;
              }

              const isHoverConnected =
                hoveredNode &&
                (hoveredNode.id === start.id || hoveredNode.id === end.id);

              ctx.beginPath();
              ctx.moveTo(start.x, start.y);
              ctx.lineTo(end.x, end.y);

              if (isPending) {
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = (isHoverConnected ? 1.6 : 1.2) / (globalScale || 1);
                ctx.setLineDash([3, 3]);
              } else {
                ctx.strokeStyle = isHoverConnected
                  ? '#a78bfa'
                  : 'rgba(113, 113, 122, 0.32)';
                ctx.lineWidth = (isHoverConnected ? 1.5 : 0.9) / (globalScale || 1);
                ctx.setLineDash([]);
              }

              ctx.stroke();

              // 2. Edge Relationship / Connection Value Label
              // Clearly visible on the graph when relationship exists!
              const relText = link.relationship
                ? String(link.relationship).replace(/_/g, ' ')
                : (perspective === 'local' && isHoverConnected ? 'links to' : null);

              if (relText) {
                const shouldShowRel =
                  perspective === 'local' ||
                  isFullscreen ||
                  isHoverConnected ||
                  (globalScale || 1) >= 0.65;

                if (shouldShowRel) {
                  const t = 0.5;
                  const midX = start.x * (1 - t) + end.x * t;
                  const midY = start.y * (1 - t) + end.y * t;
                  const relFontSize = Math.max(2.6, Math.min(4.0, 8.0 / (globalScale || 1)));
                  ctx.font = `500 ${relFontSize}px Inter, -apple-system, sans-serif`;

                  const textMetrics = ctx.measureText(relText);
                  const padX = 3.2;
                  const padY = 1.0;
                  const rw = textMetrics.width + padX * 2;
                  const rh = relFontSize + padY * 2;
                  const rx = midX - rw / 2;
                  const ry = midY - rh / 2;

                  ctx.fillStyle = isPending
                    ? 'rgba(34, 25, 12, 0.94)'
                    : isHoverConnected
                    ? 'rgba(28, 22, 45, 0.96)'
                    : 'rgba(18, 18, 22, 0.90)';

                  ctx.beginPath();
                  if (typeof ctx.roundRect === 'function') {
                    ctx.roundRect(rx, ry, rw, rh, 2.5);
                  } else {
                    ctx.rect(rx, ry, rw, rh);
                  }
                  ctx.fill();

                  ctx.strokeStyle = isPending
                    ? 'rgba(245, 158, 11, 0.7)'
                    : isHoverConnected
                    ? 'rgba(167, 139, 250, 0.7)'
                    : 'rgba(255, 255, 255, 0.12)';
                  ctx.lineWidth = 0.75 / (globalScale || 1);
                  ctx.stroke();

                  ctx.fillStyle = isPending
                    ? '#fbbf24'
                    : isHoverConnected
                    ? '#ffffff'
                    : '#d4d4d8';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(relText, midX, midY);
                }
              }
            }}
            onNodeClick={(node) => {
              if (node.id && typeof node.id === 'number') {
                onSelectFile(node.id);
              }
            }}
          />

          {/* Floating Note Navigator when in Fullscreen */}
          {isFullscreen && activeFileId && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#17171a]/95 backdrop-blur-md border border-[#2e2e36] rounded-xl shadow-2xl flex items-center gap-3.5 text-xs text-[#d4d4d8] animate-in fade-in slide-in-from-bottom-2 duration-150 z-10 pointer-events-auto">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  Active Note: <strong className="text-[#f4f4f5]">{activeNodeTitle}</strong>
                </span>
              </div>
              <button
                onClick={() => setIsFullscreen(false)}
                className="px-3 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded-lg font-medium text-[11px] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Exit full screen and edit this note"
              >
                <span>Open in Editor</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // When isFullscreen is true, render a placeholder in the sidebar and portal the full screen graph to document.body
  if (isFullscreen) {
    return (
      <>
        <div className="h-72 bg-[#121214] border-b border-[#26262c] flex flex-col items-center justify-center p-4 text-center select-none shrink-0">
          <Network className="w-6 h-6 text-purple-400/60 mb-2 animate-pulse" />
          <span className="text-xs font-medium text-[#a1a1aa]">Graph View Maximized</span>
          <span className="text-[11px] text-[#52525b] mt-0.5">Press Esc or click Minimize to exit full screen</span>
        </div>
        {createPortal(graphContent, document.body)}
      </>
    );
  }

  return graphContent;
}
