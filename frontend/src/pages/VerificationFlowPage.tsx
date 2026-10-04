import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GlowBackground } from "../components/ui/GlowBackground";
import { VerificationInsight } from "../components/verification/VerificationInsight";
import { CaseService } from "../services/case.service";
import { EvidenceService } from "../services/evidence.service";
import { VerificationClientService } from "../services/verification.service";
import { CaseItem, EvidenceItem, WorkflowProgress, VerificationReport } from "../types";
import { Check, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import gsap from "gsap";

export const VerificationFlowPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const [caseItem, setCaseItem] = useState<CaseItem | null>(null);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [progress, setProgress] = useState<WorkflowProgress | null>(null);
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial context and start workflow if not already started
  useEffect(() => {
    if (!caseId) return;

    let isMounted = true;

    const init = async () => {
      try {
        const [c, e] = await Promise.all([
          CaseService.getCase(caseId),
          EvidenceService.listEvidence(caseId),
        ]);
        if (!isMounted) return;
        setCaseItem(c);
        setEvidenceList(e);

        // Check if already complete
        if (c.status === "VERIFICATION_COMPLETE" || c.status === "REVIEW_REQUIRED") {
          try {
            const r = await VerificationClientService.getReport(caseId);
            if (!isMounted) return;
            setReport(r);
            handleSuccessTransition();
            return;
          } catch {
            // Start verification if report doesn't exist
          }
        }

        // Trigger verification
        await VerificationClientService.startVerification(caseId);
        startPolling();
      } catch (err) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "Failed to initiate verification.";
        setError(msg);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [caseId]);

  const startPolling = () => {
    if (!caseId) return;
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const p = await VerificationClientService.getStatus(caseId);
        setProgress(p);

        if (p.status === "COMPLETED") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          const r = await VerificationClientService.getReport(caseId);
          setReport(r);
          handleSuccessTransition();
        } else if (p.status === "FAILED") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setError("Verification pipeline encountered an unrecoverable failure.");
        }
      } catch {
        // Transient error during polling - keep polling
      }
    }, 1500);
  };

  const handleSuccessTransition = () => {
    setIsDone(true);
    if (!containerRef.current) {
      navigate(`/cases/${caseId}/verification`, { replace: true });
      return;
    }

    gsap.to(containerRef.current, {
      opacity: 0,
      y: -12,
      duration: 0.6,
      ease: "power2.inOut",
      delay: 0.8,
      onComplete: () => {
        navigate(`/cases/${caseId}/verification`, { replace: true });
      },
    });
  };

  // Determine stage states from backend step
  const currentStep = progress?.step || "INIT";

  const getStageStatus = (stageIdx: number): "completed" | "active" | "pending" => {
    if (isDone) return "completed";
    if (error) return "pending";

    const stepOrder: Record<string, number> = {
      INIT: 1,
      LOAD_CASE: 1,
      LOAD_EVIDENCE: 1,
      EVIDENCE_READINESS: 1,
      EXTRACTION: 2,
      EXTRACTION_VALIDATION: 3,
      NORMALIZATION: 4,
      VERIFICATION: 4,
      FINDINGS: 5,
      RISK_ASSESSMENT: 5,
      FINAL_PERSISTENCE: 5,
      COMPLETED: 6,
    };

    const currentOrder = stepOrder[currentStep] || 1;

    if (currentOrder > stageIdx) return "completed";
    if (currentOrder === stageIdx) return "active";
    return "pending";
  };

  const stage1Status = getStageStatus(1);
  const stage2Status = getStageStatus(2);
  const stage3Status = getStageStatus(3);
  const stage4Status = getStageStatus(4);
  const stage5Status = getStageStatus(5);

  const processedCount = progress?.processedEvidence ?? 0;
  const totalCount = progress?.totalEvidence || evidenceList.length || 4;

  return (
    <GlowBackground className="min-h-screen flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Top Brand Header */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF6D29] to-[#C73E1D] p-[1px] shadow-[0_0_14px_rgba(255,109,41,0.4)]">
            <div className="w-full h-full bg-[#120F12] rounded-[7px] flex items-center justify-center">
              <span className="text-[11px] font-bold text-white tracking-wider">PL</span>
            </div>
          </div>
          <span className="font-display font-semibold text-sm sm:text-base text-white tracking-[0.16em] uppercase">
            Proofline
          </span>
        </div>

        {error ? (
          <button
            onClick={() => navigate(`/cases/${caseId}`)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-xs font-display text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Case</span>
          </button>
        ) : (
          <div className="text-xs font-mono text-[#BABABA]">
            TRANSACTION: <span className="text-white font-medium">{caseItem?.transactionId || "—"}</span>
          </div>
        )}
      </div>

      {/* Center Execution Card */}
      <div ref={containerRef} className="w-full max-w-2xl mx-auto my-auto py-8">
        {error ? (
          <div className="rounded-3xl bg-[#141215]/90 border border-red-500/30 p-8 sm:p-10 text-center backdrop-blur-xl shadow-[0_24px_50px_rgba(0,0,0,0.8)]">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto mb-4 flex items-center justify-center text-red-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="font-display text-lg font-semibold text-white mb-2">Verification Failed</h2>
            <p className="font-display text-xs text-[#BABABA] max-w-md mx-auto mb-6">
              {error}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => navigate(`/cases/${caseId}`)}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-display text-white transition cursor-pointer"
              >
                Return to Case
              </button>
              <button
                onClick={() => {
                  setError(null);
                  startPolling();
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF6D29] to-[#E04516] text-white text-xs font-display font-medium shadow-[0_0_18px_rgba(255,109,41,0.35)] transition cursor-pointer"
              >
                Retry Verification
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-[#141215]/90 border border-white/10 p-8 sm:p-10 backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.85)]">
            {/* Stage Title */}
            <div className="text-center mb-8">
              <div className="font-mono text-xs uppercase tracking-widest text-[#FF6D29] mb-1">
                Deterministic Execution
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                Verifying Case{" "}
                <span className="font-mono text-[#FFA776]">{caseItem?.transactionId}</span>
              </h1>
            </div>

            {/* Pipeline Stages Stepper */}
            <div className="space-y-4 font-display">
              {/* Stage 01: Collecting Evidence */}
              <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-black/40 border border-white/[0.06]">
                <div className="mt-0.5 shrink-0">
                  {stage1Status === "completed" ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : stage1Status === "active" ? (
                    <div className="w-5 h-5 rounded-full bg-[#FF6D29]/20 border border-[#FF6D29] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#FF6D29] animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-white/15" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-white flex items-center justify-between">
                    <span>Collecting evidence</span>
                    {stage1Status === "completed" && (
                      <span className="text-[11px] font-mono text-emerald-400">Ready</span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#BABABA] mt-0.5">
                    Gathering submitted records and establishing the verification context.
                  </p>
                </div>
              </div>

              {/* Stage 02: Extracting Facts */}
              <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-black/40 border border-white/[0.06]">
                <div className="mt-0.5 shrink-0">
                  {stage2Status === "completed" ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : stage2Status === "active" ? (
                    <div className="w-5 h-5 rounded-full bg-[#FF6D29]/20 border border-[#FF6D29] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#FF6D29] animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-white/15" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-white flex items-center justify-between">
                    <span>Extracting facts</span>
                    {stage2Status === "active" && (
                      <span className="text-[11px] font-mono text-[#FFA776]">
                        {processedCount} / {totalCount} processed
                      </span>
                    )}
                    {stage2Status === "completed" && (
                      <span className="text-[11px] font-mono text-emerald-400">Complete</span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#BABABA] mt-0.5">
                    Reading quantities, dates, identifiers and other visible evidence.
                  </p>

                  {/* Progressive evidence checklist if active or complete */}
                  {(stage2Status === "active" || stage2Status === "completed") && (
                    <div className="mt-2.5 pt-2 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-[11px] font-mono">
                      {evidenceList.map((ev, i) => {
                        const isExtracted = i < processedCount || stage2Status === "completed";
                        return (
                          <div key={ev._id || i} className="flex items-center justify-between pr-2 text-[#BABABA]">
                            <span className="truncate max-w-[120px]">{ev.type}</span>
                            {isExtracted ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <RefreshCw className="w-2.5 h-2.5 text-[#FF6D29] animate-spin" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Stage 03: Validating Records */}
              <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-black/40 border border-white/[0.06]">
                <div className="mt-0.5 shrink-0">
                  {stage3Status === "completed" ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : stage3Status === "active" ? (
                    <div className="w-5 h-5 rounded-full bg-[#FF6D29]/20 border border-[#FF6D29] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#FF6D29] animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-white/15" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-white flex items-center justify-between">
                    <span>Validating records</span>
                    {stage3Status === "completed" && (
                      <span className="text-[11px] font-mono text-emerald-400">Verified</span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#BABABA] mt-0.5">
                    Checking that extracted information is complete and structurally valid.
                  </p>
                </div>
              </div>

              {/* Stage 04: Reconciling Measurements (Visual Centerpiece) */}
              <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-black/40 border border-white/[0.06]">
                <div className="mt-0.5 shrink-0">
                  {stage4Status === "completed" ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : stage4Status === "active" ? (
                    <div className="w-5 h-5 rounded-full bg-[#FF6D29]/20 border border-[#FF6D29] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#FF6D29] animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-white/15" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-white flex items-center justify-between">
                    <span>Reconciling measurements</span>
                    {stage4Status === "completed" && (
                      <span className="text-[11px] font-mono text-emerald-400">0.79% Variance</span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#BABABA] mt-0.5">
                    Cross-checking declared amounts against aggregated scale measurements.
                  </p>

                  {/* Reconciled numbers display when report is computed */}
                  {report && (
                    <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-center font-display">
                      <div>
                        <div className="text-[10px] uppercase font-mono text-[#BABABA]">Claimed</div>
                        <div className="text-sm font-semibold text-white">
                          {report.calculatedValues.claimedWeight} kg
                        </div>
                      </div>
                      <div className="text-xs text-[#BABABA]">&rarr;</div>
                      <div>
                        <div className="text-[10px] uppercase font-mono text-[#BABABA]">Measured</div>
                        <div className="text-sm font-semibold text-white">
                          {report.calculatedValues.measuredWeight} kg
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-mono text-emerald-400">Variance</div>
                        <div className="text-xs font-mono font-medium text-emerald-400">
                          {report.calculatedValues.variancePercentage}%
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stage 05: Preparing Verification Report */}
              <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-black/40 border border-white/[0.06]">
                <div className="mt-0.5 shrink-0">
                  {stage5Status === "completed" ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : stage5Status === "active" ? (
                    <div className="w-5 h-5 rounded-full bg-[#FF6D29]/20 border border-[#FF6D29] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#FF6D29] animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-white/15" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-white flex items-center justify-between">
                    <span>Preparing verification report</span>
                    {isDone && (
                      <span className="text-[11px] font-mono text-emerald-400">Done</span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#BABABA] mt-0.5">
                    Compiling traceable findings and verification results.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom micro status */}
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[#BABABA]">
              <span>TENANT: RESTRICTED</span>
              <span>
                {isDone ? "VERIFICATION COMPLETE" : "EXECUTION IN PROGRESS"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Secondary Information Area: Rotating Verified Insights */}
      <div className="w-full max-w-2xl mx-auto pb-4">
        <VerificationInsight intervalMs={8000} />
      </div>
    </GlowBackground>
  );
};
