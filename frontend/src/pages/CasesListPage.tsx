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
  FileCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building2,
  Activity,
  Layers,
} from "lucide-react";
import { useInteractiveDemo } from "../demo/InteractiveDemoDriver";
import { ApiKeyModal } from "../components/apiKeys/ApiKeyModal";
import { CaseLifecycleBadge } from "../components/ui/CaseLifecycleBadge";
import { ProofPacketModal } from "../components/proofPacket/ProofPacketModal";

type FilterTab = "ALL" | "NEEDS_REVIEW" | "CLARIFICATION" | "APPROVED" | "REJECTED";

export const CasesListPage: React.FC = () => {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
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

  // 1. Workspace Health metrics derived strictly from real cases
  const counts = useMemo(() => {
    const total = cases.length;
    const needsReview = cases.filter(
      (c) =>
        (c.riskLevel === "HIGH" || c.status === "REVIEW_REQUIRED") &&
        (!c.resolutionState || c.resolutionState === "PENDING_REVIEW")
    ).length;
    const clarification = cases.filter(
      (c) => c.resolutionState === "CLARIFICATION_REQUESTED"
    ).length;
    const approved = cases.filter((c) => c.resolutionState === "APPROVED").length;
    const rejected = cases.filter((c) => c.resolutionState === "REJECTED").length;

    // Operational insight: automated clearance rate without operator rejection or escalation
    const autoCleared = cases.filter(
      (c) =>
        c.riskLevel === "LOW" &&
        (!c.resolutionState || c.resolutionState === "APPROVED")
    ).length;
    const autoPercent = total > 0 ? Math.round((autoCleared / total) * 100) : 0;

    return {
      total,
      needsReview,
      clarification,
      approved,
      rejected,
      autoCleared,
      autoPercent,
    };
  }, [cases]);

  // 2. Priority Attention Queue: cases requiring operator investigation
  const attentionQueue = useMemo(() => {
    const unresolved = cases.filter(
      (c) => !c.resolutionState || c.resolutionState === "PENDING_REVIEW" || c.resolutionState === "CLARIFICATION_REQUESTED"
    );

    // Priority rank:
    // 1. HIGH risk + unresolved
    // 2. REVIEW_REQUIRED + unresolved
    // 3. CLARIFICATION_REQUESTED
    // 4. Other unresolved
    return unresolved
      .sort((a, b) => {
        const score = (item: CaseItem) => {
          if (item.riskLevel === "HIGH") return 4;
          if (item.status === "REVIEW_REQUIRED") return 3;
          if (item.resolutionState === "CLARIFICATION_REQUESTED") return 2;
          return 1;
        };
        const diff = score(b) - score(a);
        if (diff !== 0) return diff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 4); // Top 4 priority claims
  }, [cases]);

  // 3. Filtered cases for the main claims registry table
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Tab filter
      if (activeTab === "NEEDS_REVIEW") {
        const isNeeds =
          (c.riskLevel === "HIGH" || c.status === "REVIEW_REQUIRED") &&
          (!c.resolutionState || c.resolutionState === "PENDING_REVIEW");
        if (!isNeeds) return false;
      } else if (activeTab === "CLARIFICATION") {
        if (c.resolutionState !== "CLARIFICATION_REQUESTED") return false;
      } else if (activeTab === "APPROVED") {
        if (c.resolutionState !== "APPROVED") return false;
      } else if (activeTab === "REJECTED") {
        if (c.resolutionState !== "REJECTED") return false;
      }

      // Search query filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTx = c.transactionId?.toLowerCase().includes(q);
        const matchesPartner = c.partnerName?.toLowerCase().includes(q);
        const matchesMaterial = c.material?.toLowerCase().includes(q);
        const matchesCaseId = c.caseId?.toLowerCase().includes(q);
        return matchesTx || matchesPartner || matchesMaterial || matchesCaseId;
      }

      return true;
    });
  }, [cases, activeTab, searchQuery]);

  return (
    <GlowBackground className="flex flex-col min-h-screen">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-24 flex-1 space-y-10">
        {/* ========================================================= */}
        {/* HEADER: Verification Operations Console                   */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#FF6D29] animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#FFA776]">
                Operational Console
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-tight">
              Verification Operations
            </h1>
            <p className="font-display text-xs sm:text-sm text-[#BABABA] mt-1 max-w-2xl leading-relaxed">
              Review, resolve, and defend physical supply-chain claims before commercial trust is granted.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-3">
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6D29] to-[#E04516] text-white text-xs font-display font-medium shadow-[0_0_24px_rgba(255,109,41,0.35)] hover:shadow-[0_0_32px_rgba(255,109,41,0.55)] transition-all cursor-pointer disabled:opacity-50"
              title="Runs autonomous end-to-end interactive demo through real workflow"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{demoState.isActive ? "Demo Running..." : "Run Interactive Demo"}</span>
            </button>
            <Link
              to="/cases/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-white text-xs font-display font-medium transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Claim</span>
            </Link>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-between text-xs text-red-300 font-display">
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

        {/* ========================================================= */}
        {/* 1. WORKSPACE HEALTH METRICS                               */}
        {/* ========================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#BABABA]">
              Workspace Health
            </h2>
            <div className="text-[11px] font-mono text-[#BABABA]/60 flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-[#FF6D29]" />
              <span>Derived Live from Workspace Database</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Total Claims */}
            <div className="rounded-2xl bg-[#141215]/85 border border-white/10 p-4.5 backdrop-blur-xl space-y-1">
              <div className="text-[11px] font-mono text-[#BABABA] uppercase tracking-wider flex items-center justify-between">
                <span>Total Claims</span>
                <Layers className="w-3.5 h-3.5 text-[#BABABA]/50" />
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-white">
                {counts.total}
              </div>
              <div className="text-[10px] text-[#BABABA]/60">Physical claims evaluated</div>
            </div>

            {/* Needs Review */}
            <div className="rounded-2xl bg-[#141215]/85 border border-[#FF6D29]/30 p-4.5 backdrop-blur-xl space-y-1 shadow-[0_0_20px_rgba(255,109,41,0.08)]">
              <div className="text-[11px] font-mono text-[#FFA776] uppercase tracking-wider flex items-center justify-between">
                <span>Needs Review</span>
                <AlertTriangle className="w-3.5 h-3.5 text-[#FF6D29]" />
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-[#FFA776]">
                {counts.needsReview}
              </div>
              <div className="text-[10px] text-[#BABABA]/60">High risk / discrepancy</div>
            </div>

            {/* Clarification */}
            <div className="rounded-2xl bg-[#141215]/85 border border-amber-500/25 p-4.5 backdrop-blur-xl space-y-1">
              <div className="text-[11px] font-mono text-amber-300 uppercase tracking-wider flex items-center justify-between">
                <span>Clarification</span>
                <Clock className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-300">
                {counts.clarification}
              </div>
              <div className="text-[10px] text-[#BABABA]/60">Awaiting vendor response</div>
            </div>

            {/* Approved */}
            <div className="rounded-2xl bg-[#141215]/85 border border-emerald-500/25 p-4.5 backdrop-blur-xl space-y-1">
              <div className="text-[11px] font-mono text-emerald-300 uppercase tracking-wider flex items-center justify-between">
                <span>Approved</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-300">
                {counts.approved}
              </div>
              <div className="text-[10px] text-[#BABABA]/60">Institutional sign-off sealed</div>
            </div>

            {/* Rejected */}
            <div className="rounded-2xl bg-[#141215]/85 border border-red-500/25 p-4.5 backdrop-blur-xl space-y-1 col-span-2 sm:col-span-1">
              <div className="text-[11px] font-mono text-red-300 uppercase tracking-wider flex items-center justify-between">
                <span>Rejected</span>
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-red-300">
                {counts.rejected}
              </div>
              <div className="text-[10px] text-[#BABABA]/60">Unsafe claim dismissed</div>
            </div>
          </div>

          {/* Operational Insight Banner (Shown only when real cases exist) */}
          {counts.total > 0 && (
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] px-4 py-2.5 flex items-center justify-between text-xs font-display text-[#BABABA]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  <strong className="text-white font-medium">{counts.autoPercent}% of physical claims</strong> were verified within tolerance without human escalations.
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#BABABA]/50 hidden sm:inline">
                Zero heuristic hallucination
              </span>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* 2. NEEDS ATTENTION: Priority Queue                        */}
        {/* ========================================================= */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                Needs Attention
              </h2>
              <p className="text-xs text-[#BABABA]">
                Priority claims requiring immediate human compliance review
              </p>
            </div>
            <span className="text-xs font-mono text-[#FFA776] bg-[#FF6D29]/10 border border-[#FF6D29]/20 px-2.5 py-1 rounded-full">
              {attentionQueue.length} Priority Item(s)
            </span>
          </div>

          {attentionQueue.length === 0 ? (
            /* Successful empty state */
            <div className="rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20 p-6 flex items-center gap-4 text-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-white text-sm">Everything is accounted for</div>
                <p className="text-emerald-300/80 mt-0.5">
                  No claims currently require operator attention. All transactions have been verified or resolved.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attentionQueue.map((c) => {
                const variance = c.calculatedValues?.variancePercentage;
                const findingsList = c.findings || [];

                return (
                  <div
                    key={`attention-${c.caseId}`}
                    className="rounded-2xl bg-[#141215]/90 border border-[#FF6D29]/30 hover:border-[#FF6D29]/60 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.6)] backdrop-blur-xl space-y-3 transition-all"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-semibold text-white">
                            {c.transactionId}
                          </span>
                          <span className="text-[10px] font-mono text-[#BABABA]/50">
                            {c.caseId}
                          </span>
                        </div>
                        <div className="text-xs text-[#BABABA] flex items-center gap-1.5 mt-0.5">
                          <Building2 className="w-3 h-3 text-[#FF6D29]" />
                          <span>{c.partnerName}</span>
                          <span>&bull;</span>
                          <span className="text-white/80">{c.material}</span>
                        </div>
                      </div>

                      <CaseLifecycleBadge
                        status={c.status}
                        riskLevel={c.riskLevel}
                        resolutionState={c.resolutionState || "PENDING_REVIEW"}
                        size="sm"
                      />
                    </div>

                    {/* Operational Finding Signals */}
                    <div className="rounded-xl bg-black/40 border border-white/[0.06] p-3 space-y-2">
                      {variance !== undefined && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#BABABA]">Reconciliation Variance:</span>
                          <span className={`font-mono font-semibold ${Math.abs(variance) > 2.0 ? "text-red-400" : "text-emerald-400"}`}>
                            {variance}% {Math.abs(variance) > 2.0 ? "(Tolerance Exceeded)" : "(Within Limit)"}
                          </span>
                        </div>
                      )}

                      {findingsList.length > 0 ? (
                        <div className="space-y-1 pt-1 border-t border-white/[0.04]">
                          {findingsList.slice(0, 2).map((f, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[11px] text-[#FFA776]">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span className="truncate">{f.title}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-[#BABABA]/70 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-[#FF6D29]" />
                          <span>Pending operator decision sign-off</span>
                        </div>
                      )}
                    </div>

                    {/* Action Footer */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-mono text-[#BABABA]/50">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                      <Link
                        to={`/cases/${c.caseId}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF6D29] to-[#E04516] text-white text-xs font-medium hover:shadow-[0_0_16px_rgba(255,109,41,0.4)] transition"
                      >
                        <span>Open Case</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* 3. ALL CLAIMS REGISTRY                                    */}
        {/* ========================================================= */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                All Claims Registry
              </h2>
              <p className="text-xs text-[#BABABA]">
                Filterable repository of physical consignments and proof dossiers
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-[#BABABA] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transaction, vendor, material..."
                className="w-full bg-[#141215]/90 border border-white/10 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-[#BABABA]/50 focus:outline-none focus:border-[#FF6D29]/60 transition"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-display transition cursor-pointer flex items-center gap-2 ${
                activeTab === "ALL"
                  ? "bg-white/10 text-white font-medium shadow-sm"
                  : "text-[#BABABA] hover:text-white"
              }`}
            >
              <span>All</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/10 text-[#BABABA]">
                {counts.total}
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
              onClick={() => setActiveTab("CLARIFICATION")}
              className={`px-3 py-1.5 rounded-xl text-xs font-display transition cursor-pointer flex items-center gap-2 ${
                activeTab === "CLARIFICATION"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium"
                  : "text-[#BABABA] hover:text-amber-300"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Clarification</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300">
                {counts.clarification}
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
              onClick={() => setActiveTab("REJECTED")}
              className={`px-3 py-1.5 rounded-xl text-xs font-display transition cursor-pointer flex items-center gap-2 ${
                activeTab === "REJECTED"
                  ? "bg-red-500/20 text-red-300 border border-red-500/40 font-medium"
                  : "text-[#BABABA] hover:text-red-300"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span>Rejected</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-red-500/20 text-red-300">
                {counts.rejected}
              </span>
            </button>
          </div>

          {/* Claims Table */}
          {loading ? (
            <div className="rounded-3xl bg-[#141215]/80 border border-white/10 p-16 text-center backdrop-blur-xl">
              <RefreshCw className="w-6 h-6 text-[#FF6D29] animate-spin mx-auto mb-3" />
              <p className="text-xs font-display text-[#BABABA]">Loading verification claims...</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="rounded-3xl bg-[#141215]/80 border border-white/10 p-12 text-center backdrop-blur-xl">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 mx-auto mb-4 flex items-center justify-center text-[#FF6D29]">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-display text-sm font-medium text-white mb-1">
                No matching claims found
              </h3>
              <p className="text-xs text-[#BABABA] max-w-sm mx-auto mb-4">
                {searchQuery
                  ? `No transactions match your search query "${searchQuery}".`
                  : "No claims recorded in this status tab."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs text-white"
                >
                  Clear search query
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-3xl bg-[#141215]/85 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02] text-[#BABABA] font-display text-[11px] uppercase tracking-wider">
                      <th className="py-3.5 px-5 font-medium">Claim</th>
                      <th className="py-3.5 px-5 font-medium">Counterparty</th>
                      <th className="py-3.5 px-5 font-medium">Material</th>
                      <th className="py-3.5 px-5 font-medium text-right">Quantity</th>
                      <th className="py-3.5 px-5 font-medium">Lifecycle Disposition</th>
                      <th className="py-3.5 px-5 font-medium">Created</th>
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
                          {/* Claim */}
                          <td className="py-4 px-5">
                            <div className="font-mono font-medium text-white text-xs">
                              {c.transactionId}
                            </div>
                            <div className="text-[10px] font-mono text-[#BABABA]/50 mt-0.5">
                              {c.caseId}
                            </div>
                          </td>

                          {/* Counterparty */}
                          <td className="py-4 px-5">
                            <div className="text-white/90 font-medium">{c.partnerName}</div>
                          </td>

                          {/* Material */}
                          <td className="py-4 px-5 text-[#BABABA]">
                            {c.material}
                          </td>

                          {/* Quantity */}
                          <td className="py-4 px-5 font-mono text-right text-white">
                            {c.claimedQuantity.toLocaleString()}{" "}
                            <span className="text-[#BABABA]/60 text-[11px]">{c.unit}</span>
                          </td>

                          {/* Lifecycle Disposition */}
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

                          {/* Created */}
                          <td className="py-4 px-5 font-mono text-[11px] text-[#BABABA]">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-5 text-right">
                            <div className="inline-flex items-center gap-2">
                              {isVerified && (
                                <button
                                  onClick={() => setSelectedCaseForPacket(c)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-white/20 text-[11px] font-display text-[#FFA776] transition cursor-pointer"
                                  title="View and download Certified Proof Packet PDF"
                                >
                                  <FileCheck className="w-3 h-3 text-[#FF6D29]" />
                                  <span className="hidden sm:inline">Packet</span>
                                </button>
                              )}
                              <Link
                                to={`/cases/${c.caseId}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 text-[11px] font-display text-white transition"
                              >
                                <span>{c.resolutionState === "APPROVED" ? "Open" : "Review"}</span>
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
        </section>
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
