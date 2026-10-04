import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { CaseService } from "../services/case.service";
import { CaseItem } from "../types";
import { Plus, ArrowRight, AlertCircle, FileSpreadsheet } from "lucide-react";

export const CasesListPage: React.FC = () => {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const formatStatus = (status: string) => {
    switch (status) {
      case "VERIFICATION_COMPLETE":
        return { label: "VERIFIED", outline: "border-black font-semibold" };
      case "REVIEW_REQUIRED":
        return { label: "REVIEW REQUIRED", outline: "border-black font-semibold underline" };
      case "PROCESSING":
        return { label: "PROCESSING", outline: "border-gray-400 text-gray-700" };
      case "EVIDENCE_READY":
        return { label: "READY", outline: "border-black text-black" };
      case "EVIDENCE_UPLOADING":
        return { label: "UPLOADING", outline: "border-gray-400 text-gray-600" };
      default:
        return { label: status, outline: "border-gray-300 text-gray-500" };
    }
  };

  const formatRisk = (risk?: string) => {
    switch (risk) {
      case "LOW":
        return <span className="font-mono text-xs font-bold">[LOW]</span>;
      case "HIGH":
        return <span className="font-mono text-xs font-bold underline">[HIGH]</span>;
      case "REVIEW_REQUIRED":
        return <span className="font-mono text-xs font-bold">[REVIEW]</span>;
      default:
        return <span className="font-mono text-xs text-gray-400">—</span>;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Header />

      <main className="max-w-6xl w-full mx-auto px-4 py-8 flex-1">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-black">
          <div>
            <div className="font-mono text-xs text-gray-500 mb-1">RECORD_INDEX</div>
            <h1 className="text-2xl font-bold text-black tracking-tight">Verification Cases</h1>
            <p className="text-xs text-gray-600 mt-1">
              Active commercial transactions, weight payloads, and compliance records.
            </p>
          </div>
          <Link
            to="/cases/new"
            className="inline-flex items-center gap-2 px-4 py-2 border border-black bg-black text-white hover:bg-white hover:text-black text-sm font-medium transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Case</span>
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-black bg-gray-50 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>[ERROR]: {error}</span>
            </div>
            <button
              onClick={loadCases}
              className="underline font-bold hover:no-underline cursor-pointer"
            >
              RETRY
            </button>
          </div>
        )}

        {loading ? (
          <div className="border border-black p-12 text-center bg-white">
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-mono text-gray-600">QUERYING_RECORDS...</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="border border-black p-12 text-center bg-white">
            <div className="w-10 h-10 border border-black mx-auto mb-4 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-black" />
            </div>
            <h2 className="text-base font-bold text-black mb-1">No Verification Cases Registered</h2>
            <p className="text-xs text-gray-600 max-w-sm mx-auto mb-6">
              Create a new transaction case with claimed quantities to begin evidence reconciliation.
            </p>
            <Link
              to="/cases/new"
              className="inline-flex items-center gap-2 px-4 py-2 border border-black bg-black text-white hover:bg-white hover:text-black text-xs font-medium transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Initial Case</span>
            </Link>
          </div>
        ) : (
          <div className="border border-black bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-black bg-gray-100 font-mono text-gray-700 uppercase">
                    <th className="py-3 px-4 font-bold">Transaction ID</th>
                    <th className="py-3 px-4 font-bold">Partner</th>
                    <th className="py-3 px-4 font-bold">Material</th>
                    <th className="py-3 px-4 font-bold text-right">Claimed Quantity</th>
                    <th className="py-3 px-4 font-bold text-center">Status</th>
                    <th className="py-3 px-4 font-bold text-center">Risk</th>
                    <th className="py-3 px-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cases.map((c) => {
                    const st = formatStatus(c.status);
                    return (
                      <tr key={c.caseId} className="hover:bg-gray-50 transition border-b border-gray-200">
                        <td className="py-3 px-4 font-mono font-bold text-black">
                          {c.transactionId}
                        </td>
                        <td className="py-3 px-4 text-black">
                          {c.partnerName}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {c.material}
                        </td>
                        <td className="py-3 px-4 font-mono text-right font-medium text-black">
                          {c.claimedQuantity.toLocaleString()} {c.unit}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 border text-xs font-mono uppercase ${st.outline}`}
                          >
                            {st.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {formatRisk(c.riskLevel)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/cases/${c.caseId}`}
                            className="inline-flex items-center gap-1 border border-black px-2.5 py-1 text-xs font-mono hover:bg-black hover:text-white transition"
                          >
                            <span>OPEN</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-3 border-t border-black bg-gray-50 flex items-center justify-between text-xs font-mono text-gray-600">
              <div>TOTAL_RECORDS: {cases.length}</div>
              <div>TENANT: RESTRICTED</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
