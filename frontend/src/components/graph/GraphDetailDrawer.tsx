import React from "react";
import { ProofGraphNode } from "../../types";
import {
  X,
  FileText,
  AlertTriangle,
  Scale,
  ShieldCheck,
  Building2,
  Zap,
  ExternalLink,
} from "lucide-react";

interface GraphDetailDrawerProps {
  node: ProofGraphNode | null;
  onClose: () => void;
}

export const GraphDetailDrawer: React.FC<GraphDetailDrawerProps> = ({
  node,
  onClose,
}) => {
  if (!node) return null;

  const renderContent = () => {
    switch (node.type) {
      case "CASE": {
        const meta = node.metadata;
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2 font-display text-xs">
              <div className="flex justify-between">
                <span className="text-[#BABABA]">Transaction ID</span>
                <span className="font-mono text-white font-medium">{String(meta["transactionId"])}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#BABABA]">Partner</span>
                <span className="text-white font-medium">{String(meta["partnerName"])}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#BABABA]">Material</span>
                <span className="text-white">{String(meta["material"])}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#BABABA]">Claimed Quantity</span>
                <span className="font-mono text-white">
                  {String(meta["claimedQuantity"])} {String(meta["unit"] || "kg")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#BABABA]">Current Status</span>
                <span className="font-mono text-[#FFA776]">{String(meta["status"])}</span>
              </div>
            </div>
            <p className="text-xs text-[#BABABA] leading-relaxed">
              Root transaction case serving as the baseline for all incoming physical and documentary evidence.
            </p>
          </div>
        );
      }

      case "EVIDENCE": {
        const meta = node.metadata;
        const url = meta["url"] as string | undefined;
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2 font-display text-xs">
              <div className="flex justify-between">
                <span className="text-[#BABABA]">Evidence ID</span>
                <span className="font-mono text-white font-medium">{String(meta["evidenceId"])}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#BABABA]">Classification</span>
                <span className="text-white">{String(meta["type"])}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#BABABA]">Filename</span>
                <span className="text-white font-mono truncate max-w-[160px]">{String(meta["filename"])}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#BABABA]">Extraction Status</span>
                <span className="font-mono text-emerald-400">{String(meta["extractionStatus"] || "EXTRACTED")}</span>
              </div>
              {meta["confidence"] !== undefined && (
                <div className="flex justify-between">
                  <span className="text-[#BABABA]">OCR Confidence</span>
                  <span className="font-mono text-white">{Math.round(Number(meta["confidence"]) * 100)}%</span>
                </div>
              )}
            </div>

            {url && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-display text-white transition w-full justify-center"
              >
                <span>Inspect Source Document</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#FF6D29]" />
              </a>
            )}
          </div>
        );
      }

      case "FACT": {
        const meta = node.metadata;
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2 font-display text-xs">
              <div className="flex justify-between">
                <span className="text-[#BABABA]">Extracted Field</span>
                <span className="text-white font-medium">{String(meta["field"])}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#BABABA]">Normalized Value</span>
                <span className="font-mono text-emerald-400 font-semibold">{String(meta["displayValue"])}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#BABABA]">Source Evidence</span>
                <span className="font-mono text-white">{String(meta["evidenceId"])}</span>
              </div>
              {meta["confidence"] !== undefined && (
                <div className="flex justify-between">
                  <span className="text-[#BABABA]">Fact Confidence</span>
                  <span className="font-mono text-white">{Math.round(Number(meta["confidence"]) * 100)}%</span>
                </div>
              )}
            </div>
            <p className="text-xs text-[#BABABA] leading-relaxed">
              Extracted directly from the submitted physical evidence and fed deterministically into compliance verification rules.
            </p>
          </div>
        );
      }

      case "RULE": {
        const meta = node.metadata;
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2 font-display text-xs">
              <div className="flex justify-between">
                <span className="text-[#BABABA]">Rule ID</span>
                <span className="font-mono text-white font-medium">{String(meta["ruleId"])}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#BABABA]">Outcome</span>
                <span
                  className={`font-mono font-medium ${
                    meta["status"] === "PASS"
                      ? "text-emerald-400"
                      : meta["status"] === "FAIL"
                      ? "text-red-400"
                      : "text-[#FFA776]"
                  }`}
                >
                  {String(meta["status"])}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#BABABA]">Severity</span>
                <span className="font-mono text-white">{String(meta["severity"])}</span>
              </div>
            </div>

            {meta["message"] ? (
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] text-xs text-[#BABABA] leading-relaxed">
                <div className="text-[10px] font-mono uppercase text-[#FFA776] mb-1">Rule Output</div>
                {String(meta["message"])}
              </div>
            ) : null}
          </div>
        );
      }

      case "FINDING": {
        const meta = node.metadata;
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2 font-display text-xs">
              <div className="flex justify-between">
                <span className="text-[#BABABA]">Finding ID</span>
                <span className="font-mono text-white font-medium">{String(meta["findingId"])}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#BABABA]">Triggering Rule</span>
                <span className="font-mono text-white">{String(meta["ruleId"])}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#BABABA]">Severity</span>
                <span
                  className={`font-mono font-medium ${
                    meta["severity"] === "HIGH" ? "text-red-400" : "text-[#FFA776]"
                  }`}
                >
                  {String(meta["severity"])}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] text-xs text-[#BABABA] leading-relaxed">
              <div className="text-[10px] font-mono uppercase text-[#FFA776] mb-1">Finding Description</div>
              {String(meta["description"])}
            </div>

            {meta["recommendedAction"] ? (
              <div className="p-3.5 rounded-xl bg-[#FF6D29]/10 border border-[#FF6D29]/25 text-xs text-[#FFA776] leading-relaxed">
                <div className="text-[10px] font-mono uppercase font-semibold mb-1">Recommended Action</div>
                {String(meta["recommendedAction"])}
              </div>
            ) : null}
          </div>
        );
      }

      case "RESULT": {
        const meta = node.metadata;
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2 font-display text-xs">
              <div className="flex justify-between">
                <span className="text-[#BABABA]">Final Verification</span>
                <span className="font-mono text-emerald-400 font-bold">{String(meta["status"])}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#BABABA]">Assessed Risk</span>
                <span className="font-mono text-white">{String(meta["risk"])}</span>
              </div>
              {meta["claimedWeight"] !== undefined && (
                <div className="flex justify-between">
                  <span className="text-[#BABABA]">Claimed Weight</span>
                  <span className="font-mono text-white">{String(meta["claimedWeight"])} kg</span>
                </div>
              )}
              {meta["measuredWeight"] !== undefined && (
                <div className="flex justify-between">
                  <span className="text-[#BABABA]">Measured Total</span>
                  <span className="font-mono text-white">{String(meta["measuredWeight"])} kg</span>
                </div>
              )}
              {meta["variancePercentage"] !== undefined && (
                <div className="flex justify-between">
                  <span className="text-[#BABABA]">Variance</span>
                  <span className="font-mono text-emerald-400 font-semibold">{String(meta["variancePercentage"])}%</span>
                </div>
              )}
            </div>

            <p className="text-xs text-[#BABABA] leading-relaxed">
              Deterministic outcome synthesized directly from all upstream evidence, extracted facts, and evaluated business rules.
            </p>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const getHeaderIcon = () => {
    switch (node.type) {
      case "CASE":
        return <Building2 className="w-4 h-4 text-white" />;
      case "EVIDENCE":
        return <FileText className="w-4 h-4 text-[#FFA776]" />;
      case "FACT":
        return <Zap className="w-4 h-4 text-white/80" />;
      case "RULE":
        return <Scale className="w-4 h-4 text-[#FF6D29]" />;
      case "FINDING":
        return <AlertTriangle className="w-4 h-4 text-[#FFA776]" />;
      case "RESULT":
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="absolute top-6 right-6 w-80 sm:w-96 rounded-3xl bg-[#141215]/95 border border-white/10 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl z-40 animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 pb-4 mb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
            {getHeaderIcon()}
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#FF6D29]">
              {node.category || node.type}
            </div>
            <h3 className="font-display font-medium text-sm text-white leading-tight">
              {node.label}
            </h3>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 flex items-center justify-center text-[#BABABA] hover:text-white transition cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body Content */}
      {renderContent()}

      {/* Provenance note */}
      <div className="mt-5 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[10px] font-mono text-[#BABABA]/60">
        <span>Proofline Provenance</span>
        <span>ID: {node.id}</span>
      </div>
    </div>
  );
};
