import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { GlowBackground } from "../components/ui/GlowBackground";
import { CaseService } from "../services/case.service";
import { EvidenceService } from "../services/evidence.service";
import { VerificationClientService } from "../services/verification.service";
import { CaseItem, EvidenceItem, VerificationReport } from "../types";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Scale,
  FileText,
  ExternalLink,
  RefreshCw,
  Network,
} from "lucide-react";
import gsap from "gsap";
import { ProofGraphModal } from "../components/graph/ProofGraphModal";
import { SimulationBanner } from "../components/SimulationBanner";
import { SimulationModal } from "../components/simulation/SimulationModal";
import { ProofPacketModal } from "../components/proofPacket/ProofPacketModal";
import { useSimulation } from "../context/SimulationContext";
import { HumanReviewSection } from "../components/review/HumanReviewSection";
import { CaseReviewSummary } from "../types";
import { FlaskConical, FileCheck } from "lucide-react";

export const VerificationReportPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();

  const { isSimulating, simulationResult } = useSimulation();
  const [showSimModal, setShowSimModal] = useState(false);
  const [showPacketModal, setShowPacketModal] = useState(false);

  const [caseItem, setCaseItem] = useState<CaseItem | null>(null);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [reviewSummary, setReviewSummary] = useState<CaseReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGraphModal, setShowGraphModal] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const reconciliationRef = useRef<HTMLDivElement>(null);
  const findingsRef = useRef<HTMLDivElement>(null);
  const evidenceRef = useRef<HTMLDivElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    if (!caseId) return;
    try {
      setLoading(true);
      setError(null);

      const [c, e, r, rev] = await Promise.all([
        CaseService.getCase(caseId),
        EvidenceService.listEvidence(caseId),
        VerificationClientService.getReport(caseId),
        CaseService.getReviewSummary(caseId).catch(() => null),
      ]);

      setCaseItem(c);
      setEvidenceList(e);
      setReport(r);
      setReviewSummary(rev);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load verification report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [caseId]);

  // Sequential GSAP reveal once data is loaded
  useEffect(() => {
    if (loading || !report) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        [
          heroRef.current,
          reconciliationRef.current,
          findingsRef.current,
          evidenceRef.current,
          reviewRef.current,
        ],
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: "power2.out",
        }
      );
    });

    return () => ctx.revert();
  }, [loading, report]);

  if (loading) {
    return (
      <GlowBackground className="min-h-screen flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="rounded-3xl bg-[#141215]/85 border border-white/10 p-12 text-center backdrop-blur-xl">
            <RefreshCw className="w-6 h-6 text-[#FF6D29] animate-spin mx-auto mb-3" />
            <p className="text-xs font-display text-[#BABABA]">Compiling verification report...</p>
          </div>
        </div>
      </GlowBackground>
    );
  }

  if (error || !caseItem || !report) {
    return (
      <GlowBackground className="min-h-screen flex flex-col">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="rounded-3xl bg-[#141215]/85 border border-white/10 p-10 backdrop-blur-xl">
            <h2 className="text-base font-display font-medium text-white mb-2">Report Unavailable</h2>
            <p className="text-xs font-display text-[#BABABA] mb-6">
              {error || "Verification has not yet been executed for this case."}
            </p>
            <Link
              to={`/cases/${caseId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-display text-white transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Case</span>
            </Link>
          </div>
        </div>
      </GlowBackground>
    );
  }

  // Derive effective report and case context based on whether simulation is active
  const effectiveReport: VerificationReport = isSimulating && simulationResult
    ? {
        overallRisk: simulationResult.verification.overallRisk,
        status: simulationResult.verification.status,
        summary: simulationResult.verification.summary,
        calculatedValues: simulationResult.verification.calculatedValues,
        ruleResults: simulationResult.verification.ruleResults,
        findings: simulationResult.verification.findings,
        verifiedAt: simulationResult.verification.verifiedAt,
      }
    : report;

  const effectiveRisk = isSimulating && simulationResult
    ? simulationResult.verification.overallRisk
    : caseItem.riskLevel || "LOW";

  const isLowRisk = effectiveRisk === "LOW";
  const variance = effectiveReport.calculatedValues.variancePercentage ?? 0;
  const tolerancePassed = Math.abs(variance) <= 2.0;

  // Breakdown scale documents vs invoice
  const scaleEvidence = evidenceList.filter((e) => e.type === "SCALE_IMAGE");
  const invoiceEvidence = evidenceList.find((e) => e.type === "INVOICE");

  return (
    <GlowBackground className="min-h-screen flex flex-col">
      <SimulationBanner />
      <Navbar />

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 pt-2 pb-24 flex-1 space-y-8 font-display">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <Link
            to={`/cases/${caseId}`}
            className="inline-flex items-center gap-2 text-xs font-display text-[#BABABA] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Case Workspace</span>
          </Link>

          <div className="text-[11px] font-mono text-[#BABABA]">
            OFFICIAL AUDIT REPORT // <span className="text-white font-medium">{caseItem.transactionId}</span>
          </div>
        </div>

        {/* 1. REPORT HERO: Dominant Primary Result */}
        <section
          ref={heroRef}
          className={`rounded-3xl border p-8 sm:p-12 shadow-[0_24px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl relative overflow-hidden transition-all duration-300 ${
            isSimulating
              ? "bg-[#181014]/95 border-[#FF6D29]/50 shadow-[0_0_50px_rgba(255,109,41,0.2)]"
              : "bg-[#141215]/90 border-white/10"
          }`}
        >
          {/* Subtle amber / orange ambient top corner bloom */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF6D29]/15 rounded-full blur-[90px] pointer-events-none" />

          {/* Top Tag & Badges */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#FF6D29]">
                  {isSimulating ? "ADVERSARIAL SIMULATION ARTIFACT" : "Deterministic Audit Artifact"}
                </span>
                {isSimulating && (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#FF6D29] bg-[#FF6D29]/20 border border-[#FF6D29]/40 px-2 py-0.5 rounded-full animate-pulse">
                    SIMULATED RESULT
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white leading-tight">
                {isSimulating ? (
                  <>
                    Simulation:{" "}
                    <span className="font-mono text-[#FF6D29]">{simulationResult?.scenarioTitle}</span>
                  </>
                ) : (
                  <>
                    Verification Report:{" "}
                    <span className="font-mono text-[#FFA776]">{caseItem.transactionId}</span>
                  </>
                )}
              </h1>
              {isSimulating && simulationResult && (
                <p className="text-xs text-[#BABABA] mt-1 max-w-2xl leading-relaxed">
                  {simulationResult.scenarioDescription}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${
                  isLowRisk
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-[#FF6D29]/40 bg-[#FF6D29]/20 text-[#FFA776]"
                }`}
              >
                {isLowRisk ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-[#FF6D29]" />
                    <span>Review Required</span>
                  </>
                )}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-mono font-medium ${
                  isLowRisk
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-red-500/40 bg-red-500/15 text-red-300"
                }`}
              >
                <span>Risk: {effectiveRisk}</span>
              </span>

              {/* Export Proof Packet Action Button */}
              <button
                type="button"
                onClick={() => setShowPacketModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#FF6D29] to-[#E04516] text-white text-xs font-display font-medium shadow-[0_2px_14px_rgba(255,109,41,0.3)] hover:shadow-[0_2px_20px_rgba(255,109,41,0.45)] transition-all cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Export Proof Packet</span>
              </button>

              {/* View Proof Graph Button */}
              <button
                type="button"
                onClick={() => setShowGraphModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#161316] hover:bg-[#1f1a1f] border border-[#FF6D29]/40 hover:border-[#FF6D29]/70 text-xs font-display font-medium text-[#FFA776] hover:text-white transition-all shadow-[0_2px_12px_rgba(255,109,41,0.15)] cursor-pointer"
              >
                <Network className="w-3.5 h-3.5 text-[#FF6D29]" />
                <span>View Proof Graph</span>
              </button>

              {/* Simulate Discrepancy Secondary Action Button */}
              <button
                type="button"
                onClick={() => setShowSimModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-xs font-display font-medium text-[#BABABA] hover:text-white transition cursor-pointer"
              >
                <FlaskConical className="w-3.5 h-3.5 text-[#FF6D29]" />
                <span>{isSimulating ? "Switch Scenario" : "Simulate discrepancy"}</span>
              </button>
            </div>
          </div>

          {/* Visually Dominant Primary Result Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 sm:p-8 rounded-2xl bg-black/50 border border-white/[0.08] items-center text-center">
            {/* Measured */}
            <div className="space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#BABABA]">
                Measured Weight
              </div>
              <div className="text-3xl sm:text-4xl font-semibold font-mono text-white tracking-tight">
                {effectiveReport.calculatedValues.measuredWeight ?? "—"}{" "}
                <span className="text-sm text-[#BABABA]">{effectiveReport.calculatedValues.unit || "kg"}</span>
              </div>
              <div className="text-[11px] text-[#BABABA]">Physical scale verification sum</div>
            </div>

            {/* Vs & Variance badge */}
            <div className="flex flex-col items-center justify-center space-y-2 py-2 border-y md:border-y-0 md:border-x border-white/[0.08]">
              <div className="text-xs uppercase tracking-widest font-mono text-[#BABABA]/60">vs</div>
              <div
                className={`text-2xl font-bold font-mono ${
                  tolerancePassed ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {effectiveReport.calculatedValues.variancePercentage ?? 0}%
              </div>
              <div
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase ${
                  tolerancePassed
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                    : "bg-red-500/15 border border-red-500/30 text-red-300"
                }`}
              >
                {tolerancePassed ? "Within 2.0% Tolerance" : "Exceeds Tolerance"}
              </div>
            </div>

            {/* Claimed */}
            <div className="space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#BABABA]">
                Claimed Weight
              </div>
              <div className="text-3xl sm:text-4xl font-semibold font-mono text-white tracking-tight">
                {effectiveReport.calculatedValues.claimedWeight ?? "—"}{" "}
                <span className="text-sm text-[#BABABA]">{effectiveReport.calculatedValues.unit || "kg"}</span>
              </div>
              <div className="text-[11px] text-[#BABABA]">Declared invoice specification</div>
            </div>
          </div>

          {/* Bottom Difference Note & Proof Graph Action */}
          <div className="mt-6 pt-5 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#BABABA]">
              Absolute discrepancy:{" "}
              <span className="font-mono text-white font-medium">
                {report.calculatedValues.differenceWeight !== undefined
                  ? `${Math.abs(report.calculatedValues.differenceWeight)} kg`
                  : "—"}
              </span>{" "}
              &bull; Verified against {evidenceList.length} physical documents with complete provenance.
            </div>

            <button
              onClick={() => setShowGraphModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6D29] to-[#E04516] text-white text-xs font-display font-medium shadow-[0_0_20px_rgba(255,109,41,0.35)] hover:shadow-[0_0_28px_rgba(255,109,41,0.55)] transition-all cursor-pointer shrink-0"
            >
              <Network className="w-3.5 h-3.5" />
              <span>View Proof Graph</span>
            </button>
          </div>
        </section>

        {/* 2. RECONCILIATION BREAKDOWN */}
        <section
          ref={reconciliationRef}
          className="rounded-3xl bg-[#141215]/85 border border-white/10 p-6 sm:p-8 shadow-[0_20px_45px_rgba(0,0,0,0.7)] backdrop-blur-xl"
        >
          <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-white/10">
            <div className="w-8 h-8 rounded-lg bg-[#FF6D29]/15 border border-[#FF6D29]/30 flex items-center justify-center text-[#FF6D29]">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                Reconciliation Breakdown
              </h2>
              <p className="text-xs text-[#BABABA]">
                Cross-document weight synthesis and arithmetic proof
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Declared Invoice */}
            <div className="rounded-2xl bg-black/40 border border-white/[0.06] p-5 space-y-4">
              <div className="text-xs uppercase font-mono tracking-wider text-[#FFA776]">
                Declared Invoice Baseline
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div>
                  <div className="text-xs font-medium text-white">Commercial Invoice</div>
                  <div className="text-[11px] text-[#BABABA]">{invoiceEvidence?.file.name || "Declared Manifest"}</div>
                </div>
                <div className="text-sm font-mono font-medium text-white">
                  {report.calculatedValues.claimedWeight !== undefined
                    ? `${report.calculatedValues.claimedWeight} kg`
                    : `${caseItem.claimedQuantity} ${caseItem.unit}`}
                </div>
              </div>
              <div className="text-xs text-[#BABABA] leading-relaxed">
                Counterparty <span className="text-white font-medium">{caseItem.partnerName}</span> billed for {caseItem.claimedQuantity} {caseItem.unit} of {caseItem.material}.
              </div>
            </div>

            {/* Right: Scale Slips Aggregation */}
            <div className="rounded-2xl bg-black/40 border border-white/[0.06] p-5 space-y-3">
              <div className="text-xs uppercase font-mono tracking-wider text-[#FFA776]">
                Physical Scale Measurements
              </div>
              <div className="space-y-2">
                {scaleEvidence.length === 0 ? (
                  <div className="text-xs text-[#BABABA]/60 italic py-1">
                    No physical scale tickets submitted for this case.
                  </div>
                ) : (
                  scaleEvidence.map((s, idx) => {
                    const weightVal = (s.extraction?.data?.["weight"] as number | undefined);
                    return (
                      <div key={s._id || idx} className="flex items-center justify-between text-xs">
                        <span className="text-[#BABABA]">
                          Scale Ticket 0{idx + 1} ({s.file.name})
                        </span>
                        <span className="font-mono text-white font-medium">
                          {weightVal !== undefined ? `${weightVal} kg` : "Measurement unavailable"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Total Row */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Measured Total
                </span>
                <span className="text-base font-mono font-bold text-white">
                  {effectiveReport.calculatedValues.measuredWeight ?? "—"} kg
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. FINDINGS SECTION */}
        <section
          ref={findingsRef}
          className="rounded-3xl bg-[#141215]/85 border border-white/10 p-6 sm:p-8 shadow-[0_20px_45px_rgba(0,0,0,0.7)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                Audit Findings & Discrepancies
              </h2>
              <p className="text-xs text-[#BABABA]">
                Automated rule-based compliance evaluation
              </p>
            </div>
            <span className="text-xs font-mono text-[#BABABA]">
              {effectiveReport.findings.length} Finding(s)
            </span>
          </div>

          {effectiveReport.findings.length === 0 ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-white text-sm">NO DISCREPANCIES DETECTED</div>
                <p className="mt-1 text-emerald-300/80 leading-relaxed">
                  All submitted measurements are within the configured 2.0% tolerance threshold. Identifiers, dates, and entities match across all documents.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {effectiveReport.findings.map((f) => (
                <div
                  key={f.findingId}
                  className="p-5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#FFA776] shrink-0" />
                      <h3 className="font-medium text-sm text-white">{f.title}</h3>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-[#BABABA]">
                      {f.severity}
                    </span>
                  </div>
                  <p className="text-xs text-[#BABABA] leading-relaxed">{f.description}</p>
                  {f.recommendedAction && (
                    <div className="text-xs text-[#FFA776]">
                      <span className="font-medium">Recommended Action:</span> {f.recommendedAction}
                    </div>
                  )}
                  {f.evidenceIds && f.evidenceIds.length > 0 && (
                    <div className="text-[11px] font-mono text-[#BABABA]/50 pt-2 border-t border-white/[0.06]">
                      Provenance: {f.evidenceIds.join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 4. EVIDENCE CATALOG WITH EXTRACTED MEASUREMENTS */}
        <section
          ref={evidenceRef}
          className="rounded-3xl bg-[#141215]/85 border border-white/10 p-6 sm:p-8 shadow-[0_20px_45px_rgba(0,0,0,0.7)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                Evidence Provenance Catalog
              </h2>
              <p className="text-xs text-[#BABABA]">
                Submitted documents and extracted facts with source asset links
              </p>
            </div>
            <span className="text-xs font-mono text-[#BABABA]">{evidenceList.length} File(s)</span>
          </div>

          <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/40">
            <table className="w-full text-left text-xs text-white border-collapse font-display">
              <thead className="bg-white/[0.02] border-b border-white/10 text-[11px] uppercase tracking-wider text-[#BABABA]">
                <tr>
                  <th className="px-5 py-3 font-medium">Evidence</th>
                  <th className="px-5 py-3 font-medium">Classification</th>
                  <th className="px-5 py-3 font-medium text-center">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Extracted Measurement</th>
                  <th className="px-5 py-3 font-medium text-right">Asset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {evidenceList.map((ev, i) => {
                  const extractedWeight =
                    (ev.extraction?.data?.["weight"] as number | undefined) ??
                    (ev.extraction?.data?.["quantity"] as number | undefined);

                  return (
                    <tr key={ev._id || i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-3.5 h-3.5 text-[#FF6D29] shrink-0" />
                          <div>
                            <div className="text-white font-medium">{ev.file.name}</div>
                            <div className="text-[10px] font-mono text-[#BABABA]/50">{ev.evidenceId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-[11px] text-[#BABABA]">
                          {ev.type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[11px] border text-emerald-400 bg-emerald-500/10 border-emerald-500/20 font-mono">
                          EXTRACTED
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-medium text-white">
                        {extractedWeight !== undefined ? (
                          `${extractedWeight} kg`
                        ) : (
                          <span className="text-[#BABABA]/50 italic text-[11px] font-sans">
                            Measurement unavailable
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <a
                          href={ev.file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1 rounded-lg text-white transition"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3 text-[#FF6D29]" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. HUMAN REVIEW & RESOLUTION WORKFLOW */}
        {caseId && (
          <section ref={reviewRef}>
            <HumanReviewSection
              caseId={caseId}
              initialSummary={reviewSummary}
              isSimulated={isSimulating}
              onDecisionUpdated={(updatedSummary) => {
                setReviewSummary(updatedSummary);
                loadData();
              }}
            />
          </section>
        )}
      </main>

      {/* Interactive Proof Graph Modal */}
      {caseItem && (
        <ProofGraphModal
          caseId={caseId!}
          isOpen={showGraphModal}
          onClose={() => setShowGraphModal(false)}
          initialGraphData={isSimulating && simulationResult ? simulationResult.proofGraph : undefined}
          isSimulated={isSimulating}
        />
      )}

      {/* Adversarial Discrepancy Simulator Modal */}
      {caseItem && (
        <SimulationModal
          caseId={caseId!}
          isOpen={showSimModal}
          onClose={() => setShowSimModal(false)}
        />
      )}

      {/* Proof Packet Export Modal */}
      {caseItem && (
        <ProofPacketModal
          caseId={caseId!}
          transactionId={caseItem.transactionId}
          isOpen={showPacketModal}
          onClose={() => setShowPacketModal(false)}
          isSimulated={isSimulating}
        />
      )}
    </GlowBackground>
  );
};

