import React from "react";
import { CheckCircle2, AlertTriangle, Clock, HelpCircle, XCircle } from "lucide-react";
import { CaseStatus, RiskLevel, HumanResolutionState } from "../../types";

interface CaseLifecycleBadgeProps {
  status: CaseStatus | string;
  riskLevel?: RiskLevel | string;
  resolutionState?: HumanResolutionState | string;
  size?: "sm" | "md";
}

/**
 * CaseLifecycleBadge
 * 
 * Accurately communicates both independent lifecycle axes of a transaction:
 * 1. Algorithmic Verification Verdict: What the automated reconciliation concluded.
 * 2. Institutional Human Resolution: What the human reviewer/company decided.
 */
export const CaseLifecycleBadge: React.FC<CaseLifecycleBadgeProps> = ({
  status,
  riskLevel,
  resolutionState = "PENDING_REVIEW",
  size = "md",
}) => {
  // 1. Algorithmic Verification State
  const getAlgorithmicBadge = () => {
    switch (status) {
      case "VERIFICATION_COMPLETE":
        return {
          label: "Verified (Low Risk)",
          icon: CheckCircle2,
          className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
        };
      case "REVIEW_REQUIRED":
        return {
          label: riskLevel === "HIGH" ? "Discrepancy (High Risk)" : "Discrepancy Detected",
          icon: AlertTriangle,
          className: "bg-[#FF6D29]/15 text-[#FFA776] border-[#FF6D29]/35",
        };
      case "PROCESSING":
      case "ANALYZING":
        return {
          label: "Analyzing Evidence",
          icon: Clock,
          className: "bg-amber-500/10 text-amber-300 border-amber-500/25",
        };
      case "EVIDENCE_READY":
        return {
          label: "Evidence Ready",
          icon: Clock,
          className: "bg-blue-500/10 text-blue-300 border-blue-500/25",
        };
      case "EVIDENCE_UPLOADING":
      case "CREATED":
        return {
          label: "Intake / Incomplete",
          icon: Clock,
          className: "bg-white/[0.04] text-[#BABABA] border-white/10",
        };
      default:
        return {
          label: String(status),
          icon: Clock,
          className: "bg-white/[0.04] text-[#BABABA] border-white/10",
        };
    }
  };

  // 2. Human Resolution State
  const getHumanResolutionBadge = () => {
    switch (resolutionState) {
      case "APPROVED":
        return {
          label: "Approved",
          icon: CheckCircle2,
          className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
          subtext: "Institutional Sign-off",
        };
      case "REJECTED":
        return {
          label: "Rejected",
          icon: XCircle,
          className: "bg-red-500/15 text-red-300 border-red-500/30",
          subtext: "Declined by Reviewer",
        };
      case "CLARIFICATION_REQUESTED":
        return {
          label: "Clarification Sent",
          icon: HelpCircle,
          className: "bg-amber-500/15 text-amber-300 border-amber-500/30",
          subtext: "Vendor Queried",
        };
      case "PENDING_REVIEW":
      default:
        return {
          label: "Pending Review",
          icon: Clock,
          className: "bg-white/[0.05] text-[#BABABA] border-white/10",
          subtext: "Awaiting Action",
        };
    }
  };

  const algo = getAlgorithmicBadge();
  const human = getHumanResolutionBadge();
  const AlgoIcon = algo.icon;
  const HumanIcon = human.icon;

  const isSmall = size === "sm";

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 font-display">
      {/* 1. Algorithmic Machine Verdict */}
      <span
        title={`Automated Verification Status: ${algo.label}`}
        className={`inline-flex items-center gap-1.5 rounded-md border font-medium font-mono ${
          isSmall ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
        } ${algo.className}`}
      >
        <AlgoIcon className={isSmall ? "w-2.5 h-2.5" : "w-3 h-3"} />
        <span>{algo.label}</span>
      </span>

      {/* Subtle connector dot if on wider viewport */}
      <span className="hidden sm:inline text-white/20 text-xs">&rarr;</span>

      {/* 2. Institutional Human Resolution */}
      <span
        title={`Human Resolution State: ${human.label} (${human.subtext})`}
        className={`inline-flex items-center gap-1.5 rounded-md border font-medium ${
          isSmall ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
        } ${human.className}`}
      >
        <HumanIcon className={isSmall ? "w-2.5 h-2.5" : "w-3 h-3"} />
        <span>{human.label}</span>
      </span>
    </div>
  );
};
