import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { GlowBackground } from "../components/ui/GlowBackground";
import { CaseService } from "../services/case.service";
import { CaseItem } from "../types";
import {
  Plus,
  Play,
  ArrowRight,
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  Key,
  Download,
  Filter,
} from "lucide-react";
import { useInteractiveDemo } from "../demo/InteractiveDemoDriver";
import { ApiKeyModal } from "../components/apiKeys/ApiKeyModal";
import { CaseLifecycleBadge } from "../components/ui/CaseLifecycleBadge";
import { ProofPacketModal } from "../components/proofPacket/ProofPacketModal";

type FilterTab = "ALL" | "NEEDS_REVIEW" | "APPROVED" | "CLARIFICATION";

export const CasesListPage: React.FC = () => {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const { demoState, startInteractiveDemo } = useInteractiveDemo();
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Quick proof packet modal trigger
  const [selectedCaseForPacket, setSelectedCaseForPacket] = useState<CaseItem | null>(null);

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

  // Filtered cases based on Unified Lifecycle tabs
  const filteredCases = useMemo(() => {
    if (activeTab === "ALL") return cases;
    if (activeTab === "NEEDS_REVIEW") {
      return cases.filter(
        (c) =>
          c.status === "REVIEW_REQUIRED" ||
          c.resolutionState === "PENDING_REVIEW" ||
          !c.resolutionState
      );
    }
    if (activeTab === "APPROVED") {
      return cases.filter((c) => c.resolutionState === "APPROVED");
    }
    if (activeTab === "CLARIFICATION") {
      return cases.filter((c) => c.resolutionState === "CLARIFICATION_REQUESTED");
    }
    return cases;
  }, [cases, activeTab]);

  // Tab counters
  const counts = useMemo(() => {
    return {
      all: cases.length,
      needsReview: cases.filter(
        (c) =>
          c.status === "REVIEW_REQUIRED" ||
          c.resolutionState === "PENDING_REVIEW" ||
          !c.resolutionState
      ).length,
      approved: cases.filter((c) => c.resolutionState === "APPROVED").length,
      clarification: cases.filter((c) => c.resolutionState === "CLARIFICATION_REQUESTED").length,
    };
  }, [cases]);

  return (
    <GlowBackground className="flex flex-col min-h-screen">
      {/* Reusable floating cylindrical glassmorphism Navbar */}
      <Navbar />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-20 flex-1">
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
              Operational queue: Algorithmic discrepancy findings and institutional resolution sign-offs
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-display text-white transition cursor-pointer"
              title="Manage API Keys for external integrations"
            >
              <Key className="w-3.5 h-3.5 text-[#FF6D29]" />
              <span>API Keys</span>
            </button>
            <button
              onClick={startInteractiveDemo}
              disabled={demoState.isActive}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6D29] to-[#E04516] text-white text-xs font-display font-medium shadow-[0_0_22px_rgba(255,109,41,0.35)] hover:shadow-[0_0_30px_rgba(255,109,41,0.55)] transition-all cursor-pointer disabled:opacity-50"
              title="Runs autonomous end-to-end interactive demo through real workflow"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{demoState.isActive ? "Demo In Progress..." : "Run Interactive Demo"}</span>
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

        {/* Unified Lifecycle Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-display transition cursor-pointer flex items-center gap-2 ${
                activeTab === "ALL"
                  ? "bg-white/10 text-white font-medium shadow-sm"
                  : "text-[#BABABA] hover:text-white"
              }`}
            >
              <span>All Cases</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/10 text-[#BABABA]">
                {counts.all}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("NEEDS_REVIEW")}
              className={`px-3 py-1.5 rounded-xl text-xs font-display transition cursor-pointer flex items-center gap-2 ${
                activeTab === "NEEDS_REVIEW"
                  ? "bg-[#FF6D29]/20 text-[#FFA776] border border-[#FF6D29]/40 font-medium"
                  : "text-[#BABABA] hover:text-[#FFA776]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6D29]" />
              <span>Needs Review</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#FF6D29]/20 text-[#FFA776]">
                {counts.needsReview}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("APPROVED")}
              className={`px-3 py-1.5 rounded-xl text-xs font-display transition cursor-pointer flex items-center gap-2 ${
                activeTab === "APPROVED"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-medium"
                  : "text-[#BABABA] hover:text-emerald-300"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Approved</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300">
                {counts.approved}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("CLARIFICATION")}
              className={`px-3 py-1.5 rounded-xl text-xs font-display transition cursor-pointer flex items-center gap-2 ${
                activeTab === "CLARIFICATION"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium"
                  : "text-[#BABABA] hover:text-amber-300"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Clarification Sent</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300">
                {counts.clarification}
              </span>
            </button>
          </div>

          <div className="text-[11px] font-display text-[#BABABA]/60 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#FF6D29]" />
            <span>Dual-Axis State: Automated Finding &rarr; Human Resolution</span>
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
        ) : filteredCases.length === 0 ? (
          /* Empty state */
          <div className="rounded-3xl bg-[#141215]/80 border border-white/10 p-12 sm:p-16 text-center backdrop-blur-xl">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 mx-auto mb-4 flex items-center justify-center text-[#FF6D29]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h2 className="font-display text-base font-medium text-white mb-1.5">
              {activeTab === "ALL" ? "No Cases Registered" : "No Cases in this Status Queue"}
            </h2>
            <p className="font-display text-xs text-[#BABABA] max-w-sm mx-auto mb-6">
              {activeTab === "ALL"
                ? "Create a transaction case to verify physical manifests and scale tickets."
                : "No transactions match this specific lifecycle state filter."}
            </p>
            {activeTab === "ALL" ? (
              <Link
                to="/cases/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-display text-white transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Initial Case</span>
              </Link>
            ) : (
              <button
                onClick={() => setActiveTab("ALL")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-display text-white transition cursor-pointer"
              >
                <span>View All Cases</span>
              </button>
            )}
          </div>
        ) : (
          /* Cases table */
          <div className="rounded-3xl bg-[#141215]/85 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-[#BABABA] font-display text-[11px] uppercase tracking-wider">
                    <th className="py-3.5 px-5 font-medium">Transaction</th>
                    <th className="py-3.5 px-5 font-medium">Counterparty</th>
                    <th className="py-3.5 px-5 font-medium">Material</th>
                    <th className="py-3.5 px-5 font-medium text-right">Claimed Quantity</th>
                    <th className="py-3.5 px-5 font-medium">Lifecycle State (Engine &rarr; Resolution)</th>
                    <th className="py-3.5 px-5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredCases.map((c) => {
                    const isVerified =
                      c.status === "VERIFICATION_COMPLETE" || c.status === "REVIEW_REQUIRED";

                    return (
                      <tr
                        key={c.caseId}
                        className="hover:bg-white/[0.03] transition-colors font-display"
                      >
                        <td className="py-4 px-5">
                          <div className="font-mono font-medium text-white text-xs">
                            {c.transactionId}
                          </div>
                          <div className="text-[10px] font-mono text-[#BABABA]/50 mt-0.5">
                            {c.caseId}
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="text-white/90 font-medium">{c.partnerName}</div>
                          <div className="text-[10px] text-[#BABABA]/60 mt-0.5">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-4 px-5 text-[#BABABA]">
                          {c.material}
                        </td>
                        <td className="py-4 px-5 font-mono text-right text-white">
                          {c.claimedQuantity.toLocaleString()}{" "}
                          <span className="text-[#BABABA]/60 text-[11px]">{c.unit}</span>
                        </td>
                        <td className="py-4 px-5">
                          <CaseLifecycleBadge
                            status={c.status}
                            riskLevel={c.riskLevel}
                            resolutionState={c.resolutionState || "PENDING_REVIEW"}
                            size="sm"
                          />
                          {c.resolutionNote && (
                            <div className="text-[10px] text-[#BABABA]/60 italic mt-1 line-clamp-1">
                              &ldquo;{c.resolutionNote}&rdquo;
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="inline-flex items-center gap-2">
                            {isVerified && (
                              <button
                                onClick={() => setSelectedCaseForPacket(c)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-white/20 text-[11px] font-display text-[#FFA776] transition cursor-pointer"
                                title="Download Certified Proof Packet PDF"
                              >
                                <Download className="w-3 h-3 text-[#FF6D29]" />
                                <span className="hidden md:inline">Packet</span>
                              </button>
                            )}
                            <Link
                              to={`/cases/${c.caseId}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 text-[11px] font-display text-white transition"
                            >
                              <span>Review</span>
                              <ArrowRight className="w-3 h-3 text-[#FF6D29]" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="py-3 px-5 border-t border-white/10 bg-black/40 flex items-center justify-between text-[11px] font-display text-[#BABABA]">
              <div>Displaying: {filteredCases.length} of {cases.length} records</div>
              <div>Tenant: Restricted &bull; Immutable Audit Logs Active</div>
            </div>
          </div>
        )}
      </main>

      {/* Proof Packet Quick Modal */}
      {selectedCaseForPacket && (
        <ProofPacketModal
          caseId={selectedCaseForPacket.caseId}
          transactionId={selectedCaseForPacket.transactionId}
          isOpen={!!selectedCaseForPacket}
          onClose={() => setSelectedCaseForPacket(null)}
          isSimulated={selectedCaseForPacket.isDemo}
        />
      )}

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
      />
    </GlowBackground>
  );
};
