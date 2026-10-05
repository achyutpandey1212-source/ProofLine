import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { GlowBackground } from "../components/ui/GlowBackground";
import { CustomSelect } from "../components/ui/CustomSelect";
import { CaseService } from "../services/case.service";
import { EvidenceService } from "../services/evidence.service";
import { VerificationClientService } from "../services/verification.service";
import {
  CaseItem,
  EvidenceItem,
  EvidenceType,
  VerificationReport,
} from "../types";
import {
  ArrowLeft,
  Upload,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  AlertCircle,
  Scale,
  RefreshCw,
  ExternalLink,
  Network,
  FlaskConical,
  FileCheck,
} from "lucide-react";
import { ProofGraphModal } from "../components/graph/ProofGraphModal";
import { SimulationBanner } from "../components/SimulationBanner";
import { SimulationModal } from "../components/simulation/SimulationModal";
import { ProofPacketModal } from "../components/proofPacket/ProofPacketModal";
import { useSimulation } from "../context/SimulationContext";

const EVIDENCE_TYPE_OPTIONS = [
  { value: "SCALE_IMAGE", label: "Scale Image (Display Weighing)" },
  { value: "INVOICE", label: "Commercial Invoice" },
  { value: "RECEIPT", label: "Weighbridge / Cash Receipt" },
  { value: "CERTIFICATE", label: "Recycling Certificate" },
  { value: "MATERIAL_IMAGE", label: "Material Photo" },
  { value: "DOCUMENT", label: "Supporting Document" },
  { value: "VIDEO", label: "Video Evidence" },
  { value: "OTHER", label: "Other Evidence" },
];

