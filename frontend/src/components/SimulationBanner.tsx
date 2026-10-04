import React from "react";
import { useSimulation } from "../context/SimulationContext";
import { AlertCircle, RotateCcw } from "lucide-react";

export const SimulationBanner: React.FC = () => {
  const { isSimulating, activeScenario, exitSimulation } = useSimulation();

  if (!isSimulating) return null;

  const scenarioLabels: Record<string, string> = {
    WEIGHT_MISMATCH: "Weight Mismatch (Scale Divergence)",
    INVOICE_MISMATCH: "Invoice Quantity Mismatch (Declared Claim vs Scale)",
    TRANSACTION_MISMATCH: "Transaction ID Mismatch (Foreign Ref EW-999)",
    EVIDENCE_INCONSISTENCY: "Evidence Inconsistency (PET vs HDPE)",
  };

  return (
    <aside
      aria-label="Simulation Mode Banner"
      className="sticky top-0 z-40 w-full bg-[#180E09]/95 border-b border-[#FF6D29]/40 backdrop-blur-xl px-4 py-2.5 transition-all shadow-[0_4px_24px_rgba(255,109,41,0.15)]"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs font-display">
          <div className="w-5 h-5 rounded-md bg-[#FF6D29]/20 border border-[#FF6D29]/40 flex items-center justify-center text-[#FF6D29] shrink-0">
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-mono uppercase font-semibold text-[#FF6D29] tracking-wider text-[11px]">
              SIMULATION MODE
            </span>
            <span className="text-white/40">&bull;</span>
            <span className="text-white font-medium">
              {activeScenario ? scenarioLabels[activeScenario] || activeScenario : "Adversarial Test"}
            </span>
            <span className="text-white/40 hidden md:inline">&bull;</span>
            <span className="text-[#BABABA] text-[11px] hidden md:inline">
              No production data or database records will be modified.
            </span>
          </div>
        </div>

        <button
          onClick={exitSimulation}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 text-xs font-display text-white transition cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3 h-3 text-[#FF6D29]" />
          <span>Exit simulation</span>
        </button>
      </div>
    </aside>
  );
};
