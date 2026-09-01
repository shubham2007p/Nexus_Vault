import React, { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Network, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

export default function GraphView({ graphData, activeFileId, onSelectFile }) {
  const fgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 300, height: 260 });

  useEffect(() => {
    const updateBounds = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || 300,
          height: Math.max(180, (containerRef.current.clientHeight || 300) - 42),
        });
      }
    };

    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, []);

  useEffect(() => {
    if (fgRef.current && graphData?.nodes?.length > 0) {
      try {
        if (typeof fgRef.current.d3ReheatSimulation === 'function') {
          fgRef.current.d3ReheatSimulation();
        }
        if (typeof fgRef.current.zoomToFit === 'function') {
          setTimeout(() => {
            fgRef.current?.zoomToFit(400, 30);
          }, 100);
        }
      } catch (err) {
        console.warn('Graph animation reheat error:', err);
      }
    }
  }, [graphData, activeFileId]);

  const nodes = Array.isArray(graphData?.nodes) ? graphData.nodes : [];
  const edges = Array.isArray(graphData?.edges) ? graphData.edges : [];

  if (nodes.length === 0) {
    return (
      <div ref={containerRef} className="h-64 bg-[#181818] border-b border-[#2e2e2e] flex flex-col items-center justify-center text-[#777777]">
        <Network className="w-8 h-8 mb-2 text-[#444444] animate-pulse" />
        <p className="text-xs">No graph data for current note</p>
      </div>
    );
  }

  const safeGraphData = {
    nodes: nodes.map((n) => ({ ...n })),
    edges: edges.map((e) => ({ ...e })),
  };

  return (
    <div ref={containerRef} className="h-64 bg-[#181818] border-b border-[#2e2e2e] flex flex-col relative select-none shrink-0">
      {/* Header Bar */}
      <div className="px-3.5 py-2 border-b border-[#2e2e2e] flex items-center justify-between bg-[#141414] shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#dcddde]">
          <Network className="w-3.5 h-3.5 text-[#70a5fd]" />
          <span>Local Neighborhood Graph</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => fgRef.current?.zoom?.(fgRef.current.zoom() * 1.2, 300)}
            className="p-1 hover:bg-[#262626] text-[#999999] hover:text-[#ffffff] rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <button
            onClick={() => fgRef.current?.zoom?.(fgRef.current.zoom() / 1.2, 300)}
            className="p-1 hover:bg-[#262626] text-[#999999] hover:text-[#ffffff] rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <button
            onClick={() => fgRef.current?.zoomToFit?.(300, 30)}
            className="p-1 hover:bg-[#262626] text-[#999999] hover:text-[#ffffff] rounded"
            title="Reset Graph View"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Force-directed Graph Canvas */}
      <div className="flex-1 w-full relative overflow-hidden">
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={safeGraphData}
          nodeRelSize={6}
          backgroundColor="#181818"
          nodeId="id"
          linkSource="source"
          linkTarget="target"
          nodeCanvasObject={(node, ctx, globalScale) => {
            if (node.x === undefined || node.y === undefined) return;
            const label = node.title || String(node.id);
            const fontSize = Math.max(8, 11 / (globalScale || 1));
            const isCenter = node.isCenter || node.id === activeFileId;
            const isUnresolved = node.isUnresolved;

            // Node Circle
            ctx.beginPath();
            const r = isCenter ? 7 : isUnresolved ? 4 : 5;
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);

            if (isCenter) {
              ctx.fillStyle = '#70a5fd';
              ctx.shadowColor = '#70a5fd';
              ctx.shadowBlur = 8;
            } else if (isUnresolved) {
              ctx.fillStyle = '#666666';
              ctx.shadowBlur = 0;
            } else {
              ctx.fillStyle = '#c4b5fd';
              ctx.shadowBlur = 3;
              ctx.shadowColor = '#c4b5fd';
            }
            ctx.fill();

            // Label text below node
            ctx.shadowBlur = 0;
            ctx.font = `${isCenter ? '600' : '400'} ${fontSize}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = isCenter ? '#ffffff' : '#dcddde';
            ctx.fillText(label, node.x, node.y + r + 2);
          }}
          linkCanvasObject={(link, ctx, globalScale) => {
            const start = typeof link.source === 'object' ? link.source : null;
            const end = typeof link.target === 'object' ? link.target : null;

            if (!start || !end || start.x === undefined || start.y === undefined || end.x === undefined || end.y === undefined) {
              return;
            }

            const isPending = link.status === 'pending' || link.is_ai_suggested === 1;

            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);

            if (isPending) {
              ctx.strokeStyle = '#fbbf24';
              ctx.lineWidth = 1.5 / (globalScale || 1);
              ctx.setLineDash([4, 4]);
            } else {
              ctx.strokeStyle = '#383838';
              ctx.lineWidth = 1.2 / (globalScale || 1);
              ctx.setLineDash([]);
            }

            ctx.stroke();

            if (link.relationship) {
              const midX = (start.x + end.x) / 2;
              const midY = (start.y + end.y) / 2;
              const fontSize = Math.max(7, 8 / (globalScale || 1));
              ctx.font = `italic ${fontSize}px Inter, sans-serif`;
              ctx.fillStyle = isPending ? '#fbbf24' : '#70a5fd';
              ctx.textAlign = 'center';
              ctx.fillText(link.relationship, midX, midY - 2);
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
