import { ProofGraphNode, ProofGraphEdge } from "../../types";

export interface LayoutResult {
  nodes: ProofGraphNode[];
  edges: ProofGraphEdge[];
  bounds: { width: number; height: number };
}

/**
 * Computes a clean, balanced provenance hierarchy layout:
 * Column 0: Case Node
 * Column 1: Evidence Nodes
 * Column 2: Extracted Fact Nodes (clustered neatly near their parent evidence)
 * Column 3: Verification Rule Nodes
 * Column 4: Finding Nodes (if any)
 * Column 5: Final Result Node
 *
 * Keeps nodes aligned cleanly without massive vertical offsets or umbrella arching.
 */
export function computeGraphLayout(
  rawNodes: ProofGraphNode[],
  rawEdges: ProofGraphEdge[]
): LayoutResult {
  const columnSpacing = 320;
  const nodeHeight = 104;
  const verticalGap = 24;
  const startX = 60;
  const startY = 60;

  // Group nodes by column index
  const columns: ProofGraphNode[][] = [[], [], [], [], [], []];

  for (const node of rawNodes) {
    switch (node.type) {
      case "CASE":
        columns[0]!.push(node);
        node.column = 0;
        break;
      case "EVIDENCE":
        columns[1]!.push(node);
        node.column = 1;
        break;
      case "FACT":
        columns[2]!.push(node);
        node.column = 2;
        break;
      case "RULE":
        columns[3]!.push(node);
        node.column = 3;
        break;
      case "FINDING":
        columns[4]!.push(node);
        node.column = 4;
        break;
      case "RESULT": {
        const resultCol = rawNodes.some((n) => n.type === "FINDING") ? 5 : 4;
        columns[resultCol]!.push(node);
        node.column = resultCol;
        break;
      }
      default:
        columns[1]!.push(node);
        node.column = 1;
    }
  }

  // Pre-sort facts so they group according to their parent evidence order
  const evidenceOrder = new Map<string, number>();
  columns[1]!.forEach((ev, idx) => evidenceOrder.set(ev.id, idx));

  columns[2]!.sort((a, b) => {
    const parentA = (a.metadata?.evidenceId as string) || "";
    const parentB = (b.metadata?.evidenceId as string) || "";
    const orderA = evidenceOrder.get(`evidence-${parentA}`) ?? 999;
    const orderB = evidenceOrder.get(`evidence-${parentB}`) ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.label.localeCompare(b.label);
  });

  // Calculate the natural height of the largest dense column (usually Facts or Rules)
  const maxDenseCount = Math.max(
    columns[1]!.length,
    columns[2]!.length,
    columns[3]!.length,
    1
  );
  const anchorCenterY = startY + (maxDenseCount * (nodeHeight + verticalGap)) / 2;

  // Position nodes in each column
  for (let c = 0; c < columns.length; c++) {
    const colNodes = columns[c]!;
    if (colNodes.length === 0) continue;

    const colHeight = colNodes.length * (nodeHeight + verticalGap) - verticalGap;

    // Center single/few item columns (like Case or Result) around anchorCenterY,
    // but ensure they never start higher than startY
    let colStartY = startY;
    if (colNodes.length <= 2) {
      colStartY = Math.max(startY, anchorCenterY - colHeight / 2);
    } else {
      // Distribute evenly or start at startY
      colStartY = startY;
    }

    for (let r = 0; r < colNodes.length; r++) {
      const node = colNodes[r]!;
      node.x = startX + c * columnSpacing;
      node.y = colStartY + r * (nodeHeight + verticalGap);
    }
  }

  const maxX = Math.max(...rawNodes.map((n) => (n.x ?? 0) + 300), 1200);
  const maxY = Math.max(...rawNodes.map((n) => (n.y ?? 0) + 160), 800);

  return {
    nodes: rawNodes,
    edges: rawEdges,
    bounds: { width: maxX + 120, height: maxY + 120 },
  };
}
