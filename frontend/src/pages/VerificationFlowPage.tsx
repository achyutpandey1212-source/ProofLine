import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GlowBackground } from "../components/ui/GlowBackground";
import { VerificationInsight } from "../components/verification/VerificationInsight";
import { CaseService } from "../services/case.service";
import { VerificationClientService } from "../services/verification.service";
import { CaseItem, WorkflowProgress, EvidenceRunState } from "../types";
import { Check, ArrowLeft, AlertCircle } from "lucide-react";
import gsap from "gsap";

/**
 * Stages map 1:1 onto real backend workflow steps. Nothing here advances on a timer:
 * a stage is "done" only once the backend reports it has moved past it.
 */
const STAGES = [
  { key: "prepare", title: "Preparing case", idle: "Loading the case and its evidence" },
  { key: "extract", title: "Reading documents", idle: "Extracting quantities, dates and identifiers" },
  { key: "validate", title: "Validating extractions", idle: "Checking completeness and structure" },
  { key: "reconcile", title: "Reconciling measurements", idle: "Running verification rules across all records" },
  { key: "seal", title: "Sealing report", idle: "Persisting findings and risk assessment" },
] as const;

const STEP_TO_STAGE: Record<string, number> = {
  INIT: 0,
  LOAD_CASE: 0,
  LOAD_EVIDENCE: 0,
  EVIDENCE_READINESS: 0,
  EXTRACTION: 1,
  EXTRACTION_VALIDATION: 2,
  NORMALIZATION: 3,
  VERIFICATION: 3,
  FINDINGS: 4,
  RISK_ASSESSMENT: 4,
  FINAL_PERSISTENCE: 4,
  COMPLETED: 5,
};

const docLabel = (type: string) =>
  type
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const stateText: Record<EvidenceRunState, string> = {
  QUEUED: "Queued",
  READING: "Reading",
  RETRYING: "Retrying",
  EXTRACTED: "Extracted",
  FAILED: "Failed",
};

const fmtElapsed = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const fmtClock = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

