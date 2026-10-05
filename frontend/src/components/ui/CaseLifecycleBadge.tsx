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
  const isSmall = size === "sm";

  // 1. Algorithmic Verification State
  const getAlgorithmicBadge = () => {
    switch (status) {
      case "VERIFICATION_COMPLETE":
        return {
          label: "Verified (Low Risk)",
          shortLabel: "Verified",
          icon: CheckCircle2,
          dotColor: "bg-emerald-400",
        };
      case "REVIEW_REQUIRED":
        return {
          label: riskLevel === "HIGH" ? "Discrepancy (High Risk)" : "Discrepancy Detected",
          shortLabel: "Discrepancy",
          icon: AlertTriangle,
          dotColor: "bg-[#FF6D29]",
        };
      case "PROCESSING":
      case "ANALYZING":
        return {
          label: "Analyzing Evidence",
          shortLabel: "Analyzing",
          icon: Clock,
          dotColor: "bg-amber-400 animate-pulse",
        };
      case "EVIDENCE_READY":
        return {
          label: "Evidence Ready",
          shortLabel: "Ready",
          icon: Clock,
          dotColor: "bg-blue-400",
        };
      case "EVIDENCE_UPLOADING":
      case "CREATED":
        return {
          label: "Intake / Incomplete",
          shortLabel: "Intake",
          icon: Clock,
          dotColor: "bg-zinc-500",
        };
      default:
        return {
          label: String(status),
          shortLabel: String(status),
          icon: Clock,
          dotColor: "bg-zinc-500",
        };
    }
  };

  // 2. Human Resolution State
  const getHumanResolutionBadge = () => {
    switch (resolutionState) {
      case "APPROVED":
        return {
          label: "Approved",
          shortLabel: "Approved",
          icon: CheckCircle2,
          textColor: "text-emerald-400",
          subtext: "Institutional Sign-off",
        };
      case "REJECTED":
        return {
          label: "Rejected",
          shortLabel: "Rejected",
          icon: XCircle,
          textColor: "text-red-400",
          subtext: "Declined by Reviewer",
        };
      case "CLARIFICATION_REQUESTED":
        return {
          label: "Clarification Sent",
          shortLabel: "Clarification",
          icon: HelpCircle,
          textColor: "text-amber-400",
          subtext: "Vendor Queried",
        };
      case "PENDING_REVIEW":
      default:
        return {
          label: "Pending Review",
          shortLabel: "Pending",
          icon: Clock,
          textColor: "text-zinc-400",
          subtext: "Awaiting Action",
        };
    }
  };

  const algo = getAlgorithmicBadge();
  const human = getHumanResolutionBadge();
  const HumanIcon = human.icon;

  return (
    <div
      title={`Engine: ${algo.label} · Human: ${human.label} (${human.subtext})`}
      className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-lg bg-white/[0.03] border border-white/[0.08] font-mono select-none whitespace-nowrap shrink-0 ${
        isSmall ? "px-2 py-1 text-[10px]" : "px-2.5 py-1 text-[11px]"
      }`}
    >
      {/* 1. Algorithmic Machine Verdict */}
      <span className="inline-flex items-center gap-1.5 text-zinc-300">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${algo.dotColor}`} />
        <span>{isSmall ? algo.shortLabel : algo.label}</span>
      </span>

      <span className="text-white/20 text-[10px]">&bull;</span>

      {/* 2. Institutional Human Resolution */}
      <span className={`inline-flex items-center gap-1 font-medium ${human.textColor}`}>
        <HumanIcon className={isSmall ? "w-2.5 h-2.5 shrink-0" : "w-3 h-3 shrink-0"} />
        <span>{isSmall ? human.shortLabel : human.label}</span>
      </span>
    </div>
  );
};
