import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { GlowBackground } from "../components/ui/GlowBackground";
import { CaseService } from "../services/case.service";
import { CaseItem } from "../types";
import { Plus, ArrowRight, AlertCircle, FileSpreadsheet, Sparkles, RefreshCw } from "lucide-react";
import { FullDemoModal } from "../demo/FullDemoModal";

export const CasesListPage: React.FC = () => {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDemoModal, setShowDemoModal] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CaseService.listCases();
      setCases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load verification cases.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFICATION_COMPLETE":
        return {
          label: "Verified",
          style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        };
      case "REVIEW_REQUIRED":
        return {
          label: "Review Required",
          style: "bg-[#FF6D29]/15 text-[#FFA776] border-[#FF6D29]/30",
        };
      case "PROCESSING":
        return {
          label: "Processing",
          style: "bg-amber-500/10 text-amber-300 border-amber-500/20",
        };
      case "EVIDENCE_READY":
        return {
          label: "Ready",
          style: "bg-blue-500/10 text-blue-300 border-blue-500/20",
        };
      case "EVIDENCE_UPLOADING":
        return {
          label: "Uploading",
          style: "bg-white/[0.06] text-[#BABABA] border-white/10",
        };
      default:
        return {
          label: status,
          style: "bg-white/[0.04] text-[#BABABA] border-white/5",
        };
    }
  };

  const getRiskBadge = (risk?: string) => {
    switch (risk) {
      case "LOW":
        return <span className="text-xs text-emerald-400 font-mono">Low</span>;
      case "HIGH":
        return <span className="text-xs text-red-400 font-mono font-medium">High</span>;
      case "REVIEW_REQUIRED":
        return <span className="text-xs text-[#FFA776] font-mono font-medium">Review</span>;
      default:
        return <span className="text-xs text-[#BABABA]/40 font-mono">&mdash;</span>;
    }
  };

  return (
    <GlowBackground className="flex flex-col min-h-screen">
      {/* Reusable floating cylindrical glassmorphism Navbar */}
      <Navbar />

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-20 flex-1">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-tight">
              Verification{" "}
              <span className="font-serif italic font-normal text-[#FFA776] bg-gradient-to-r from-[#FFD2B8] via-[#FF8A50] to-[#FF6D29] bg-clip-text text-transparent">
                Cases
              </span>
            </h1>
            <p className="font-display text-xs sm:text-sm text-[#BABABA] mt-1">
              Commercial transactions, weight payloads, and audit decisions
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDemoModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-display text-white transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF6D29]" />
              <span>Run Demo</span>
            </button>
            <Link
              to="/cases/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6D29] to-[#E04516] text-white text-xs font-display font-medium shadow-[0_0_20px_rgba(255,109,41,0.35)] hover:shadow-[0_0_28px_rgba(255,109,41,0.55)] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Case</span>
            </Link>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-between text-xs text-red-300 font-display">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadCases}
              className="underline font-medium hover:text-white cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="rounded-3xl bg-[#141215]/80 border border-white/10 p-16 text-center backdrop-blur-xl">
            <RefreshCw className="w-6 h-6 text-[#FF6D29] animate-spin mx-auto mb-3" />
            <p className="text-xs font-display text-[#BABABA]">Loading verification cases...</p>
          </div>
        ) : cases.length === 0 ? (
          /* Empty state */
          <div className="rounded-3xl bg-[#141215]/80 border border-white/10 p-12 sm:p-16 text-center backdrop-blur-xl">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 mx-auto mb-4 flex items-center justify-center text-[#FF6D29]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h2 className="font-display text-base font-medium text-white mb-1.5">No Cases Registered</h2>
            <p className="font-display text-xs text-[#BABABA] max-w-sm mx-auto mb-6">
              Create a transaction case to verify physical manifests and scale tickets.
            </p>
            <Link
              to="/cases/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-display text-white transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Initial Case</span>
            </Link>
          </div>
        ) : (
          /* Cases table */
          <div className="rounded-3xl bg-[#141215]/85 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-[#BABABA] font-display text-[11px] uppercase tracking-wider">
                    <th className="py-3.5 px-5 font-medium">Transaction</th>
                    <th className="py-3.5 px-5 font-medium">Partner</th>
                    <th className="py-3.5 px-5 font-medium">Material</th>
                    <th className="py-3.5 px-5 font-medium text-right">Claimed Quantity</th>
                    <th className="py-3.5 px-5 font-medium text-center">Status</th>
                    <th className="py-3.5 px-5 font-medium text-center">Risk</th>
                    <th className="py-3.5 px-5 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {cases.map((c) => {
                    const st = getStatusBadge(c.status);
                    return (
                      <tr
                        key={c.caseId}
                        className="hover:bg-white/[0.03] transition-colors font-display"
                      >
                        <td className="py-3.5 px-5 font-mono font-medium text-white">
                          {c.transactionId}
                        </td>
                        <td className="py-3.5 px-5 text-white/90">
                          {c.partnerName}
                        </td>
                        <td className="py-3.5 px-5 text-[#BABABA]">
                          {c.material}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-right text-white">
                          {c.claimedQuantity.toLocaleString()}{" "}
                          <span className="text-[#BABABA]/60 text-[11px]">{c.unit}</span>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${st.style}`}
                          >
                            {st.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          {getRiskBadge(c.riskLevel)}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <Link
                            to={`/cases/${c.caseId}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 text-[11px] font-display text-white transition"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3 text-[#FF6D29]" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="py-3 px-5 border-t border-white/10 bg-black/40 flex items-center justify-between text-[11px] font-display text-[#BABABA]">
              <div>Records: {cases.length}</div>
              <div>Tenant: Restricted</div>
            </div>
          </div>
        )}
      </main>

      <FullDemoModal
        isOpen={showDemoModal}
        onClose={() => {
          setShowDemoModal(false);
          loadCases();
        }}
      />
    </GlowBackground>
  );
};