export const VerificationFlowPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const [caseItem, setCaseItem] = useState<CaseItem | null>(null);
  const [progress, setProgress] = useState<WorkflowProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [mountedAt] = useState(() => Date.now());

  const containerRef = useRef<HTMLDivElement>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelled = useRef(false);
  const doneRef = useRef(false);

  // Live elapsed clock (display only).
  useEffect(() => {
    if (isDone || error) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [isDone, error]);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setIsDone(true);
    const go = () => navigate(`/cases/${caseId}/verification`, { replace: true });
    if (!containerRef.current) {
      go();
      return;
    }
    gsap.to(containerRef.current, {
      opacity: 0,
      y: -10,
      duration: 0.5,
      ease: "power2.inOut",
      delay: 0.9,
      onComplete: go,
    });
  }, [caseId, navigate]);

  const poll = useCallback(async () => {
    if (!caseId || cancelled.current) return;
    try {
      const p = await VerificationClientService.getStatus(caseId);
      if (cancelled.current) return;
      setProgress(p);

      if (p.status === "COMPLETED") {
        finish();
        return;
      }
      if (p.status === "FAILED") {
        setError(p.errorMessage || "Verification could not be completed.");
        return;
      }
    } catch {
      // Transient network error: keep polling.
    }
    pollTimer.current = setTimeout(poll, 1000);
  }, [caseId, finish]);

  const start = useCallback(async () => {
    if (!caseId) return;
    setError(null);
    setProgress(null);
    try {
      await VerificationClientService.startVerification(caseId);
      if (cancelled.current) return;
      poll();
    } catch (err) {
      if (cancelled.current) return;
      setError(err instanceof Error ? err.message : "Failed to start verification.");
    }
  }, [caseId, poll]);

  useEffect(() => {
    if (!caseId) return;
    cancelled.current = false;
    doneRef.current = false;

    (async () => {
      try {
        const c = await CaseService.getCase(caseId);
        if (cancelled.current) return;
        setCaseItem(c);

        if (c.status === "VERIFICATION_COMPLETE" || c.status === "REVIEW_REQUIRED") {
          try {
            await VerificationClientService.getReport(caseId);
            if (!cancelled.current) finish();
            return;
          } catch {
            // No report yet, run verification.
          }
        }
        await start();
      } catch (err) {
        if (!cancelled.current) setError(err instanceof Error ? err.message : "Failed to load case.");
      }
    })();

    return () => {
      cancelled.current = true;
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  // ---- Derived view state (all from backend data) ----
  const activeStage = isDone ? STAGES.length : STEP_TO_STAGE[progress?.step ?? "INIT"] ?? 0;
  const evidence = progress?.evidence ?? [];
  const extractedCount = evidence.filter((e) => e.state === "EXTRACTED").length;
  const anyRetrying = evidence.some((e) => e.state === "RETRYING");
  const startedAtMs = progress?.startedAt ? new Date(progress.startedAt).getTime() : mountedAt;
  const elapsed = (progress?.completedAt ? new Date(progress.completedAt).getTime() : now) - startedAtMs;

  const stageDetail = (i: number): string => {
    if (i < activeStage) {
      if (i === 1 && evidence.length > 0) return `${evidence.length} of ${evidence.length} documents`;
      return "Done";
    }
    if (i === activeStage) {
      if (i === 1 && evidence.length > 0) {
        return anyRetrying
          ? `${extractedCount} of ${evidence.length} · retrying`
          : `${extractedCount} of ${evidence.length} documents`;
      }
      return "In progress";
    }
    return "";
  };

  const headline = isDone
    ? "Verification complete"
    : activeStage === 1 && evidence.length > 0
      ? `Reading documents · ${extractedCount} of ${evidence.length} complete`
      : STAGES[Math.min(activeStage, STAGES.length - 1)]!.title;

  const recentEvents = (progress?.events ?? []).slice(-5).reverse();

  return (
    <GlowBackground className="min-h-screen flex flex-col justify-between p-6 sm:p-10 select-none">
      <style>{`
        @keyframes pl-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes pl-sweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }
        @keyframes pl-breathe { 0%,100% { opacity: .45; transform: scale(.85); } 50% { opacity: 1; transform: scale(1); } }
        .pl-shimmer-text {
          background: linear-gradient(100deg, #f5f1ee 30%, #FFA776 48%, #f5f1ee 66%);
          background-size: 200% 100%;
          -webkit-background-clip: text; background-clip: text; color: transparent;
          animation: pl-shimmer 2.8s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .pl-shimmer-text { animation: none; color: #f5f1ee; background: none; }
        }
      `}</style>

      {/* Brand header */}
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
            <span>Return to case</span>
          </button>
        ) : (
          <div className="text-xs font-mono text-[#BABABA]">
            <span className="text-white font-medium">{caseItem?.transactionId || "—"}</span>
          </div>
        )}
      </div>

      {/* Main column: no card chrome, just typography and hairlines */}
      <div ref={containerRef} className="w-full max-w-xl mx-auto my-auto py-10 font-display">
        {error ? (
          <div role="alert" className="text-center">
            <div className="w-11 h-11 rounded-full bg-red-500/10 border border-red-500/25 mx-auto mb-5 flex items-center justify-center text-red-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Verification didn't finish</h2>
            <p className="text-sm text-[#BABABA] max-w-md mx-auto mb-7 leading-relaxed">{error}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => navigate(`/cases/${caseId}`)}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs text-white transition cursor-pointer"
              >
                Return to case
              </button>
              <button
                onClick={start}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF6D29] to-[#E04516] text-white text-xs font-medium shadow-[0_0_18px_rgba(255,109,41,0.3)] transition cursor-pointer"
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Headline */}
            <div className="mb-8" aria-live="polite">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#8a8480] mb-3">
                Verifying {caseItem?.transactionId ?? "case"}
              </div>
              <h1
                className={`text-[26px] sm:text-3xl font-medium tracking-tight leading-tight ${
                  isDone ? "text-white" : "pl-shimmer-text"
                }`}
              >
                {headline}
              </h1>
            </div>

            {/* Segmented progress: one segment per real stage */}
            <div className="flex gap-1.5 mb-9" role="progressbar" aria-valuemin={0} aria-valuemax={STAGES.length} aria-valuenow={Math.min(activeStage, STAGES.length)}>
              {STAGES.map((s, i) => {
                const done = i < activeStage;
                const active = i === activeStage;
                return (
                  <div key={s.key} className="relative h-[3px] flex-1 rounded-full bg-white/[0.08] overflow-hidden">
                    {done && <div className="absolute inset-0 bg-[#FF6D29]" />}
                    {active && (
                      <div
                        className="absolute inset-y-0 w-2/5 rounded-full bg-gradient-to-r from-transparent via-[#FF6D29] to-transparent"
                        style={{ animation: "pl-sweep 1.6s ease-in-out infinite" }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Stage timeline */}
            <ol className="space-y-5">
              {STAGES.map((s, i) => {
                const done = i < activeStage;
                const active = i === activeStage;
                return (
                  <li key={s.key} className={`flex gap-4 transition-opacity duration-500 ${!done && !active ? "opacity-35" : ""}`}>
                    <div className="mt-[3px] w-4 h-4 shrink-0 flex items-center justify-center">
                      {done ? (
                        <Check className="w-4 h-4 text-[#FF6D29] stroke-[2.5]" />
                      ) : active ? (
                        <span
                          className="w-2 h-2 rounded-full bg-[#FF6D29] shadow-[0_0_10px_rgba(255,109,41,0.8)]"
                          style={{ animation: "pl-breathe 1.4s ease-in-out infinite" }}
                        />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className={`text-[15px] ${active ? "text-white font-medium" : done ? "text-[#d6d2cf]" : "text-[#BABABA]"}`}>
                          {s.title}
                        </span>
                        <span className="text-[11px] font-mono text-[#8a8480] tabular-nums shrink-0">{stageDetail(i)}</span>
                      </div>

                      {active && i !== 1 && <p className="text-[13px] text-[#8a8480] mt-1">{s.idle}</p>}

                      {/* Per-document state: real, from the backend */}
                      {i === 1 && (active || done) && evidence.length > 0 && (
                        <ul className="mt-3 space-y-2">
                          {evidence.map((ev) => (
                            <li key={ev.evidenceId} className="flex items-center justify-between text-[13px]">
                              <span className="text-[#BABABA] truncate pr-4">{docLabel(ev.type)}</span>
                              <span
                                className={`inline-flex items-center gap-2 font-mono text-[11px] shrink-0 ${
                                  ev.state === "EXTRACTED"
                                    ? "text-[#d6d2cf]"
                                    : ev.state === "FAILED"
                                      ? "text-red-400"
                                      : ev.state === "RETRYING"
                                        ? "text-[#FFA776]"
                                        : "text-[#8a8480]"
                                }`}
                              >
                                {(ev.state === "READING" || ev.state === "RETRYING") && (
                                  <span className="w-1 h-1 rounded-full bg-current" style={{ animation: "pl-breathe 1.1s ease-in-out infinite" }} />
                                )}
                                {ev.state === "EXTRACTED" && <Check className="w-3 h-3 text-[#FF6D29]" />}
                                {stateText[ev.state]}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>

            {/* Activity log: verbatim backend events */}
            {recentEvents.length > 0 && (
              <div className="mt-10 pt-5 border-t border-white/[0.07]">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6f6a66] mb-3">Activity</div>
                <ul className="space-y-1.5">
                  {recentEvents.map((ev, idx) => (
                    <li key={`${ev.at}-${idx}`} className={`flex gap-3 text-[12px] ${idx === 0 ? "text-[#d6d2cf]" : "text-[#8a8480]"}`}>
                      <span className="font-mono text-[#6f6a66] tabular-nums shrink-0">{fmtClock(ev.at)}</span>
                      <span className="truncate">{ev.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between text-[11px] font-mono text-[#6f6a66]">
              <span>Elapsed {fmtElapsed(elapsed)}</span>
              <span>{isDone ? "Opening report" : "You can leave this page open"}</span>
            </div>
          </>
        )}
      </div>

      {/* Secondary area: rotating verified insights */}
      <div className="w-full max-w-2xl mx-auto pb-4">
        <VerificationInsight intervalMs={8000} />
      </div>
    </GlowBackground>
  );
};
