import React, { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Network, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { forceCollide, forceRadial } from 'd3-force-3d';

export default function GraphView({ graphData, activeFileId, onSelectFile }) {
  const fgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 320, height: 260 });
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    const updateBounds = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || 320,
          height: Math.max(200, (containerRef.current.clientHeight || 280) - 38),
        });
      }
    };

    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, []);

  const nodes = Array.isArray(graphData?.nodes) ? graphData.nodes : [];
  const rawLinks = Array.isArray(graphData?.links)
    ? graphData.links
    : Array.isArray(graphData?.edges)
    ? graphData.edges
    : [];

  const safeGraphData = React.useMemo(() => {
    const nonCenterNodes = nodes.filter((n) => !(n.isCenter || n.id === activeFileId));
    const multiShell = nonCenterNodes.length > 7;

    return {
      nodes: nodes.map((n) => {
        const isCenter = n.isCenter || n.id === activeFileId;
        const nonCenterIdx = nonCenterNodes.findIndex((x) => x.id === n.id);
        // Stagger radii into concentric shells when there are many nodes to prevent overcrowding
        const shellRadius = isCenter
          ? 0
          : multiShell
          ? nonCenterIdx % 2 === 0
            ? 85
            : 155
          : 105;

        return {
          ...n,
          // Pin center node to origin (0, 0) for a deterministic radial neighborhood
          fx: isCenter ? 0 : undefined,
          fy: isCenter ? 0 : undefined,
          isCenter,
          shellRadius,
        };
      }),
      links: rawLinks.map((e) => ({ ...e })),
    };
  }, [nodes, rawLinks, activeFileId]);

  // Apply layout forces: charge repulsion, link distances, collision, and radial placement
  useEffect(() => {
    if (fgRef.current && safeGraphData.nodes.length > 0) {
      try {
        const fg = fgRef.current;

        // 1. Strong charge repulsion between nodes to prevent clustering
        const charge = fg.d3Force('charge');
        if (charge) {
          charge.strength((node) => (node.isCenter ? -480 : -260));
        }

        // 2. Link force with comfortable distance for reading labels
        const link = fg.d3Force('link');
        if (link) {
          link.distance((l) => (l.relationship ? 130 : 105));
        }

        // 3. Collision force to prevent any node or label overlap
        fg.d3Force(
          'collide',
          forceCollide()
            .radius((node) => (node.isCenter ? 48 : 38))
            .iterations(4)
        );

        // 4. Radial force fanning neighbor nodes into concentric shells
        fg.d3Force(
          'radial',
          forceRadial((node) => node.shellRadius || 95, 0, 0).strength(
            (node) => (node.isCenter ? 1.0 : 0.75)
          )
        );

        // Warm up simulation and zoom to fit
        fg.d3ReheatSimulation();
        const timer = setTimeout(() => {
          fgRef.current?.zoomToFit(380, 26);
        }, 140);
        return () => clearTimeout(timer);
      } catch (err) {
        console.warn('Graph layout force error:', err);
      }
    }
  }, [safeGraphData, activeFileId]);

  if (nodes.length === 0) {
    return (
      <div
        ref={containerRef}
        className="h-72 bg-[#181818] border-b border-[#2e2e2e] flex flex-col items-center justify-center text-[#777777]"
      >
        <Network className="w-8 h-8 mb-2 text-[#444444] animate-pulse" />
        <p className="text-xs font-medium text-[#888888]">No graph data for current note</p>
        <p className="text-[11px] text-[#555555] mt-0.5">Add wikilinks to visualize connections</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-72 bg-[#181818] border-b border-[#2e2e2e] flex flex-col relative select-none shrink-0"
    >
      {/* Header Bar */}
      <div className="px-3.5 py-2 border-b border-[#2e2e2e] flex items-center justify-between bg-[#141414] shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#dcddde]">
          <Network className="w-3.5 h-3.5 text-[#e2e8f0]" />
          <span>Local Neighborhood Graph</span>
          <span className="text-[10px] font-normal text-[#777777] ml-1">
            ({nodes.length} nodes)
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => fgRef.current?.zoom?.(fgRef.current.zoom() * 1.25, 250)}
            className="p-1 hover:bg-[#262626] text-[#999999] hover:text-[#ffffff] rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => fgRef.current?.zoom?.(fgRef.current.zoom() / 1.25, 250)}
            className="p-1 hover:bg-[#262626] text-[#999999] hover:text-[#ffffff] rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              fgRef.current?.d3ReheatSimulation();
              fgRef.current?.zoomToFit?.(300, 28);
            }}
            className="p-1 hover:bg-[#262626] text-[#999999] hover:text-[#ffffff] rounded transition-colors"
            title="Reset View"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Force-directed Graph Canvas */}
      <div className="flex-1 w-full relative overflow-hidden bg-[#161616]">
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={safeGraphData}
          nodeRelSize={6}
          backgroundColor="#161616"
          nodeId="id"
          linkSource="source"
          linkTarget="target"
          cooldownTicks={100}
          warmupTicks={30}
          onNodeHover={(node) => setHoveredNode(node || null)}
          nodeCanvasObject={(node, ctx, globalScale) => {
            if (node.x === undefined || node.y === undefined) return;
            const isCenter = node.isCenter || node.id === activeFileId;
            const isUnresolved = node.isUnresolved;
            const isHovered = hoveredNode && hoveredNode.id === node.id;
            const label = node.title || String(node.id);

            // Responsive font size that stays readable across zoom levels
            const fontSize = Math.max(9, Math.min(13, 11 / (globalScale || 1)));

            // Truncate overly long labels based on node density and hover state
            const maxChars =
              isCenter || isHovered
                ? 26
                : safeGraphData.nodes.length > 8
                ? 15
                : 20;
            const displayLabel =
              label.length > maxChars ? label.slice(0, maxChars - 1) + '…' : label;

            const r = isCenter ? 7.5 : isUnresolved ? 4.5 : 5.5;

            // 1. Draw Outer Glow for Center / Hovered
            if (isCenter || isHovered) {
              ctx.beginPath();
              ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI, false);
              ctx.fillStyle = isCenter
                ? 'rgba(226, 232, 240, 0.18)'
                : 'rgba(196, 181, 253, 0.22)';
              ctx.fill();
            }

            // 2. Draw Node Circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);

            if (isCenter) {
              ctx.fillStyle = '#ffffff';
              ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
              ctx.shadowBlur = 8;
            } else if (isUnresolved) {
              ctx.fillStyle = '#64748b';
              ctx.shadowBlur = 0;
            } else {
              ctx.fillStyle = isHovered ? '#ddd6fe' : '#c4b5fd';
              ctx.shadowBlur = 4;
              ctx.shadowColor = '#c4b5fd';
            }
            ctx.fill();

            // Reset shadow
            ctx.shadowBlur = 0;

            // 3. Draw Pill Label Container to guarantee text readability over edges
            ctx.font = `${isCenter ? '600' : '500'} ${fontSize}px Inter, -apple-system, sans-serif`;
            const textWidth = ctx.measureText(displayLabel).width;
            const pillPadX = 5;
            const pillPadY = 2;
            const pillW = textWidth + pillPadX * 2;
            const pillH = fontSize + pillPadY * 2;
            const pillX = node.x - pillW / 2;
            const pillY = node.y + r + 3;

            // Pill background
            ctx.fillStyle = isCenter
              ? 'rgba(24, 24, 28, 0.92)'
              : 'rgba(20, 20, 24, 0.86)';
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(pillX, pillY, pillW, pillH, 3);
            } else {
              ctx.rect(pillX, pillY, pillW, pillH);
            }
            ctx.fill();

            // Pill subtle border
            ctx.strokeStyle = isCenter
              ? 'rgba(226, 232, 240, 0.4)'
              : isHovered
              ? 'rgba(196, 181, 253, 0.5)'
              : 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 0.8 / (globalScale || 1);
            ctx.stroke();

            // 4. Draw Label Text
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isCenter
              ? '#ffffff'
              : isHovered
              ? '#ffffff'
              : isUnresolved
              ? '#94a3b8'
              : '#e2e8f0';
            ctx.fillText(displayLabel, node.x, pillY + pillH / 2);
          }}
          nodePointerAreaPaint={(node, color, ctx) => {
            const r = node.isCenter ? 12 : 9;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.fillRect(node.x - 24, node.y, 48, 20);
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

            const isPending = link.status === 'pending' || link.is_ai_suggested === 1;
            const isHoverConnected =
              hoveredNode &&
              (hoveredNode.id === start.id || hoveredNode.id === end.id);

            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);

            if (isPending) {
              ctx.strokeStyle = '#fbbf24';
              ctx.lineWidth = (isHoverConnected ? 2 : 1.5) / (globalScale || 1);
              ctx.setLineDash([4, 3]);
            } else {
              ctx.strokeStyle = isHoverConnected
                ? '#94a3b8'
                : 'rgba(75, 85, 99, 0.45)';
              ctx.lineWidth = (isHoverConnected ? 1.8 : 1.2) / (globalScale || 1);
              ctx.setLineDash([]);
            }

            ctx.stroke();

            // Edge Relationship Label with small backdrop
            if (link.relationship) {
              // Position 65% toward the target so labels don't bunch at the center node
              const t = 0.65;
              const midX = start.x * (1 - t) + end.x * t;
              const midY = start.y * (1 - t) + end.y * t;
              const relFontSize = Math.max(7, Math.min(10, 8.5 / (globalScale || 1)));
              ctx.font = `italic 500 ${relFontSize}px Inter, sans-serif`;

              const relText = link.relationship;
              const textMetrics = ctx.measureText(relText);
              const rw = textMetrics.width + 6;
              const rh = relFontSize + 3;

              // Only show edge labels when scale is readable or link is connected to hovered node
              const shouldShowLabel =
                isHoverConnected ||
                safeGraphData.nodes.length <= 8 ||
                (globalScale || 1) >= 0.8;

              if (shouldShowLabel) {
                // Relationship mini pill
                ctx.fillStyle = isPending ? 'rgba(30, 24, 10, 0.92)' : 'rgba(18, 18, 22, 0.88)';
                ctx.beginPath();
                if (typeof ctx.roundRect === 'function') {
                  ctx.roundRect(midX - rw / 2, midY - rh / 2, rw, rh, 2);
                } else {
                  ctx.rect(midX - rw / 2, midY - rh / 2, rw, rh);
                }
                ctx.fill();

                ctx.fillStyle = isPending ? '#fbbf24' : '#cbd5e1';
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
      </div>
    </div>
  );
}
