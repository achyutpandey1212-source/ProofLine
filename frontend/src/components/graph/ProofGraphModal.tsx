import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { CaseService } from "../../services/case.service";
import { ProofGraphDto, ProofGraphNode } from "../../types";
import { GraphCanvas } from "./GraphCanvas";
import { GraphDetailDrawer } from "./GraphDetailDrawer";
import { computeGraphLayout } from "./layoutEngine";
import {
  ZoomIn,
  ZoomOut,
  RefreshCw,
  X,
  Network,
  RotateCcw,
} from "lucide-react";

interface ProofGraphModalProps {
  caseId: string;
  isOpen: boolean;
  onClose: () => void;
  initialGraphData?: ProofGraphDto | null;
  isSimulated?: boolean;
}

export const ProofGraphModal: React.FC<ProofGraphModalProps> = ({
  caseId,
  isOpen,
  onClose,
  initialGraphData,
  isSimulated,
}) => {
  const [data, setData] = useState<ProofGraphDto | null>(initialGraphData || null);
  const [loading, setLoading] = useState(!initialGraphData);
  const [error, setError] = useState<string | null>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Node selection state
  const [selectedNode, setSelectedNode] = useState<ProofGraphNode | null>(null);

  // Container refs for animations & events
  const viewportRef = useRef<HTMLDivElement>(null);

  // Fetch graph data from backend
  const loadGraph = useCallback(async () => {
    if (initialGraphData) {
      setData(initialGraphData);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const graphDto = await CaseService.getProofGraph(caseId);
      setData(graphDto);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Proof Graph.");
    } finally {
      setLoading(false);
    }
  }, [caseId, initialGraphData]);

  useEffect(() => {
    if (isOpen) {
      if (initialGraphData) {
        setData(initialGraphData);
        setLoading(false);
      } else {
        loadGraph();
      }
      setSelectedNode(null);
    }
  }, [isOpen, initialGraphData, loadGraph]);

  // Compute Layout when data is loaded
  const layout = useMemo(() => {
    if (!data) return null;
    return computeGraphLayout(data.nodes, data.edges);
  }, [data]);

  // Auto-center and fit graph when layout is computed or modal opened
  useEffect(() => {
    if (!layout || !viewportRef.current) return;
    const vp = viewportRef.current;
    const vpWidth = vp.clientWidth || 1200;
    const vpHeight = vp.clientHeight || 750;

    const scaleX = (vpWidth - 120) / Math.max(layout.bounds.width, 1);
    const scaleY = (vpHeight - 120) / Math.max(layout.bounds.height, 1);
    const fitScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.55), 1.0);

    setZoom(fitScale);
    setPan({
      x: Math.max(40, (vpWidth - layout.bounds.width * fitScale) / 2),
      y: Math.max(40, (vpHeight - layout.bounds.height * fitScale) / 2),
    });
  }, [layout]);

  // Compute transitive provenance highlights for selected node
  const { highlightedNodeIds, highlightedEdgeIds } = useMemo(() => {
    if (!selectedNode || !data) {
      return { highlightedNodeIds: new Set<string>(), highlightedEdgeIds: new Set<string>() };
    }

    const nIds = new Set<string>([selectedNode.id]);
    const eIds = new Set<string>();

    // Bidirectional provenance traversal:
    // 1. Traverse backwards (upstream toward evidence)
    const traverseUpstream = (currId: string) => {
      for (const edge of data.edges) {
        if (edge.target === currId) {
          eIds.add(edge.id);
          if (!nIds.has(edge.source)) {
            nIds.add(edge.source);
            traverseUpstream(edge.source);
          }
        }
      }
    };

    // 2. Traverse forwards (downstream toward final result)
    const traverseDownstream = (currId: string) => {
      for (const edge of data.edges) {
        if (edge.source === currId) {
          eIds.add(edge.id);
          if (!nIds.has(edge.target)) {
            nIds.add(edge.target);
            traverseDownstream(edge.target);
          }
        }
      }
    };

    traverseUpstream(selectedNode.id);
    traverseDownstream(selectedNode.id);

    return { highlightedNodeIds: nIds, highlightedEdgeIds: eIds };
  }, [selectedNode, data]);

  // GSAP animation on .proof-graph-node removed because gsap.fromTo({ y: 12 }, { y: 0 })
  // was overwriting element style.transform = translate(node.x, node.y) with matrix/translateY(0),
  // causing all 28 nodes in each column to collapse onto y = 0!

  // Pan / Drag handlers with window-level tracking
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // primary click only
    // If clicking a node or control, let their click handlers take precedence
    const target = e.target as HTMLElement;
    if (target.closest(".proof-graph-node") || target.closest("button")) {
      return;
    }
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.35), 2.2));
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 2.2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.35));
  const handleResetView = () => {
    setZoom(0.85);
    setPan({ x: 50, y: 40 });
    setSelectedNode(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full h-full max-w-[1600px] rounded-[28px] sm:rounded-[36px] bg-[#0c0a0c] border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
        {/* Top Header Toolbar */}
        <div className="px-6 py-4 border-b border-white/10 bg-[#120F12]/90 backdrop-blur-xl flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#FF6D29]/15 border border-[#FF6D29]/30 flex items-center justify-center text-[#FF6D29]">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-semibold text-white text-base tracking-tight">
                  Proof Graph
                </h2>
                <span className="font-mono text-xs text-[#FFA776] bg-[#FF6D29]/10 border border-[#FF6D29]/25 px-2 py-0.5 rounded-full">
                  {data?.case.transactionId || caseId}
                </span>
                {isSimulated && (
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#FF6D29] bg-[#FF6D29]/20 border border-[#FF6D29]/50 px-2.5 py-0.5 rounded-full font-semibold animate-pulse">
                    SIMULATION
                  </span>
                )}
              </div>
              <p className="text-[11px] font-display text-[#BABABA]">
                Visual chain of custody &bull; Case &rarr; Evidence &rarr; Extracted Facts &rarr; Verification Rules &rarr; Outcome
              </p>
            </div>
          </div>

          {/* Controls Cluster */}
          <div className="flex items-center gap-2">
            {/* Quick stats pills */}
            {data?.summary && (
              <div className="hidden lg:flex items-center gap-2 mr-4 text-[11px] font-mono text-[#BABABA]">
                <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  {data.summary.totalEvidence} Evidence
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  {data.summary.totalFacts} Facts
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  {data.summary.totalRulesEvaluated} Rules
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  {data.summary.totalFindings} Findings
                </span>
              </div>
            )}

            {/* Zoom / Pan toolbar */}
            <div className="flex items-center bg-white/[0.04] border border-white/10 rounded-xl p-1 gap-1">
              <button
                onClick={handleZoomIn}
                className="w-8 h-8 rounded-lg hover:bg-white/[0.08] flex items-center justify-center text-[#BABABA] hover:text-white transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="w-8 h-8 rounded-lg hover:bg-white/[0.08] flex items-center justify-center text-[#BABABA] hover:text-white transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetView}
                className="w-8 h-8 rounded-lg hover:bg-white/[0.08] flex items-center justify-center text-[#BABABA] hover:text-white transition cursor-pointer"
                title="Reset View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 flex items-center justify-center text-[#BABABA] hover:text-white transition cursor-pointer ml-1"
              title="Close Graph"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Graph Canvas Container */}
        <div
          ref={viewportRef}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
          onClick={() => setSelectedNode(null)}
          className={`relative flex-1 w-full h-full overflow-hidden bg-[#0a080a] ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          {/* Subtle Grid Backdrop */}
          <div
            className="absolute inset-0 opacity-[0.035] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, #FFFFFF 1px, transparent 1px), linear-gradient(to bottom, #FFFFFF 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />

          {/* Ambient Corner Glow */}
          <div
            className="absolute -top-32 -left-32 w-96 h-96 pointer-events-none rounded-full blur-[120px] opacity-20"
            style={{
              background:
                "radial-gradient(circle, rgba(255,109,41,0.4) 0%, transparent 70%)",
            }}
          />

          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-8 rounded-2xl bg-[#141215]/80 border border-white/10 text-center backdrop-blur-xl">
                <RefreshCw className="w-6 h-6 text-[#FF6D29] animate-spin mx-auto mb-3" />
                <p className="text-xs font-display text-[#BABABA]">Constructing Proof Graph...</p>
              </div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="p-8 rounded-2xl bg-[#141215]/80 border border-red-500/20 text-center max-w-md">
                <p className="text-xs text-red-300 mb-4">{error}</p>
                <button
                  onClick={loadGraph}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-display text-white transition"
                >
                  Retry Loading
                </button>
              </div>
            </div>
          ) : layout ? (
            <GraphCanvas
              nodes={layout.nodes}
              edges={layout.edges}
              selectedNodeId={selectedNode?.id ?? null}
              highlightedNodeIds={highlightedNodeIds}
              highlightedEdgeIds={highlightedEdgeIds}
              onSelectNode={(node) => setSelectedNode(node)}
              zoom={zoom}
              pan={pan}
            />
          ) : null}

          {/* Floating Detail Drawer when a node is selected */}
          <GraphDetailDrawer
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
          />

          {/* Bottom Interactive Legend */}
          <div className="absolute bottom-4 left-6 z-20 hidden md:flex items-center gap-4 px-4 py-2 rounded-full bg-[#141215]/85 border border-white/10 backdrop-blur-md text-[11px] font-mono text-[#BABABA]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white/60" />
              <span>Case</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FFA776]" />
              <span>Evidence</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white/40" />
              <span>Extracted Fact</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FF6D29]" />
              <span>Rule</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>Finding</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Final Result</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
