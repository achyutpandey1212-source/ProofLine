import React, { useState } from "react";
import { CaseReviewSummary, HumanResolutionState } from "../../types";
import { CaseService } from "../../services/case.service";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Send,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

interface HumanReviewSectionProps {
  caseId: string;
  initialSummary?: CaseReviewSummary | null;
  onDecisionUpdated: (newSummary: CaseReviewSummary) => void;
  isSimulated?: boolean;
}

export const HumanReviewSection: React.FC<HumanReviewSectionProps> = ({
  caseId,
  initialSummary,
  onDecisionUpdated,
  isSimulated = false,
}) => {
  const [selectedDecision, setSelectedDecision] = useState<
    "APPROVED" | "REJECTED" | "CLARIFICATION_REQUESTED"
  >("APPROVED");
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const currentResolution: HumanResolutionState =
    initialSummary?.currentResolution || "PENDING_REVIEW";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSimulated) {
      setSubmitError("Review decisions cannot be recorded while in adversarial simulation mode.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      const updated = await CaseService.recordReview(caseId, {
        decision: selectedDecision,
        note: note.trim() || undefined,
      });
      onDecisionUpdated(updated);
      setNote("");
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to record human review decision.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (state: HumanResolutionState) => {
    switch (state) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>APPROVED</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium text-red-400 bg-red-500/10 border border-red-500/20">
            <XCircle className="w-3.5 h-3.5" />
            <span>REJECTED</span>
          </span>
        );
      case "CLARIFICATION_REQUESTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>CLARIFICATION REQUESTED</span>
          </span>
        );
      case "PENDING_REVIEW":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium text-[#FFA776] bg-[#FF6D29]/10 border border-[#FF6D29]/25">
            <Clock className="w-3.5 h-3.5" />
            <span>PENDING REVIEW</span>
          </span>
        );
    }
  };

  return (
    <section className="rounded-3xl bg-[#141215]/85 border border-white/10 p-6 sm:p-8 shadow-[0_20px_45px_rgba(0,0,0,0.7)] backdrop-blur-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-[#FF6D29]" />
            <h2 className="text-base font-semibold text-white tracking-tight">
              Human Review &amp; Resolution
            </h2>
          </div>
          <p className="text-xs text-[#BABABA]">
            Business disposition separate from automated verification findings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-[#BABABA]">Disposition:</span>
          {getStatusBadge(currentResolution)}
        </div>
      </div>

      {submitError && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 font-display flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{submitError}</span>
        </div>
      )}

      {submitSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-display flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Review decision successfully recorded and committed to audit trail.</span>
        </div>
      )}

      {/* Decision Selection Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-xs uppercase font-mono tracking-wider text-[#FFA776]">
          Record Reviewer Decision
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Approve */}
          <label
            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
              selectedDecision === "APPROVED"
                ? "bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                : "bg-black/40 border-white/[0.08] hover:border-white/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Approve
              </span>
              <input
                type="radio"
                name="decision"
                value="APPROVED"
                checked={selectedDecision === "APPROVED"}
                onChange={() => setSelectedDecision("APPROVED")}
                className="accent-emerald-500"
              />
            </div>
            <p className="text-[11px] text-[#BABABA] leading-relaxed">
              Accept this transaction despite any verification discrepancies.
            </p>
          </label>

          {/* Request Clarification */}
          <label
            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
              selectedDecision === "CLARIFICATION_REQUESTED"
                ? "bg-amber-500/10 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                : "bg-black/40 border-white/[0.08] hover:border-white/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                Request Clarification
              </span>
              <input
                type="radio"
                name="decision"
                value="CLARIFICATION_REQUESTED"
                checked={selectedDecision === "CLARIFICATION_REQUESTED"}
                onChange={() => setSelectedDecision("CLARIFICATION_REQUESTED")}
                className="accent-amber-500"
              />
            </div>
            <p className="text-[11px] text-[#BABABA] leading-relaxed">
              Send this transaction back for additional evidence or explanation.
            </p>
          </label>

          {/* Reject */}
          <label
            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
              selectedDecision === "REJECTED"
                ? "bg-red-500/10 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                : "bg-black/40 border-white/[0.08] hover:border-white/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-red-400" />
                Reject
              </span>
              <input
                type="radio"
                name="decision"
                value="REJECTED"
                checked={selectedDecision === "REJECTED"}
                onChange={() => setSelectedDecision("REJECTED")}
                className="accent-red-500"
              />
            </div>
            <p className="text-[11px] text-[#BABABA] leading-relaxed">
              Reject because submitted evidence fails to substantiate the claim.
            </p>
          </label>
        </div>

        {/* Reviewer Note */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase tracking-wider text-[#BABABA]">
            Reviewer Note (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Accepted after receiving supplier weighbridge recalibration certificate..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#BABABA]/30 focus:outline-none focus:border-[#FF6D29]/50 font-display resize-none"
          />
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={submitting || isSimulated}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6D29] to-[#E04516] text-white text-xs font-display font-medium shadow-[0_0_18px_rgba(255,109,41,0.35)] hover:shadow-[0_0_24px_rgba(255,109,41,0.55)] transition cursor-pointer disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? "Recording Decision..." : "Confirm Decision"}</span>
          </button>
        </div>
      </form>

      {/* Decision Audit Trail History */}
      {initialSummary?.history && initialSummary.history.length > 0 && (
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#BABABA]">
            <span>Review History Audit Trail ({initialSummary.history.length})</span>
            <span className="text-[10px] text-[#BABABA]/50 font-sans normal-case">Chronological immutable log</span>
          </div>

          <div className="divide-y divide-white/[0.06] border border-white/10 rounded-2xl overflow-hidden bg-black/30">
            {initialSummary.history.map((h) => (
              <div key={h.id} className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(h.decision)}
                    <span className="font-medium text-white">
                      {h.reviewer.name || h.reviewer.email}
                    </span>
                    <span className="text-[10px] font-mono text-[#BABABA]/50">
                      ({h.reviewer.role})
                    </span>
                  </div>
                  {h.note && (
                    <div className="text-[#BABABA] italic pl-1 flex items-start gap-1.5 pt-0.5">
                      <MessageSquare className="w-3 h-3 text-[#FF6D29] shrink-0 mt-0.5" />
                      <span>&ldquo;{h.note}&rdquo;</span>
                    </div>
                  )}
                </div>

                <div className="text-[11px] font-mono text-[#BABABA]/60 whitespace-nowrap">
                  {new Date(h.decidedAt).toLocaleDateString()} &bull;{" "}
                  {new Date(h.decidedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
