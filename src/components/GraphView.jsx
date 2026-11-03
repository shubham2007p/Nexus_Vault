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
  FileText,
  ChevronDown,
  Sparkles,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { forceCollide, forceCenter } from 'd3-force-3d';

function getNodeTitle(node) {
  return node?.title || node?.name || 'Untitled';
}

function isGhostNode(node) {
  return Boolean(
    node?.isGhost ||
      node?.isUnresolved ||
      node?.note_type === 'ghost' ||
      (typeof node?.id === 'string' && node.id.startsWith('ghost'))
  );
}

export default function GraphView({
  graphData,
  globalGraphData,
  activeFileId,
  activeConversationId,
  conversationMessages = [],
  workspaceMode = 'notes',
  onSelectFile,
  showAILinks = true,
  onToggleShowAILinks,
  isFullscreen: externalIsFullscreen,
  onToggleFullscreen,
  theme = 'light',
  onCloseRightPanel,
}) {
  const fgRef = useRef();
  const containerRef = useRef();
  const drawnLabelBoxesRef = useRef([]);
  const nodePositionsRef = useRef(new Map());
  const [dimensions, setDimensions] = useState({ width: 320, height: 252 });
  const [graphMode, setGraphMode] = useState(workspaceMode === 'chattyfi' ? 'conversation' : 'notes'); // 'notes' | 'knowledge' | 'conversation'
  const [perspective, setPerspective] = useState('local'); // 'local' | 'global'
  const [knowledgeGraphData, setKnowledgeGraphData] = useState({ nodes: [], edges: [], links: [] });
  const [conversationGraphData, setConversationGraphData] = useState({ nodes: [], edges: [], links: [] });
  const [isLoadingModeData, setIsLoadingModeData] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedChatNode, setSelectedChatNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [internalIsFullscreen, setInternalIsFullscreen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isDark = theme === 'dark';

  const isFullscreen = externalIsFullscreen !== undefined ? externalIsFullscreen : internalIsFullscreen;
  const setIsFullscreen = (val) => {
    const nextVal = typeof val === 'function' ? val(isFullscreen) : val;
    if (onToggleFullscreen) {
      onToggleFullscreen(nextVal);
    } else {
      setInternalIsFullscreen(nextVal);
    }
  };

  // Synchronize graphMode with workspaceMode
  useEffect(() => {
    if (workspaceMode === 'chattyfi') {
      setGraphMode('conversation');
    } else {
      setGraphMode('notes');
    }
  }, [workspaceMode]);

  // Update canvas bounds dynamically for sidebar corner vs portal fullscreen
  const updateBounds = () => {
    if (isFullscreen) {
      setDimensions({
        width: window.innerWidth,
        height: Math.max(300, window.innerHeight - 52),
      });
    } else if (containerRef.current) {
      const headerH = 36;
      const isChattyFi = workspaceMode === 'chattyfi';
      const availableH = containerRef.current.parentElement?.clientHeight || containerRef.current.clientHeight || 500;
      const totalH = isCollapsed ? 36 : (isChattyFi ? Math.max(288, availableH) : 288);
      setDimensions({
        width: containerRef.current.clientWidth || 320,
        height: Math.max(100, totalH - headerH),
      });
    }
  };

  useEffect(() => {
    updateBounds();
    const handleResize = () => updateBounds();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen, workspaceMode, isCollapsed]);

  // When collapsing / expanding the graph in sidebar, smoothly recalculate bounds
  useEffect(() => {
    if (!isFullscreen) {
      updateBounds();
      if (!isCollapsed) {
        const timer = setTimeout(() => {
          updateBounds();
          fgRef.current?.d3ReheatSimulation?.();
          fgRef.current?.zoomToFit?.(220, 16);
        }, 80);
        return () => clearTimeout(timer);
      }
    }
  }, [isCollapsed, workspaceMode]);

  // Fetch data for Knowledge Graph or Conversation Graph when selected or updated
  useEffect(() => {
    if (graphMode === 'knowledge') {
      setIsLoadingModeData(true);
      fetch('/api/knowledge-graph')
        .then((res) => (res.ok ? res.json() : { nodes: [], edges: [], links: [] }))
        .then((data) => setKnowledgeGraphData(data))
        .catch((err) => console.error('Error fetching knowledge graph:', err))
        .finally(() => setIsLoadingModeData(false));
    } else if (graphMode === 'conversation') {
      if (activeConversationId) {
        setIsLoadingModeData(true);
        fetch(`/api/chattyfi/conversations/${activeConversationId}/graph`)
          .then((res) => (res.ok ? res.json() : { nodes: [], edges: [], links: [] }))
          .then((data) => {
            setConversationGraphData(data);
            setTimeout(() => {
              fgRef.current?.d3ReheatSimulation?.();
              fgRef.current?.zoomToFit?.(280, 20);
            }, 60);
          })
          .catch((err) => console.error('Error fetching conversation graph:', err))
          .finally(() => setIsLoadingModeData(false));
      } else {
        setConversationGraphData({ nodes: [], edges: [], links: [] });
      }
    }
  }, [graphMode, activeConversationId, conversationMessages?.length]);

  // When toggling fullscreen, perspective, or graph mode, adjust bounds & zoomToFit
  useEffect(() => {
    updateBounds();
    const timer = setTimeout(() => {
      updateBounds();
      fgRef.current?.d3ReheatSimulation?.();
      fgRef.current?.zoomToFit?.(320, isFullscreen ? 55 : 18);
    }, 120);
    return () => clearTimeout(timer);
  }, [isFullscreen, perspective, graphMode]);

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

  // Determine current active dataset based on graphMode and perspective
  const activeDataset = useMemo(() => {
    if (graphMode === 'knowledge') {
      return knowledgeGraphData;
    }
    if (graphMode === 'conversation') {
      return conversationGraphData;
    }
    return perspective === 'global' ? globalGraphData : graphData;
  }, [graphMode, perspective, knowledgeGraphData, conversationGraphData, globalGraphData, graphData]);

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
    if (graphMode === 'notes' && perspective === 'local') {
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
        const resolvedTitle = getNodeTitle(n);
        const unresolved = isGhostNode(n);
        return {
          ...n,
          title: resolvedTitle,
          name: n.name || resolvedTitle,
          isGhost: unresolved,
          isUnresolved: unresolved,
          isCenter: n.isCenter || n.id === activeFileId,
          x: saved?.x ?? n.x,
          y: saved?.y ?? n.y,
          vx: saved?.vx ?? n.vx,
          vy: saved?.vy ?? n.vy,
        };
      }),
      links: effectiveLinks.map((e) => ({ ...e })),
    };
  }, [nodes, effectiveLinks, activeFileId, perspective, showAILinks, graphMode]);

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
            const centerRepel = isFullscreen
              ? (count > 12 ? -360 : count > 6 ? -280 : -200)
              : (count > 12 ? -150 : count > 6 ? -110 : -80);
            const nodeRepel = isFullscreen
              ? (count > 12 ? -160 : count > 6 ? -120 : -90)
              : (count > 12 ? -70 : count > 6 ? -50 : -35);
            charge
              .strength((node) => (node.isCenter ? centerRepel : nodeRepel))
              .distanceMin(12)
              .distanceMax(isFullscreen ? 550 : 250);
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
            ? (isFullscreen ? (count > 12 ? 120 : 105) : (count > 12 ? 50 : 42))
            : 70;
          link
            .distance((l) => (l.relationship ? baselineDist + (isFullscreen ? 15 : 6) : baselineDist))
            .strength(0.7);
        }

        // 4. Collision force: prevent nodes from ever overlapping each other physically
        fg.d3Force(
          'collide',
          forceCollide()
            .radius((node) => (node.isCenter ? (isFullscreen ? 32 : 16) : (isFullscreen ? 20 : 11)))
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
    return target ? getNodeTitle(target) : 'Selected Note';
  }, [nodes, activeFileId]);

  const graphContent = (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#111113] flex flex-col w-screen h-screen select-none animate-in fade-in duration-150'
          : `${isCollapsed ? 'h-9' : (workspaceMode === 'chattyfi' ? 'flex-1 h-full' : 'h-72')} bg-[#F7F7F4] dark:bg-[#15161A] border-b border-[#E3E5DF] dark:border-[#272A32] flex flex-col relative select-none shrink-0 transition-all duration-150`
      }
    >
      {/* Header Toolbar */}
      {isFullscreen ? (
        /* MAXIMIZED HEADER - FULL TOOLBAR */
        <div className="h-13 px-5 bg-[#141417] border-b border-[#26262c] flex items-center justify-between shrink-0 gap-3">
          {/* Left Section: Title + 3-Way Graph Mode Switcher + Metrics */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 pr-3 border-r border-[#26262c]">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <Network className="w-4 h-4" />
              </div>
              <span className="font-semibold text-xs text-[#f4f4f5]">Vault Knowledge Graph</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25 font-semibold">
                Full Screen
              </span>
            </div>

            {/* 3-Way Graph Mode Switcher */}
            <div className="flex items-center p-0.5 bg-[#1b1b1f] border border-[#26262c] rounded-lg text-xs">
              <button
                onClick={() => {
                  setGraphMode('notes');
                  setSearchQuery('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  graphMode === 'notes'
                    ? 'bg-[#27272e] text-[#f4f4f5] shadow-xs'
                    : 'text-[#8e8e98] hover:text-[#d4d4d8]'
                }`}
                title="Vault Notes Graph: documents and wiki links"
              >
                <Network className="w-3.5 h-3.5 text-emerald-400" />
                <span>Notes Graph</span>
              </button>
              <button
                onClick={() => {
                  setGraphMode('knowledge');
                  setSearchQuery('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  graphMode === 'knowledge'
                    ? 'bg-[#27272e] text-[#f4f4f5] shadow-xs'
                    : 'text-[#8e8e98] hover:text-[#d4d4d8]'
                }`}
                title="Persistent Knowledge Graph: canonical topics and subtopics"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Knowledge Graph</span>
              </button>
              <button
                onClick={() => {
                  setGraphMode('conversation');
                  setSearchQuery('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  graphMode === 'conversation'
                    ? 'bg-[#27272e] text-[#f4f4f5] shadow-xs'
                    : 'text-[#8e8e98] hover:text-[#d4d4d8]'
                }`}
                title="Conversation Graph: current discussion topics and captured notes"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                <span>Conversation Graph</span>
              </button>
            </div>

            {/* Sub-perspective Switcher for Notes Graph */}
            {graphMode === 'notes' && (
              <div className="flex items-center p-0.5 bg-[#1b1b1f] border border-[#26262c] rounded-lg text-xs">
                <button
                  onClick={() => {
                    setPerspective('local');
                    setSearchQuery('');
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                    perspective === 'local'
                      ? 'bg-[#27272e] text-[#f4f4f5] shadow-xs'
                      : 'text-[#8e8e98] hover:text-[#d4d4d8]'
                  }`}
                  title="Local neighborhood of selected note"
                >
                  <Compass className="w-3 h-3 text-emerald-400" />
                  <span>Local</span>
                </button>
                <button
                  onClick={() => setPerspective('global')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                    perspective === 'global'
                      ? 'bg-[#27272e] text-[#f4f4f5] shadow-xs'
                      : 'text-[#8e8e98] hover:text-[#d4d4d8]'
                  }`}
                  title="Full global graph of all notes and clusters in vault"
                >
                  <Globe className="w-3 h-3 text-indigo-400" />
                  <span>Global</span>
                </button>
              </div>
            )}

            <span className="text-xs text-[#71717a] font-mono hidden md:inline">
              {isLoadingModeData ? (
                <span className="inline-flex items-center gap-1 text-purple-400">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                </span>
              ) : (
                `${safeGraphData.nodes.length} nodes • ${safeGraphData.links.length} connections`
              )}
            </span>
          </div>

          {/* Right Section: Search, AI Toggle, Zoom Controls, Minimize */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Search Bar */}
            <div className="flex items-center bg-[#1c1c20] border border-[#2e2e36] focus-within:border-emerald-500/50 rounded-lg px-2.5 py-1">
              <Search className="w-3.5 h-3.5 text-emerald-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find node in graph..."
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
        /* MINIMIZED HEADER - COMPACT & CLEAN (h-9) */
        <div className="h-9 px-3 bg-[#F0F1ED] dark:bg-[#17181C] border-b border-[#E3E5DF] dark:border-[#272A32] flex items-center justify-between shrink-0 transition-colors">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 -ml-1 text-[#4A4F49] dark:text-[#A1A1AA] hover:text-[#242824] dark:hover:text-[#F4F4F5] rounded transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand graph view' : 'Collapse graph view'}
              aria-label={isCollapsed ? 'Expand graph view' : 'Collapse graph view'}
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
            </button>
            <Network className="w-3.5 h-3.5 text-[#287D54] dark:text-[#2EA468]" />
            <span className="font-semibold text-xs text-[#242824] dark:text-[#F4F4F5]">Graph</span>
            
            {/* Mode Indicator / Switcher */}
            {workspaceMode === 'chattyfi' ? (
              <div className="flex items-center gap-1.5 ml-1">
                <span className="font-semibold text-xs text-[#287D54] dark:text-[#2EA468]">
                  Chat Context
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium font-mono">
                  Local
                </span>
              </div>
            ) : (
              <div className="flex items-center p-0.5 bg-[#E3E5DF] dark:bg-[#202126] rounded-md text-[10px] ml-1">
                <button
                  onClick={() => setGraphMode('notes')}
                  className={`px-1.5 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                    graphMode === 'notes'
                      ? 'bg-white dark:bg-[#2C2D35] text-[#242824] dark:text-[#F4F4F5] shadow-2xs'
                      : 'text-[#666B65] dark:text-[#8E8E98] hover:text-[#242824]'
                  }`}
                  title="Notes Graph"
                >
                  Notes
                </button>
                <button
                  onClick={() => setGraphMode('knowledge')}
                  className={`px-1.5 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                    graphMode === 'knowledge'
                      ? 'bg-white dark:bg-[#2C2D35] text-[#242824] dark:text-[#F4F4F5] shadow-2xs'
                      : 'text-[#666B65] dark:text-[#8E8E98] hover:text-[#242824]'
                  }`}
                  title="Persistent Knowledge Graph"
                >
                  Topics
                </button>
              </div>
            )}

            {safeGraphData.nodes.length > 0 && (
              <span className="text-[11px] font-mono text-[#4A4F49] dark:text-[#A1A1AA]">
                ({safeGraphData.nodes.length})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-[#1E1E24] hover:bg-[#E8EAE4] dark:hover:bg-[#282832] text-[#242824] dark:text-[#D4D4D8] border border-[#E3E5DF] dark:border-[#2E2E36] text-xs font-medium transition-all shadow-2xs cursor-pointer"
              title="Expand to Fullscreen Graph (G)"
            >
              <Maximize2 className="w-3 h-3 text-[#287D54] dark:text-[#2EA468]" />
              <span>Fullscreen</span>
            </button>
            {onCloseRightPanel && (
              <button
                onClick={onCloseRightPanel}
                className="lg:hidden p-1 text-[#4A4F49] dark:text-[#A1A1AA] hover:text-[#242824] dark:hover:text-white rounded"
                title="Close right drawer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Canvas or Empty State (Hidden when collapsed) */}
      {!isCollapsed && (
        nodes.length === 0 ? (
          <div className="flex-1 bg-[#F7F7F4] dark:bg-[#15161A] flex flex-col items-center justify-center p-4 text-center transition-colors">
            {graphMode === 'conversation' ? (
              <MessageSquare className="w-6 h-6 mb-2 text-blue-500/70" />
            ) : graphMode === 'knowledge' ? (
              <Sparkles className="w-6 h-6 mb-2 text-purple-500/70" />
            ) : (
              <Network className="w-6 h-6 mb-2 text-[#4A4F49] dark:text-[#52525B]" />
            )}
            <p className="text-xs font-semibold text-[#242824] dark:text-[#F4F4F5]">
              {graphMode === 'conversation'
                ? (!activeConversationId ? 'No active conversation' : 'Conversation graph empty')
                : graphMode === 'knowledge'
                ? 'No persistent topics yet'
                : perspective === 'local'
                ? 'No connections'
                : 'No graphable notes'}
            </p>
            <p className="text-xs text-[#4A4F49] dark:text-[#A1A1AA] mt-1 max-w-[240px]">
              {graphMode === 'conversation'
                ? (!activeConversationId
                    ? 'Select or start a conversation to view its concept graph.'
                    : 'Discuss or capture insights to map concepts explored in this chat.')
                : graphMode === 'knowledge'
                ? 'Capture conversation insights to construct canonical knowledge topics.'
                : perspective === 'local'
                ? 'Add [[wikilinks]] or discover AI links below.'
                : 'Create notes to visualize clusters.'}
            </p>
          </div>
        ) : (
          <div className="flex-1 w-full relative overflow-hidden bg-[#F7F7F4] dark:bg-[#15161A] transition-colors">
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={safeGraphData}
            backgroundColor={isDark ? '#15161A' : '#F7F7F4'}
            nodeRelSize={4.5}
            nodeVal={(node) => (node.isCenter ? 9 : node.degree ? 3 + Math.min(node.degree, 8) : 3.5)}
            nodeLabel=""
            d3VelocityDecay={0.28}
            d3AlphaDecay={0.02}
            cooldownTicks={120}
            onNodeHover={(node) => setHoveredNode(node || null)}
            enableNodeDrag={true}
            onNodeDrag={(node) => {
              node.fx = node.x;
              node.fy = node.y;
            }}
            onNodeDragEnd={(node) => {
              node.fx = null;
              node.fy = null;
              fgRef.current?.d3ReheatSimulation?.();
            }}
            nodeCanvasObject={(node, ctx, globalScale) => {
              if (node.x !== undefined && node.y !== undefined) {
                nodePositionsRef.current.set(node.id, {
                  x: node.x,
                  y: node.y,
                  vx: node.vx,
                  vy: node.vy,
                });
              }

              if (node === safeGraphData.nodes[0]) {
                drawnLabelBoxesRef.current = [];
              }

              const isCenter = node.isCenter || node.id === activeFileId;
              const isHovered = hoveredNode && hoveredNode.id === node.id;
              const isUnresolved = isGhostNode(node);
              const nodeTitle = getNodeTitle(node);
              const isMatch =
                Boolean(searchQuery) &&
                nodeTitle.toLowerCase().includes(searchQuery.toLowerCase().trim());

              const isTopic = node.type === 'persistent_topic' || node.type === 'conversation_topic';
              const isSubtopic = node.type === 'subtopic';
              const isCapturedNote = node.type === 'captured_note';
              const baseR = isTopic
                ? (isFullscreen ? 7.2 : 5.8)
                : isCenter
                ? 5.8
                : isHovered
                ? 5.2
                : isUnresolved
                ? 3.2
                : isSubtopic
                ? 3.6
                : 4.0;
              const displayLabel = nodeTitle;

              // 1. Subtle Selection Ring (Quiet, No Blurry Glow)
              if (isHovered || isCenter || isMatch) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, baseR + (isCenter ? 4 : 3), 0, 2 * Math.PI, false);
                ctx.fillStyle = isMatch
                  ? 'rgba(231, 162, 59, 0.2)'
                  : isCenter
                  ? (isDark ? 'rgba(46, 164, 104, 0.25)' : 'rgba(40, 125, 84, 0.15)')
                  : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)');
                ctx.fill();
              }

              // 2. Node Circle Fill
              ctx.beginPath();
              ctx.arc(node.x, node.y, baseR, 0, 2 * Math.PI, false);
              ctx.shadowBlur = 0; // Pure zero glow for crisp reading

              if (isCenter) {
                ctx.fillStyle = isDark ? '#2EA468' : '#287D54';
              } else if (isMatch) {
                ctx.fillStyle = '#E7A23B';
              } else if (isUnresolved) {
                ctx.fillStyle = isDark ? '#52525B' : '#9CA3AF';
              } else if (isTopic) {
                ctx.fillStyle = isDark ? '#A78BFA' : '#7C3AED';
              } else if (isSubtopic) {
                ctx.fillStyle = isDark ? '#38BDF8' : '#0284C7';
              } else if (isCapturedNote || node.note_type === 'raw') {
                ctx.fillStyle = isDark ? '#34D399' : '#059669';
              } else if (node.note_type === 'formal') {
                ctx.fillStyle = isDark ? '#F59E0B' : '#D97706';
              } else if (perspective === 'global') {
                if ((node.degree || 0) >= 3) {
                  ctx.fillStyle = isDark ? '#60A5FA' : '#2563EB';
                } else if ((node.degree || 0) >= 1) {
                  ctx.fillStyle = isDark ? '#D4D4D8' : '#4B5563';
                } else {
                  ctx.fillStyle = isDark ? '#71717A' : '#9CA3AF';
                }
              } else {
                ctx.fillStyle = isHovered ? (isDark ? '#FFFFFF' : '#1F6342') : (isDark ? '#A1A1AA' : '#4B5563');
              }
              ctx.fill();

              // Topic Outer Accent Ring
              if (isTopic) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, baseR + 2.5, 0, 2 * Math.PI, false);
                ctx.strokeStyle = isDark ? 'rgba(167, 139, 250, 0.5)' : 'rgba(124, 58, 237, 0.4)';
                ctx.lineWidth = 1.0 / (globalScale || 1);
                ctx.stroke();
              }

              // 3. Label Text & Non-Overlapping Pill Engine
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

                const hasCollision = drawnLabelBoxesRef.current.some(
                  (b) => !(myBox.x2 < b.x1 || myBox.x1 > b.x2 || myBox.y2 < b.y1 || myBox.y1 > b.y2)
                );

                const isHighPriority = isHovered || isCenter || isMatch;

                if (isHighPriority || !hasCollision) {
                  drawnLabelBoxesRef.current.push(myBox);

                  // Pill Background
                  ctx.fillStyle = isCenter
                    ? (isDark ? 'rgba(23, 24, 28, 0.96)' : 'rgba(255, 255, 255, 0.96)')
                    : isMatch
                    ? (isDark ? 'rgba(40, 32, 10, 0.94)' : 'rgba(254, 243, 199, 0.96)')
                    : isHovered
                    ? (isDark ? 'rgba(26, 26, 32, 0.96)' : 'rgba(240, 241, 237, 0.96)')
                    : (isDark ? 'rgba(23, 24, 28, 0.92)' : 'rgba(255, 255, 255, 0.92)');
                  ctx.beginPath();
                  if (typeof ctx.roundRect === 'function') {
                    ctx.roundRect(pillX, pillY, pillW, pillH, 2.5);
                  } else {
                    ctx.rect(pillX, pillY, pillW, pillH);
                  }
                  ctx.fill();

                  // Pill Border
                  ctx.strokeStyle = isCenter
                    ? (isDark ? '#2EA468' : '#287D54')
                    : isMatch
                    ? '#E7A23B'
                    : isHovered
                    ? (isDark ? '#A1A1AA' : '#666B65')
                    : (isDark ? '#272A32' : '#E3E5DF');
                  ctx.lineWidth = 0.7 / (globalScale || 1);
                  ctx.stroke();

                  // Label Text
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = isCenter
                    ? (isDark ? '#FFFFFF' : '#1F6342')
                    : isMatch
                    ? (isDark ? '#FEF08A' : '#92400E')
                    : isHovered
                    ? (isDark ? '#FFFFFF' : '#242824')
                    : isUnresolved
                    ? (isDark ? '#71717A' : '#878C85')
                    : (isDark ? '#F4F4F5' : '#242824');
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
              const isDashed = link.edgeStyle === 'dashed' || isPending;
              
              if (!showAILinks && (link.status === 'pending' || Number(link.is_ai_suggested) === 1)) {
                return;
              }

              const isHoverConnected =
                hoveredNode &&
                (hoveredNode.id === start.id || hoveredNode.id === end.id);

              ctx.beginPath();
              ctx.moveTo(start.x, start.y);
              ctx.lineTo(end.x, end.y);

              if (isDashed) {
                ctx.strokeStyle = isDark ? '#F59E0B' : '#E7A23B';
                ctx.lineWidth = (isHoverConnected ? 1.5 : 1.1) / (globalScale || 1);
                ctx.setLineDash([3, 3]);
              } else if (link.relationship === 'contains_subtopic' || link.relationship === 'subtopic_of') {
                ctx.strokeStyle = isHoverConnected ? (isDark ? '#818CF8' : '#4F46E5') : (isDark ? 'rgba(129, 140, 248, 0.35)' : 'rgba(99, 102, 241, 0.3)');
                ctx.lineWidth = (isHoverConnected ? 1.5 : 0.9) / (globalScale || 1);
                ctx.setLineDash([]);
              } else if (link.relationship === 'canonically_documented_in' || link.relationship === 'captured_to_vault') {
                ctx.strokeStyle = isHoverConnected ? (isDark ? '#34D399' : '#059669') : (isDark ? 'rgba(52, 211, 153, 0.4)' : 'rgba(5, 150, 105, 0.35)');
                ctx.lineWidth = (isHoverConnected ? 1.6 : 1.0) / (globalScale || 1);
                ctx.setLineDash([]);
              } else {
                ctx.strokeStyle = isHoverConnected
                  ? (isDark ? '#2EA468' : '#287D54')
                  : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.14)');
                ctx.lineWidth = (isHoverConnected ? 1.5 : 0.9) / (globalScale || 1);
                ctx.setLineDash([]);
              }

              ctx.stroke();

              // 2. Edge Relationship Label
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
                    ? (isDark ? 'rgba(40, 32, 10, 0.95)' : 'rgba(254, 243, 199, 0.96)')
                    : isHoverConnected
                    ? (isDark ? 'rgba(26, 38, 30, 0.96)' : 'rgba(235, 245, 240, 0.96)')
                    : (isDark ? 'rgba(23, 24, 28, 0.92)' : 'rgba(255, 255, 255, 0.94)');

                  ctx.beginPath();
                  if (typeof ctx.roundRect === 'function') {
                    ctx.roundRect(rx, ry, rw, rh, 2.5);
                  } else {
                    ctx.rect(rx, ry, rw, rh);
                  }
                  ctx.fill();

                  ctx.strokeStyle = isPending
                    ? (isDark ? '#F59E0B' : '#E7A23B')
                    : isHoverConnected
                    ? (isDark ? '#2EA468' : '#287D54')
                    : (isDark ? '#272A32' : '#E3E5DF');
                  ctx.lineWidth = 0.75 / (globalScale || 1);
                  ctx.stroke();

                  ctx.fillStyle = isPending
                    ? (isDark ? '#FBBF24' : '#92400E')
                    : isHoverConnected
                    ? (isDark ? '#FFFFFF' : '#1F6342')
                    : (isDark ? '#D4D4D8' : '#242824');
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(relText, midX, midY);
                }
              }
            }}
            onNodeClick={(node) => {
              if (!node || isGhostNode(node)) return;
              if (graphMode === 'conversation') {
                setSelectedChatNode(node);
                return;
              }
              const numericId = typeof node.id === 'number' ? node.id : Number(node.id);
              if (Number.isInteger(numericId) && numericId > 0) {
                onSelectFile(numericId);
              }
            }}
          />

          {/* Chat Node Inspector Drawer */}
          {selectedChatNode && graphMode === 'conversation' && (
            <div className="absolute bottom-2 inset-x-2 p-3 bg-white/95 dark:bg-[#1A1B20]/95 backdrop-blur-md border border-[#E3E5DF] dark:border-[#272A32] rounded-xl shadow-lg z-20 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#E3E5DF] dark:border-[#272A32]">
                <div className="flex items-center gap-1.5 font-semibold text-[#242824] dark:text-[#F4F4F5]">
                  <span className={`w-2 h-2 rounded-full ${selectedChatNode.type === 'conversation_turn' ? 'bg-emerald-500' : 'bg-sky-500'}`} />
                  <span>{selectedChatNode.type === 'conversation_turn' ? 'Conversation Turn' : 'Explored Concept'}</span>
                </div>
                <button
                  onClick={() => setSelectedChatNode(null)}
                  className="p-1 text-[#666B65] dark:text-[#8E8E98] hover:text-[#242824] dark:hover:text-[#F4F4F5] rounded cursor-pointer"
                  title="Close Inspector"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                <div className="font-semibold text-[#1F6342] dark:text-emerald-400">
                  {selectedChatNode.title || selectedChatNode.name}
                </div>
                {selectedChatNode.question && (
                  <div className="text-[11px] text-[#4A4F49] dark:text-[#A1A1AA]">
                    <strong className="text-[#242824] dark:text-[#F4F4F5]">User: </strong>
                    {selectedChatNode.question}
                  </div>
                )}
                {selectedChatNode.answer && (
                  <div className="text-[11px] text-[#4A4F49] dark:text-[#A1A1AA] line-clamp-3">
                    <strong className="text-[#242824] dark:text-[#F4F4F5]">ChattyFi: </strong>
                    {selectedChatNode.answer.replace(/^[#>*-\s]+/gm, ' ').slice(0, 160)}...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Floating Note Navigator when in Fullscreen */}
          {isFullscreen && activeFileId && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/95 dark:bg-[#17171a]/95 backdrop-blur-md border border-[#E3E5DF] dark:border-[#2e2e36] rounded-xl shadow-xl flex items-center gap-3.5 text-xs text-[#242824] dark:text-[#d4d4d8] animate-in fade-in slide-in-from-bottom-2 duration-150 z-10 pointer-events-auto">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#287D54] dark:text-emerald-400" />
                <span>
                  Active Note: <strong className="text-[#242824] dark:text-[#f4f4f5]">{activeNodeTitle}</strong>
                </span>
              </div>
              <button
                onClick={() => setIsFullscreen(false)}
                className="px-2.5 py-1 rounded-md bg-[#287D54] hover:bg-[#1F6342] text-white text-xs font-medium transition-colors cursor-pointer shadow-xs"
                title="Exit fullscreen and edit this note"
              >
                <span>Edit Note</span>
              </button>
            </div>
          )}
        </div>
      )
    )}
  </div>
);

  // When isFullscreen is true, render a placeholder in the sidebar and portal the full screen graph to document.body
  if (isFullscreen) {
    return (
      <>
        <div className="h-72 bg-[#F0F1ED] dark:bg-[#15161A] border-b border-[#E3E5DF] dark:border-[#272A32] flex flex-col items-center justify-center p-4 text-center select-none shrink-0">
          <Network className="w-6 h-6 text-[#287D54] dark:text-[#2EA468] mb-2 animate-pulse" />
          <span className="text-xs font-semibold text-[#242824] dark:text-[#F4F4F5]">Graph View Maximized</span>
          <span className="text-xs text-[#4A4F49] dark:text-[#A1A1AA] mt-0.5">Press Esc or click Minimize to exit full screen</span>
        </div>
        {createPortal(graphContent, document.body)}
      </>
    );
  }

  return graphContent;
}
