import React, { useState } from "react";
import { VerificationClientService } from "../../services/verification.service";
import {
  FileDown,
  RefreshCw,
  AlertTriangle,
  X,
  FileCheck,
  ShieldCheck,
} from "lucide-react";

interface ProofPacketModalProps {
  caseId: string;
  transactionId: string;
  isOpen: boolean;
  onClose: () => void;
  isSimulated?: boolean;
}

type ExportStep = "READY" | "PREPARING" | "COMPILING" | "GENERATING" | "COMPLETE" | "ERROR";

export const ProofPacketModal: React.FC<ProofPacketModalProps> = ({
  caseId,
  transactionId,
  isOpen,
  onClose,
  isSimulated = false,
}) => {
  const [step, setStep] = useState<ExportStep>("READY");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadBlob, setDownloadBlob] = useState<Blob | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    try {
      setErrorMessage(null);
      setStep("PREPARING");

      // Controlled progression for clear, premium feedback
      await new Promise((r) => setTimeout(r, 450));
      setStep("COMPILING");

      await new Promise((r) => setTimeout(r, 450));
      setStep("GENERATING");

      const blob = await VerificationClientService.downloadProofPacketPdf(caseId);
      setDownloadBlob(blob);
      setStep("COMPLETE");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to generate Proof Packet.");
      setStep("ERROR");
    }
  };

  const handleDownload = () => {
    if (!downloadBlob) return;
    const url = window.URL.createObjectURL(downloadBlob);
    const link = document.createElement("a");
    link.href = url;
    const safeTx = transactionId.replace(/[^a-zA-Z0-9_-]/g, "_");
    link.download = `ProofPacket_${safeTx}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#110e11] border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col font-display">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-[#161216]/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF6D29]/15 border border-[#FF6D29]/30 flex items-center justify-center text-[#FF6D29]">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white tracking-tight">
                  Proof Packet Export
                </h2>
                <span className="font-mono text-xs text-[#FFA776] bg-[#FF6D29]/10 border border-[#FF6D29]/25 px-2 py-0.5 rounded-full">
                  {transactionId}
                </span>
              </div>
              <p className="text-xs text-[#BABABA]">
                Self-contained auditable verification artifact &bull; Vector PDF
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 flex items-center justify-center text-[#BABABA] hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Simulation Guard Warning (Option A: Never masquerade simulated records as official packets) */}
          {isSimulated ? (
            <div className="p-4 rounded-2xl bg-[#201109] border border-[#FF6D29]/40 text-xs text-[#FFA776] space-y-2">
              <div className="flex items-center gap-2 font-semibold uppercase font-mono tracking-wider text-[11px] text-[#FF6D29]">
                <AlertTriangle className="w-4 h-4" />
                <span>Simulation Active</span>
              </div>
              <p className="text-[#BABABA] leading-relaxed">
                You are currently in Adversarial Simulation mode. Official Proof Packets can only be generated from production verified case data.
              </p>
              <div className="pt-2 font-mono text-[11px] text-white">
                Exit simulation to export an official Proof Packet.
              </div>
            </div>
          ) : step === "READY" ? (
            <div className="space-y-4">
              <p className="text-xs text-[#BABABA] leading-relaxed">
                Compile a tight, auditable dossier containing the verified result, exact physical weighbridge measurements, rule evaluations, finding disclosures, and complete evidence provenance.
              </p>

              <div className="rounded-2xl bg-black/40 border border-white/[0.06] p-4 space-y-2 text-xs">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#FFA776]">
                  Packet Inclusions (2–3 Pages)
                </div>
                <ul className="space-y-1.5 text-[#BABABA] text-[11px]">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF6D29]" />
                    <span>Executive Verification Summary &amp; Claim vs Measurement Metrics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF6D29]" />
                    <span>Complete Rule Results &amp; Discrepancy Findings Disclosure</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF6D29]" />
                    <span>Structured Evidence Register with Extracted Facts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF6D29]" />
                    <span>Linear Proof Graph Chain of Custody &amp; Vault References</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : step === "PREPARING" || step === "COMPILING" || step === "GENERATING" ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FF6D29]/10 border border-[#FF6D29]/30 flex items-center justify-center text-[#FF6D29] mx-auto">
                <RefreshCw className="w-6 h-6 animate-spin text-[#FF6D29]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {step === "PREPARING" && "Preparing proof packet..."}
                  {step === "COMPILING" && "Compiling verification evidence & findings..."}
                  {step === "GENERATING" && "Typesetting vector audit dossier..."}
                </div>
                <p className="text-xs text-[#BABABA] mt-1">
                  Extracting deterministic verification records and proof graph provenance...
                </p>
              </div>
            </div>
          ) : step === "COMPLETE" ? (
            <div className="py-4 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Proof Packet Ready</div>
                <p className="text-xs text-[#BABABA] mt-1">
                  Your auditable verification dossier has been compiled and typeset.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage || "An error occurred during export."}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#161216]/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-display text-[#BABABA] hover:text-white transition cursor-pointer"
          >
            {step === "COMPLETE" ? "Done" : "Cancel"}
          </button>

          {!isSimulated && (
            <>
              {step === "READY" && (
                <button
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6D29] to-[#E04516] text-white text-xs font-display font-medium shadow-[0_0_20px_rgba(255,109,41,0.35)] hover:shadow-[0_0_28px_rgba(255,109,41,0.55)] transition-all cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Generate Packet</span>
                </button>
              )}

              {step === "COMPLETE" && (
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-display font-semibold shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              )}

              {step === "ERROR" && (
                <button
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-display transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Export</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
