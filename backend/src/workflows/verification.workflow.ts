import { StateGraph, END, START } from "@langchain/langgraph";
import {
  VerificationWorkflowAnnotation,
  VerificationWorkflowState,
} from "./workflow.state";
import {
  loadCaseNode,
  loadEvidenceNode,
  evidenceReadinessNode,
  extractionNode,
  extractionValidationNode,
  verificationNode,
  finalPersistenceNode,
} from "./workflow.nodes";
import { logger } from "../utils/logger";

/**
 * Creates and compiles the LangGraph verification state graph.
 */
export function buildVerificationWorkflow() {
  const workflow = new StateGraph(VerificationWorkflowAnnotation)
    .addNode("loadCase", loadCaseNode)
    .addNode("loadEvidence", loadEvidenceNode)
    .addNode("evidenceReadiness", evidenceReadinessNode)
    .addNode("extraction", extractionNode)
    .addNode("extractionValidation", extractionValidationNode)
    .addNode("verification", verificationNode)
    .addNode("finalPersistence", finalPersistenceNode);

  // Define linear edges and conditional routing
  workflow.addEdge(START, "loadCase");
  workflow.addEdge("loadCase", "loadEvidence");
  workflow.addEdge("loadEvidence", "evidenceReadiness");

  // Conditional branch from evidenceReadiness:
  // If there are pending items, route to extraction; else directly to extractionValidation
  workflow.addConditionalEdges("evidenceReadiness", (state: VerificationWorkflowState) => {
    if (state.pendingEvidenceIds.length > 0) {
      return "extraction";
    }
    return "extractionValidation";
  });

  // Conditional branch from extraction:
  // If extraction entered WAITING_RETRY, loop back to extraction;
  // If extraction succeeded, proceed to extractionValidation;
  // If failed, end.
  workflow.addConditionalEdges("extraction", (state: VerificationWorkflowState) => {
    if (state.workflowStatus === "WAITING_RETRY") {
      logger.info("[Workflow Routing] Extraction in WAITING_RETRY. Re-running extraction node.");
      return "extraction";
    }
    if (state.workflowStatus === "FAILED") {
      return END;
    }
    return "extractionValidation";
  });

  workflow.addEdge("extractionValidation", "verification");
  workflow.addEdge("verification", "finalPersistence");
  workflow.addEdge("finalPersistence", END);

  return workflow.compile();
}

export const verificationWorkflowApp = buildVerificationWorkflow();
