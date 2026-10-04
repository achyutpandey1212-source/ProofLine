import { ProofGraphNode, ProofGraphEdge } from "../../types";

export interface LayoutResult {
  nodes: ProofGraphNode[];
  edges: ProofGraphEdge[];
  bounds: { width: number; height: number };
}

/**
 * Computes an organized provenance hierarchy layout:
 * Column 0: Case Node
 * Column 1: Evidence Nodes
 * Column 2: Extracted Fact Nodes
 * Column 3: Verification Rule Nodes
 * Column 4: Finding Nodes (if any)
 * Column 5: Final Result Node
 */
export function computeGraphLayout(
  rawNodes: ProofGraphNode[],
  rawEdges: ProofGraphEdge[]
): LayoutResult {
  const columnSpacing = 320;
  const nodeHeight = 110;
  const verticalSpacing = 28;

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
      case "RESULT":
        // Put result in column 5 if there are findings, or column 4 if no findings
        const resultCol = rawNodes.some((n) => n.type === "FINDING") ? 5 : 4;
        columns[resultCol]!.push(node);
        node.column = resultCol;
        break;
      default:
        columns[1]!.push(node);
        node.column = 1;
    }
  }

  // Calculate maximum column height to vertically center smaller columns
  const maxColumnItems = Math.max(...columns.map((col) => col.length), 1);
  const totalMaxHeight = maxColumnItems * (nodeHeight + verticalSpacing);

  const startX = 60;
  const startY = 80;

  for (let c = 0; c < columns.length; c++) {
    const colNodes = columns[c]!;
    if (colNodes.length === 0) continue;

    const colHeight = colNodes.length * (nodeHeight + verticalSpacing);
    // Vertical centering offset
    const yOffset = startY + Math.max(0, (totalMaxHeight - colHeight) / 2);

    for (let r = 0; r < colNodes.length; r++) {
      const node = colNodes[r]!;
      node.x = startX + c * columnSpacing;
      node.y = yOffset + r * (nodeHeight + verticalSpacing);
    }
  }

  const maxX = Math.max(...rawNodes.map((n) => (n.x ?? 0) + 280), 1200);
  const maxY = Math.max(...rawNodes.map((n) => (n.y ?? 0) + 150), 800);

  return {
    nodes: rawNodes,
    edges: rawEdges,
    bounds: { width: maxX + 100, height: maxY + 100 },
  };
}
