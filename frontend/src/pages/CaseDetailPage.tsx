import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "../components/Header";
import { CaseService } from "../services/case.service";
import { EvidenceService } from "../services/evidence.service";
import { VerificationClientService } from "../services/verification.service";
import {
  CaseItem,
  EvidenceItem,
  EvidenceType,
  VerificationReport,
  WorkflowProgress,
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
  Sparkles,
} from "lucide-react";
import { DemoManager } from "../demo/demoRunner";

export const CaseDetailPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();

  // State
  const [caseItem, setCaseItem] = useState<CaseItem | null>(null);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [workflowProgress, setWorkflowProgress] = useState<WorkflowProgress | null>(null);

  // UX states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Upload Form
  const [selectedType, setSelectedType] = useState<EvidenceType>("SCALE_IMAGE");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Polling ref
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (caseId) {
      loadInitialData();
    }
    return () => {
      stopPolling();
    };
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

      // If verified or review required, attempt to fetch verification report
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

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const startPollingProgress = () => {
    if (!caseId) return;
    stopPolling();

    pollingRef.current = setInterval(async () => {
      try {
        const progress = await VerificationClientService.getStatus(caseId);
        setWorkflowProgress(progress);

        if (progress.status === "COMPLETED" || progress.status === "FAILED") {
          stopPolling();
          setVerifying(false);

          // Refresh case data and report
          const updatedCase = await CaseService.getCase(caseId);
          setCaseItem(updatedCase);
          const updatedEvidence = await EvidenceService.listEvidence(caseId);
          setEvidenceList(updatedEvidence);

          if (progress.status === "COMPLETED") {
            const reportData = await VerificationClientService.getReport(caseId);
            setReport(reportData);
          }
        }
      } catch {
        // Transient error during polling - keep polling
      }
    }, 1500);
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

      // Clear input & refresh list
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      const updatedEvidence = await EvidenceService.listEvidence(caseId);
      setEvidenceList(updatedEvidence);

      // Refresh case status
      const updatedCase = await CaseService.getCase(caseId);
      setCaseItem(updatedCase);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Evidence upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadDemoEvidence = async () => {
    if (!caseId) return;
    try {
      setUploading(true);
      setUploadError(null);

      await DemoManager.uploadAllDemoEvidence(caseId);

      const updatedEvidence = await EvidenceService.listEvidence(caseId);
      setEvidenceList(updatedEvidence);

      const updatedCase = await CaseService.getCase(caseId);
      setCaseItem(updatedCase);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to load demo evidence.");
    } finally {
      setUploading(false);
    }
  };

  const handleStartVerification = async () => {
    if (!caseId) return;
    try {
      setVerifying(true);
      setError(null);
      await VerificationClientService.startVerification(caseId);
      startPollingProgress();
    } catch (err) {
      setVerifying(false);
      setError(err instanceof Error ? err.message : "Failed to start verification.");
    }
  };

  const getWorkflowStepLabel = (step?: string) => {
    switch (step) {
      case "LOAD_CASE":
      case "INIT":
        return "Initializing verification context...";
      case "LOAD_EVIDENCE":
      case "EVIDENCE_READINESS":
        return "Collecting uploaded documents...";
      case "EXTRACTION":
        return workflowProgress && workflowProgress.totalEvidence > 0
          ? `Reviewing evidence (${workflowProgress.processedEvidence} of ${workflowProgress.totalEvidence} processed)...`
          : "Reviewing documents...";
      case "EXTRACTION_VALIDATION":
        return "Validating factual records...";
      case "NORMALIZATION":
      case "VERIFICATION":
        return "Reconciling weights and cross-checking records...";
      case "FINDINGS":
      case "RISK_ASSESSMENT":
      case "FINAL_PERSISTENCE":
        return "Finalizing verification report...";
      case "COMPLETED":
        return "Verification completed successfully.";
      case "FAILED":
        return "Verification could not be completed.";
      default:
        return "Verification in progress...";
    }
  };

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case "VERIFICATION_COMPLETE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border border-black text-xs font-mono font-bold uppercase">
            <CheckCircle2 className="w-3.5 h-3.5 text-black" />
            <span>VERIFIED</span>
          </span>
        );
      case "REVIEW_REQUIRED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border border-black text-xs font-mono font-bold uppercase underline">
            <AlertTriangle className="w-3.5 h-3.5 text-black" />
            <span>REVIEW REQUIRED</span>
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border border-gray-400 text-xs font-mono uppercase text-gray-700">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>IN PROGRESS</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border border-gray-300 text-xs font-mono uppercase text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{status || "CREATED"}</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-gray-600">LOADING_CASE_RECORD...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="w-10 h-10 border border-black mx-auto mb-3 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-black" />
          </div>
          <h2 className="text-base font-bold text-black font-mono">CASE_NOT_FOUND</h2>
          <p className="text-xs text-gray-600 mt-1">The requested verification record could not be found.</p>
          <div className="mt-6">
            <Link to="/cases" className="text-xs font-mono underline hover:no-underline text-black">
              RETURN_TO_INDEX
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Header />

      <main className="max-w-6xl w-full mx-auto px-4 py-8 flex-1 space-y-6">
        {/* Navigation Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-black">
          <Link
            to="/cases"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-700 hover:text-black transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK_TO_CASES</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handleStartVerification}
              disabled={verifying || evidenceList.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 border border-black bg-black text-white hover:bg-white hover:text-black disabled:opacity-50 text-xs font-mono transition cursor-pointer"
            >
              {verifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>VERIFYING_EVIDENCE...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>RUN VERIFICATION ENGINE</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 border border-black bg-gray-50 flex items-center gap-3 text-xs font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>[ERROR]: {error}</span>
          </div>
        )}

        {/* Section A: Case Information */}
        <div className="border border-black p-6 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-300 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-black font-mono tracking-tight">
                  {caseItem.caseId}
                </h1>
                {renderStatusBadge(caseItem.status)}
              </div>
              <p className="text-xs font-mono text-gray-600 mt-1">Transaction Ref: {caseItem.transactionId}</p>
            </div>

            {caseItem.riskLevel && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-500 uppercase">RISK_ASSESSMENT:</span>
                <span className="text-xs font-mono font-bold border border-black px-2 py-0.5">
                  [{caseItem.riskLevel}]
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans">
            <div className="border border-gray-200 p-3">
              <span className="text-xs text-gray-500 font-mono uppercase block mb-1">
                Partner / Recycler
              </span>
              <span className="font-bold text-black">{caseItem.partnerName}</span>
            </div>
            <div className="border border-gray-200 p-3">
              <span className="text-xs text-gray-500 font-mono uppercase block mb-1">
                Material
              </span>
              <span className="font-bold text-black">{caseItem.material}</span>
            </div>
            <div className="border border-gray-200 p-3">
              <span className="text-xs text-gray-500 font-mono uppercase block mb-1">
                Claimed Quantity
              </span>
              <span className="font-bold text-black font-mono">
                {caseItem.claimedQuantity.toLocaleString()} {caseItem.unit}
              </span>
            </div>
            <div className="border border-gray-200 p-3">
              <span className="text-xs text-gray-500 font-mono uppercase block mb-1">
                Evidence Files
              </span>
              <span className="font-bold text-black font-mono">{evidenceList.length} item(s)</span>
            </div>
          </div>
        </div>

        {/* Live Verification Progress Panel */}
        {verifying && (
          <div className="border border-black p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-300">
              <div className="flex items-center gap-2 font-mono text-xs font-bold">
                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>ORCHESTRATION_PIPELINE: ACTIVE</span>
              </div>
              <span className="text-xs font-mono text-gray-600">RESUMABLE_WORKFLOW</span>
            </div>
            <p className="text-xs font-mono text-black">
              &gt; {getWorkflowStepLabel(workflowProgress?.step)}
            </p>
            {workflowProgress && (
              <div className="mt-3 border border-gray-300 p-2 flex items-center justify-between text-xs font-mono text-gray-700 bg-white">
                <span>PROGRESS: {workflowProgress.processedEvidence} / {workflowProgress.totalEvidence} EVIDENCE PROCESSED</span>
                {workflowProgress.retryCount > 0 && (
                  <span>RETRIES: {workflowProgress.retryCount}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Section E & F: Verification Result & Findings (When Completed) */}
        {report && (
          <div className="border border-black p-6 bg-white space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black pb-4">
              <div>
                <h2 className="text-base font-bold text-black flex items-center gap-2 font-mono uppercase">
                  <Scale className="w-4 h-4 text-black" />
                  <span>Reconciliation & Verification Results</span>
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  Automated deterministic comparison across submitted evidence
                </p>
              </div>
              {renderStatusBadge(caseItem.status)}
            </div>

            {/* Calculated Values Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 border border-black bg-gray-50">
              <div>
                <span className="text-xs font-mono text-gray-600 uppercase block mb-1">Claimed Weight</span>
                <span className="text-base font-bold text-black font-mono">
                  {report.calculatedValues.claimedWeight ?? "—"} {report.calculatedValues.unit || "kg"}
                </span>
              </div>
              <div>
                <span className="text-xs font-mono text-gray-600 uppercase block mb-1">Measured Weight</span>
                <span className="text-base font-bold text-black font-mono">
                  {report.calculatedValues.measuredWeight ?? "—"} {report.calculatedValues.unit || "kg"}
                </span>
              </div>
              <div>
                <span className="text-xs font-mono text-gray-600 uppercase block mb-1">Difference</span>
                <span className="text-base font-bold text-black font-mono">
                  {report.calculatedValues.differenceWeight !== undefined
                    ? `${Math.abs(report.calculatedValues.differenceWeight)} kg`
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-xs font-mono text-gray-600 uppercase block mb-1">Variance</span>
                <span className="text-base font-bold text-black font-mono">
                  {report.calculatedValues.variancePercentage !== undefined
                    ? `${report.calculatedValues.variancePercentage}%`
                    : "—"}
                </span>
              </div>
            </div>

            {/* Findings List */}
            <div>
              <div className="font-mono text-xs font-bold text-gray-700 uppercase mb-3 border-b border-gray-300 pb-1">
                DISCREPANCY_FINDINGS ({report.findings.length})
              </div>
              {report.findings.length === 0 ? (
                <div className="p-4 border border-black bg-white flex items-center gap-3 text-xs font-mono">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-black" />
                  <span>ALL WEIGHING SLIP READINGS MATCH WITHIN THE 2.0% TOLERANCE THRESHOLD. NO DISCREPANCIES DETECTED.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {report.findings.map((f) => (
                    <div
                      key={f.findingId}
                      className="p-4 border border-black bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-black" />
                          <h3 className="font-bold text-sm text-black">{f.title}</h3>
                        </div>
                        <span className="text-xs font-mono font-bold border border-black px-2 py-0.5">
                          [{f.severity}]
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-800 leading-relaxed">{f.description}</p>
                      {f.recommendedAction && (
                        <div className="mt-2 text-xs text-gray-600">
                          <span className="font-mono font-bold uppercase">ACTION REQUIRED:</span> {f.recommendedAction}
                        </div>
                      )}
                      {f.evidenceIds && f.evidenceIds.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200 text-xs font-mono text-gray-500">
                          PROVENANCE: {f.evidenceIds.join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section B & C: Evidence Upload & List */}
        <div className="border border-black p-6 bg-white space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-black pb-4">
            <div>
              <div className="font-mono text-xs text-gray-500 mb-1">EVIDENCE_CATALOG</div>
              <h2 className="text-base font-bold text-black uppercase font-mono">Document Intake & Provenance</h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Attach weighing slips, scale photos, and commercial invoices for deterministic verification.
              </p>
            </div>
            <button
              type="button"
              onClick={handleUploadDemoEvidence}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-black bg-gray-50 hover:bg-black hover:text-white disabled:opacity-50 text-xs font-mono font-bold transition cursor-pointer"
              title="Uploads synthetic invoice and 3 scale images (184.6 kg, 193.2 kg, 177.8 kg)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>LOAD DEMO EVIDENCE (4 FILES)</span>
            </button>
          </div>

          {/* Upload Form */}
          <form
            onSubmit={handleFileUpload}
            className="p-4 border border-black bg-white space-y-4"
          >
            <div className="font-mono text-xs font-bold uppercase">ADD_DOCUMENT</div>

            {uploadError && (
              <div className="p-2 border border-black bg-gray-50 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>[ERROR]: {uploadError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 mb-1">
                  Evidence Classification
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as EvidenceType)}
                  className="w-full px-3 py-2 border border-black bg-white text-xs font-mono text-black"
                >
                  <option value="SCALE_IMAGE">Scale Image (Weighing display)</option>
                  <option value="INVOICE">Commercial Invoice</option>
                  <option value="RECEIPT">Weighbridge / Cash Receipt</option>
                  <option value="CERTIFICATE">Recycling Certificate</option>
                  <option value="MATERIAL_IMAGE">Material Photo</option>
                  <option value="DOCUMENT">Supporting Document</option>
                  <option value="VIDEO">Video Evidence</option>
                  <option value="OTHER">Other Evidence</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-mono uppercase text-gray-700 mb-1">
                  File Attachment (JPEG, PNG, WEBP, PDF)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="flex-1 px-3 py-1.5 border border-black text-xs font-mono text-black bg-white"
                  />
                  <button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-black bg-black text-white hover:bg-white hover:text-black disabled:opacity-50 text-xs font-mono transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploading ? "INGESTING..." : "UPLOAD"}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Evidence List Table */}
          <div>
            <div className="font-mono text-xs font-bold text-gray-700 uppercase mb-3">
              ATTACHED_FILES ({evidenceList.length})
            </div>
            {evidenceList.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-gray-400 bg-gray-50 text-xs font-mono text-gray-600">
                NO EVIDENCE ATTACHED. UPLOAD SCALE IMAGES AND INVOICES ABOVE.
              </div>
            ) : (
              <div className="border border-black overflow-hidden bg-white">
                <table className="w-full text-left text-xs text-black border-collapse">
                  <thead className="bg-gray-100 border-b border-black font-mono uppercase text-gray-700">
                    <tr>
                      <th className="px-4 py-2.5">Evidence ID</th>
                      <th className="px-4 py-2.5">Classification</th>
                      <th className="px-4 py-2.5">File Name</th>
                      <th className="px-4 py-2.5 text-center">Status</th>
                      <th className="px-4 py-2.5 text-right">Extracted Measurement</th>
                      <th className="px-4 py-2.5 text-right">Asset</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {evidenceList.map((ev) => (
                      <tr key={ev._id} className="hover:bg-gray-50 transition border-b border-gray-200">
                        <td className="px-4 py-2.5 font-mono text-xs font-bold">
                          {ev.evidenceId}
                        </td>
                        <td className="px-4 py-2.5 font-mono">
                          <span className="border border-gray-400 px-1.5 py-0.5 text-xs">
                            {ev.type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-black flex-shrink-0" />
                          <span className="truncate max-w-xs">{ev.file.name}</span>
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono">
                          <span className="border border-black px-1.5 py-0.5 text-xs uppercase">
                            {ev.status === "EXTRACTED"
                              ? "REVIEWED"
                              : ev.status === "EXTRACTION_FAILED"
                              ? "FAILED"
                              : "PENDING"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs">
                          {ev.extraction.data ? (
                            <span>
                              {typeof ev.extraction.data["weight"] === "number"
                                ? `${ev.extraction.data["weight"]} kg`
                                : typeof ev.extraction.data["quantity"] === "number"
                                ? `${ev.extraction.data["quantity"]} kg`
                                : "RECORDED"}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <a
                            href={ev.file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-mono border border-black px-2 py-0.5 hover:bg-black hover:text-white transition"
                          >
                            <span>VIEW</span>
                            <ExternalLink className="w-3 h-3" />
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
    </div>
  );
};