export const CaseDetailPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();

  const { isSimulating, simulationResult } = useSimulation();
  const [showSimModal, setShowSimModal] = useState(false);
  const [showPacketModal, setShowPacketModal] = useState(false);

  // State
  const [caseItem, setCaseItem] = useState<CaseItem | null>(null);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [showGraphModal, setShowGraphModal] = useState(false);

  // UX states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Upload Form
  const [selectedType, setSelectedType] = useState<EvidenceType>("SCALE_IMAGE");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (caseId) {
      loadInitialData();
    }
  }, [caseId]);

  const loadInitialData = async () => {
    if (!caseId) return;
    try {
      setLoading(true);
      setError(null);

      const [cData, eData] = await Promise.all([
        CaseService.getCase(caseId),
        EvidenceService.listEvidence(caseId),
      ]);
      setCaseItem(cData);
      setEvidenceList(eData);

      if (cData.status === "VERIFICATION_COMPLETE" || cData.status === "REVIEW_REQUIRED") {
        try {
          const rData = await VerificationClientService.getReport(caseId);
          setReport(rData);
        } catch {
          // Report not yet available
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load case details.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId || !selectedFile) {
      setUploadError("Please select a file to upload.");
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      await EvidenceService.uploadEvidence(caseId, selectedFile, selectedType);

      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      const updatedEvidence = await EvidenceService.listEvidence(caseId);
      setEvidenceList(updatedEvidence);

      const updatedCase = await CaseService.getCase(caseId);
      setCaseItem(updatedCase);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Evidence upload failed.");
    } finally {
      setUploading(false);
    }
  };

  

  const navigate = useNavigate();

  const handleStartVerification = () => {
    if (!caseId) return;
    navigate(`/cases/${caseId}/verify`);
  };

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case "VERIFICATION_COMPLETE":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-display font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified</span>
          </span>
        );
      case "REVIEW_REQUIRED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#FF6D29]/35 bg-[#FF6D29]/15 text-[#FFA776] text-xs font-display font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Review Required</span>
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-display font-medium">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>In Progress</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[#BABABA] text-xs font-display font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>{status || "Created"}</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <GlowBackground className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="rounded-3xl bg-[#141215]/85 border border-white/10 p-12 text-center backdrop-blur-xl">
            <RefreshCw className="w-6 h-6 text-[#FF6D29] animate-spin mx-auto mb-3" />
            <p className="text-xs font-display text-[#BABABA]">Loading case record...</p>
          </div>
        </div>
      </GlowBackground>
    );
  }

  if (!caseItem) {
    return (
      <GlowBackground className="flex flex-col min-h-screen">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="rounded-3xl bg-[#141215]/85 border border-white/10 p-10 backdrop-blur-xl">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 mx-auto mb-3 flex items-center justify-center text-red-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h2 className="text-base font-display font-medium text-white">Case Not Found</h2>
            <p className="text-xs font-display text-[#BABABA] mt-1 mb-5">
              The requested verification record could not be found.
            </p>
            <Link
              to="/cases"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-display text-white transition"
            >
              Return to Cases
            </Link>
          </div>
        </div>
      </GlowBackground>
    );
  }

  return (
    <GlowBackground className="flex flex-col min-h-screen">
      <SimulationBanner />
      {/* Reusable floating cylindrical glassmorphism Navbar */}
      <Navbar />

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-20 flex-1 space-y-6 sm:space-y-8">
        {/* Navigation Breadcrumb & Engine Trigger */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <Link
            to="/cases"
            className="inline-flex items-center gap-2 text-xs font-display text-[#BABABA] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Cases</span>
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            {/* Subtle secondary action: Simulate discrepancy */}
            <button
              type="button"
              onClick={() => setShowSimModal(true)}
              disabled={evidenceList.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-xs font-display text-[#BABABA] hover:text-white transition cursor-pointer disabled:opacity-40"
              title="Test how Proofline responds when submitted evidence conflicts"
            >
              <FlaskConical className="w-3.5 h-3.5 text-[#FF6D29]" />
              <span>{isSimulating ? "Switch Scenario" : "Simulate discrepancy"}</span>
            </button>

            {report && (
              <>
                <button
                  type="button"
                  onClick={() => setShowGraphModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-[#FF6D29]/30 text-xs font-display text-[#FFA776] hover:text-white transition cursor-pointer"
                >
                  <Network className="w-3.5 h-3.5 text-[#FF6D29]" />
                  <span>Proof Graph</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPacketModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-display text-white transition cursor-pointer"
                  title="Export auditable Proof Packet PDF"
                >
                  <FileCheck className="w-3.5 h-3.5 text-[#FF6D29]" />
                  <span>Proof Packet</span>
                </button>
                <Link
                  to={`/cases/${caseId}/verification`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-display text-white transition"
                >
                  <FileText className="w-3.5 h-3.5 text-[#FF6D29]" />
                  <span>Verification Report</span>
                </Link>
              </>
            )}
            <button
              onClick={handleStartVerification}
              disabled={evidenceList.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6D29] hover:bg-[#ff7b3d] text-white disabled:opacity-40 text-xs font-display font-medium transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{report ? "Re-Run Verification" : "Run Verification Engine"}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5 text-xs text-red-300 font-display">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section A: Case Overview Glass Card */}
        <div className="rounded-2xl bg-[#110F11]/80 border border-white/[0.08] p-6 sm:p-8 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5 mb-5">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-display font-semibold text-white tracking-tight">
                  {caseItem.transactionId}
                </h1>
                {renderStatusBadge(caseItem.status)}
              </div>
              <p className="text-xs font-mono text-[#BABABA] mt-1">ID: {caseItem.caseId}</p>
            </div>

            {caseItem.riskLevel && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-display text-[#BABABA]">Risk Assessment:</span>
                <span
                  className={`text-xs font-mono font-medium px-2.5 py-0.5 rounded-full border ${
                    caseItem.riskLevel === "LOW"
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                      : "text-[#FFA776] bg-[#FF6D29]/15 border-[#FF6D29]/30"
                  }`}
                >
                  {caseItem.riskLevel}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 font-display">
            <div className="rounded-2xl bg-black/40 border border-white/[0.06] p-3.5">
              <span className="text-[11px] text-[#BABABA] uppercase tracking-wider block mb-1">
                Partner / Recycler
              </span>
              <span className="font-medium text-white text-xs sm:text-sm">{caseItem.partnerName}</span>
            </div>
            <div className="rounded-2xl bg-black/40 border border-white/[0.06] p-3.5">
              <span className="text-[11px] text-[#BABABA] uppercase tracking-wider block mb-1">
                Material
              </span>
              <span className="font-medium text-white text-xs sm:text-sm">{caseItem.material}</span>
            </div>
            <div className="rounded-2xl bg-black/40 border border-white/[0.06] p-3.5">
              <span className="text-[11px] text-[#BABABA] uppercase tracking-wider block mb-1">
                Claimed Quantity
              </span>
              <span className="font-mono font-medium text-white text-xs sm:text-sm">
                {caseItem.claimedQuantity.toLocaleString()} {caseItem.unit}
              </span>
            </div>
            <div className="rounded-2xl bg-black/40 border border-white/[0.06] p-3.5">
              <span className="text-[11px] text-[#BABABA] uppercase tracking-wider block mb-1">
                Evidence Files
              </span>
              <span className="font-mono font-medium text-white text-xs sm:text-sm">
                {evidenceList.length} item(s)
              </span>
            </div>
          </div>
        </div>

        {/* Section B: Verification Result & Findings (When Completed) */}
        {report && (
          <div className="rounded-2xl bg-[#110F11]/80 border border-white/[0.08] p-6 sm:p-8 space-y-6 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#FF6D29]">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-display font-semibold text-white tracking-tight">
                    Reconciliation Results
                  </h2>
                  <p className="text-xs font-display text-[#BABABA]">
                    Deterministic comparison across submitted evidence
                  </p>
                </div>
              </div>
              {renderStatusBadge(caseItem.status)}
            </div>

            {/* Calculated Values Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/[0.08] font-display">
              <div>
                <span className="text-[11px] text-[#BABABA] uppercase tracking-wider block mb-1">
                  Claimed Weight
                </span>
                <span className="text-base font-mono font-medium text-white">
                  {report.calculatedValues.claimedWeight ?? "—"} {report.calculatedValues.unit || "kg"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#BABABA] uppercase tracking-wider block mb-1">
                  Measured Weight
                </span>
                <span className="text-base font-mono font-medium text-white">
                  {report.calculatedValues.measuredWeight ?? "—"} {report.calculatedValues.unit || "kg"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#BABABA] uppercase tracking-wider block mb-1">
                  Difference
                </span>
                <span className="text-base font-mono font-medium text-white">
                  {report.calculatedValues.differenceWeight !== undefined
                    ? `${Math.abs(report.calculatedValues.differenceWeight)} kg`
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#BABABA] uppercase tracking-wider block mb-1">
                  Variance
                </span>
                <span className="text-base font-mono font-medium text-[#FFA776]">
                  {report.calculatedValues.variancePercentage !== undefined
                    ? `${report.calculatedValues.variancePercentage}%`
                    : "—"}
                </span>
              </div>
            </div>

            {/* Findings List */}
            <div>
              <div className="font-display text-xs font-medium text-[#BABABA] uppercase tracking-wider mb-3">
                Findings ({report.findings.length})
              </div>
              {report.findings.length === 0 ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-xs font-display text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>All measurements match within the 2.0% tolerance threshold. No discrepancies detected.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {report.findings.map((f) => (
                    <div
                      key={f.findingId}
                      className="p-4 rounded-2xl bg-black/40 border border-white/[0.08]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-[#FFA776]" />
                          <h3 className="font-medium text-sm text-white font-display">{f.title}</h3>
                        </div>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-[#BABABA]">
                          {f.severity}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-[#BABABA] font-display leading-relaxed">{f.description}</p>
                      {f.recommendedAction && (
                        <div className="mt-2 text-xs font-display text-[#FFA776]">
                          <span className="font-medium">Action:</span> {f.recommendedAction}
                        </div>
                      )}
                      {f.evidenceIds && f.evidenceIds.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/[0.06] text-[11px] font-mono text-[#BABABA]/60">
                          Provenance: {f.evidenceIds.join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section C: Evidence Catalog & Intake */}
        <div className="rounded-2xl bg-[#110F11]/80 border border-white/[0.08] p-6 sm:p-8 space-y-6 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div>
              <h2 className="text-base font-display font-semibold text-white tracking-tight">
                Document Intake & Provenance
              </h2>
              <p className="text-xs font-display text-[#BABABA] mt-0.5">
                Attach weighing slips, scale photos, and commercial invoices
              </p>
            </div>
            
          </div>

          {/* Upload Form */}
          <form
            onSubmit={handleFileUpload}
            className="p-5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-4 font-display"
          >
            {uploadError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[#BABABA] mb-1.5 font-medium">
                  Classification
                </label>
                <CustomSelect
                  options={EVIDENCE_TYPE_OPTIONS}
                  value={selectedType}
                  onChange={(val) => setSelectedType(val as EvidenceType)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-[#BABABA] mb-1.5 font-medium">
                  File Attachment (JPEG, PNG, WEBP, PDF)
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="flex-1 h-11 px-3 py-2 rounded-xl border border-white/10 text-xs font-display text-white bg-black/40 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-white/[0.08] file:text-white cursor-pointer"
                  />
                  <button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    className="inline-flex items-center justify-center gap-1.5 px-5 h-11 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 text-white disabled:opacity-40 text-xs font-medium transition cursor-pointer shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#FF6D29]" />
                    <span>{uploading ? "Ingesting..." : "Upload File"}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Evidence List Table */}
          <div>
            <div className="font-display text-xs font-medium text-[#BABABA] uppercase tracking-wider mb-3">
              Attached Documents ({evidenceList.length})
            </div>
            {evidenceList.length === 0 ? (
              <div className="p-8 rounded-2xl text-center border border-dashed border-white/10 bg-black/30 text-xs font-display text-[#BABABA]">
                No evidence attached yet. Upload scale images and invoices above.
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/40">
                <table className="w-full text-left text-xs text-white border-collapse font-display">
                  <thead className="bg-white/[0.02] border-b border-white/10 text-[11px] uppercase tracking-wider text-[#BABABA]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Evidence ID</th>
                      <th className="px-4 py-3 font-medium">Classification</th>
                      <th className="px-4 py-3 font-medium">File Name</th>
                      <th className="px-4 py-3 font-medium text-center">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Extracted Measurement</th>
                      <th className="px-4 py-3 font-medium text-right">Asset</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {evidenceList.map((ev) => (
                      <tr key={ev._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-white">
                          {ev.evidenceId}
                        </td>
                        <td className="px-4 py-3">
                          <span className="border border-white/10 bg-white/[0.04] px-2 py-0.5 rounded-full text-[11px] text-[#BABABA]">
                            {ev.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-[#FF6D29] shrink-0" />
                          <span className="truncate max-w-xs">{ev.file.name}</span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] border ${
                              ev.status === "EXTRACTED"
                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                : ev.status === "EXTRACTION_FAILED"
                                ? "text-red-400 bg-red-500/10 border-red-500/20"
                                : "text-[#BABABA] bg-white/[0.04] border-white/10"
                            }`}
                          >
                            {ev.status === "EXTRACTED"
                              ? "Reviewed"
                              : ev.status === "EXTRACTION_FAILED"
                              ? "Failed"
                              : "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">
                          {ev.extraction?.data ? (
                            <span className="text-white">
                              {typeof ev.extraction.data["weight"] === "number"
                                ? `${ev.extraction.data["weight"]} kg`
                                : typeof ev.extraction.data["quantity"] === "number"
                                ? `${ev.extraction.data["quantity"]} kg`
                                : "Recorded"}
                            </span>
                          ) : (
                            <span className="text-[#BABABA]/40">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
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

      {/* Auditable Proof Packet Modal */}
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
