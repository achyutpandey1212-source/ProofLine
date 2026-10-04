import React, { useMemo } from "react";
import { ProofGraphNode, ProofGraphEdge } from "../../types";
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ShieldCheck,
  Building2,
  Zap,
} from "lucide-react";

interface GraphCanvasProps {
  nodes: ProofGraphNode[];
  edges: ProofGraphEdge[];
  selectedNodeId: string | null;
  highlightedNodeIds: Set<string>;
  highlightedEdgeIds: Set<string>;
  onSelectNode: (node: ProofGraphNode) => void;
  zoom: number;
  pan: { x: number; y: number };
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  highlightedNodeIds,
  highlightedEdgeIds,
  onSelectNode,
  zoom,
  pan,
}) => {
  const nodeMap = useMemo(() => {
    const map = new Map<string, ProofGraphNode>();
    for (const n of nodes) {
      map.set(n.id, n);
    }
    return map;
  }, [nodes]);

  const getNodeIcon = (type: string, severity?: string) => {
    switch (type) {
      case "CASE":
        return <Building2 className="w-4 h-4 text-white" />;
      case "EVIDENCE":
        return <FileText className="w-4 h-4 text-[#FFA776]" />;
      case "FACT":
        return <Zap className="w-3.5 h-3.5 text-white/70" />;
      case "RULE":
        return <Scale className="w-4 h-4 text-[#FF6D29]" />;
      case "FINDING":
        return severity === "HIGH" ? (
          <AlertTriangle className="w-4 h-4 text-red-400" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-[#FFA776]" />
        );
      case "RESULT":
        return severity === "LOW" ? (
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        ) : (
          <ShieldCheck className="w-5 h-5 text-[#FFA776]" />
        );
      default:
        return <CheckCircle2 className="w-4 h-4 text-white/60" />;
    }
  };

  const getNodeBorderColor = (
    node: ProofGraphNode,
    isSelected: boolean,
    isHighlighted: boolean,
    hasActiveSelection: boolean
  ) => {
    if (isSelected) {
      return "border-[#FF6D29] ring-2 ring-[#FF6D29]/50 shadow-[0_0_30px_rgba(255,109,41,0.4)]";
    }
    if (isHighlighted) {
      return "border-[#FFA776] shadow-[0_0_20px_rgba(255,167,118,0.25)]";
    }
    if (hasActiveSelection) {
      return "border-white/[0.04] opacity-35";
    }

    switch (node.type) {
      case "RESULT":
        return node.severity === "LOW"
          ? "border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
          : "border-[#FF6D29]/40 shadow-[0_0_30px_rgba(255,109,41,0.2)]";
      case "FINDING":
        return node.severity === "HIGH"
          ? "border-red-500/40"
          : "border-[#FF6D29]/30";
      case "RULE":
        return "border-white/10 hover:border-[#FF6D29]/40";
      case "CASE":
        return "border-white/20";
      default:
        return "border-white/[0.08] hover:border-white/20";
    }
  };

  const hasActiveSelection = selectedNodeId !== null;

  return (
    <div
      className="absolute inset-0 origin-top-left transition-transform duration-75 select-none"
      style={{
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
      }}
    >
      {/* SVG Canvas for Relationship Connectors */}
      <svg
        className="absolute inset-0 pointer-events-none overflow-visible"
        style={{ width: "4000px", height: "4000px" }}
      >
        <defs>
          {/* Subtle gradient for active highlighted links */}
          <linearGradient id="edge-gradient-active" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFA776" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#FF6D29" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="edge-gradient-default" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.18" />
          </linearGradient>
          {/* Marker arrows */}
          <marker
            id="arrow-default"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="rgba(255,255,255,0.2)" />
          </marker>
          <marker
            id="arrow-active"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#FF6D29" />
          </marker>
        </defs>

        {edges.map((edge) => {
          const sourceNode = nodeMap.get(edge.source);
          const targetNode = nodeMap.get(edge.target);
          if (!sourceNode || !targetNode) return null;

          const sx = (sourceNode.x ?? 0) + 120;
          const sy = (sourceNode.y ?? 0) + 40;
          const tx = (targetNode.x ?? 0) + 120;
          const ty = (targetNode.y ?? 0) + 40;

          const isHighlighted = highlightedEdgeIds.has(edge.id);
          const opacity = hasActiveSelection ? (isHighlighted ? 1 : 0.08) : 0.65;
          const strokeWidth = isHighlighted ? 2.5 : 1.25;
          const stroke = isHighlighted ? "url(#edge-gradient-active)" : "url(#edge-gradient-default)";
          const markerEnd = isHighlighted ? "url(#arrow-active)" : "url(#arrow-default)";

          // Calculate cubic bezier curvature
          const dx = tx - sx;
          const cp1x = sx + Math.max(dx * 0.45, 60);
          const cp1y = sy;
          const cp2x = tx - Math.max(dx * 0.45, 60);
          const cp2y = ty;

          const pathD = `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tx} ${ty}`;

          return (
            <g key={edge.id} className="transition-opacity duration-200" style={{ opacity }}>
              <path
                d={pathD}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth}
                markerEnd={markerEnd}
                strokeDasharray={isHighlighted ? undefined : "4 4"}
              />
              {isHighlighted && edge.label && (
                <text
                  x={(sx + tx) / 2}
                  y={(sy + ty) / 2 - 8}
                  fill="#FFA776"
                  fontSize="10"
                  fontFamily="IBM Plex Mono"
                  textAnchor="middle"
                  className="select-none tracking-wider uppercase font-semibold"
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Nodes Render Layer */}
      {nodes.map((node) => {
        const isSelected = selectedNodeId === node.id;
        const isHighlighted = highlightedNodeIds.has(node.id);
        const nodeWidth = node.type === "RESULT" ? 280 : node.type === "CASE" ? 260 : 240;

        const borderClasses = getNodeBorderColor(
          node,
          isSelected,
          isHighlighted,
          hasActiveSelection
        );

        return (
          <div
            key={node.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectNode(node);
            }}
            style={{
              transform: `translate(${node.x ?? 0}px, ${node.y ?? 0}px)`,
              width: `${nodeWidth}px`,
            }}
            className={`proof-graph-node absolute cursor-pointer rounded-2xl bg-[#141215]/95 p-4 border backdrop-blur-xl transition-all duration-200 select-none ${borderClasses} ${
              isSelected ? "z-30 scale-[1.03]" : isHighlighted ? "z-20 scale-[1.01]" : "z-10"
            }`}
          >
            {/* Top Category Tag & Type Icon */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0">
                  {getNodeIcon(node.type, node.severity)}
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#BABABA]/70">
                  {node.category || node.type}
                </span>
              </div>

              {node.severity && (
                <span
                  className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                    node.severity === "LOW"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : node.severity === "HIGH"
                      ? "bg-red-500/10 border-red-500/20 text-red-400"
                      : "bg-[#FF6D29]/10 border-[#FF6D29]/20 text-[#FFA776]"
                  }`}
                >
                  {node.severity}
                </span>
              )}
            </div>

            {/* Primary Node Label */}
            <div className="font-display font-medium text-sm text-white truncate tracking-tight">
              {node.label}
            </div>

            {/* Secondary Sublabel */}
            {node.sublabel && (
              <div className="font-mono text-xs text-[#BABABA] truncate mt-0.5">
                {node.sublabel}
              </div>
            )}

            {/* Special highlights for Result or Weight reconciliation */}
            {node.type === "RESULT" && (
              <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-[#BABABA]">
                <span>Provenance</span>
                <span className="text-emerald-400 font-medium">Traceable 100%</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
