import React, { useState } from "react";
import { SimulationScenario } from "../../types";
import { useSimulation } from "../../context/SimulationContext";
import {
  Scale,
  FileSpreadsheet,
  FileQuestion,
  Layers,
  ArrowRight,
  X,
  RefreshCw,
  AlertTriangle,
  FlaskConical,
  Copy,
  Clock,
} from "lucide-react";

interface SimulationModalProps {
  caseId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ScenarioOption {
  id: SimulationScenario;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
}

const SCENARIOS: ScenarioOption[] = [
  {
    id: "EVIDENCE_REUSE",
    title: "Cross-case evidence reuse",
    subtitle: "Test cryptographic fingerprint collision.",
    description:
      "Simulates weighbridge ticket matching an identical SHA-256 fingerprint from a prior case (PL-REC-8841), triggering cross-case collision detection.",
    icon: <Copy className="w-4 h-4 text-[#FF6D29]" />,
    badge: "Provenance Collision",
  },
  {
    id: "CHRONOLOGY_ANOMALY",
    title: "Chronological impossibility",
    subtitle: "Test physical event sequence.",
    description:
      "Simulates physical weighbridge ticket dated 5 days after the final commercial invoice was issued, violating sequence constraints.",
    icon: <Clock className="w-4 h-4 text-[#FFA776]" />,
    badge: "Timeline Anomaly",
  },
  {
    id: "WEIGHT_MISMATCH",
    title: "Weight mismatch",
    subtitle: "Test tolerance enforcement.",
    description:
      "Alters physical scale measurements so total measured weight diverges materially from claimed invoice weight (+14% variance).",
    icon: <Scale className="w-4 h-4 text-[#FF6D29]" />,
    badge: "Tolerance Discrepancy",
  },
  {
    id: "INVOICE_MISMATCH",
    title: "Invoice mismatch",
    subtitle: "Test declared vs physical quantity.",
    description:
      "Simulates an invoice claiming 620 kg against 555.6 kg of physical scale tickets, triggering arithmetic reconciliation failure.",
    icon: <FileSpreadsheet className="w-4 h-4 text-[#FFA776]" />,
    badge: "Quantity Conflict",
  },
  {
    id: "TRANSACTION_MISMATCH",
    title: "Transaction mismatch",
    subtitle: "Test document identity consistency.",
    description:
      "Simulates a submitted document bearing a foreign transaction ID (EW-999) to verify cross-document identity checks.",
    icon: <FileQuestion className="w-4 h-4 text-[#FF6D29]" />,
    badge: "Identity Discrepancy",
  },
  {
    id: "EVIDENCE_INCONSISTENCY",
    title: "Evidence inconsistency",
    subtitle: "Test conflicting extracted facts.",
    description:
      "Simulates conflicting material classification between evidence (PET Plastic Flakes vs HDPE Plastic Flakes).",
    icon: <Layers className="w-4 h-4 text-[#FFA776]" />,
    badge: "Material Conflict",
  },
];

export const SimulationModal: React.FC<SimulationModalProps> = ({
  caseId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario>("WEIGHT_MISMATCH");
  const { startSimulation, isRunningSimulation, simulationError } = useSimulation();

  if (!isOpen) return null;

  const handleRunSimulation = async () => {
    try {
      await startSimulation(caseId, selectedScenario);
      onClose();
      if (onSuccess) onSuccess();
    } catch {
      // Error is tracked in SimulationContext
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[85vh] rounded-3xl bg-[#110e11] border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col font-display">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-[#161216]/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF6D29]/15 border border-[#FF6D29]/30 flex items-center justify-center text-[#FF6D29]">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                Adversarial Discrepancy Simulator
              </h2>
              <p className="text-xs text-[#BABABA]">
                Test how Proofline responds when submitted evidence conflicts.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isRunningSimulation}
            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 flex items-center justify-center text-[#BABABA] hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content & Scenario Cards (Scrollable) */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0 pr-4">
          <p className="text-xs text-[#BABABA] leading-relaxed">
            Select a controlled adversarial scenario to feed into Proofline&apos;s deterministic verification pipeline. Production database records will remain completely untouched.
          </p>

          <div className="space-y-2.5">
            {SCENARIOS.map((sc) => {
              const isSelected = selectedScenario === sc.id;
              return (
                <div
                  key={sc.id}
                  onClick={() => setSelectedScenario(sc.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#1d161d] border-[#FF6D29] shadow-[0_0_24px_rgba(255,109,41,0.2)]"
                      : "bg-white/[0.02] border-white/[0.06] hover:border-white/15 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0">
                        {sc.icon}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white flex items-center gap-2">
                          <span>{sc.title}</span>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#FFA776] px-2 py-0.5 rounded-full bg-[#FF6D29]/10 border border-[#FF6D29]/20">
                            {sc.badge}
                          </span>
                        </div>
                        <div className="text-xs text-[#BABABA] mt-0.5">
                          &ldquo;{sc.subtitle}&rdquo;
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-colors ${
                        isSelected
                          ? "border-[#FF6D29] bg-[#FF6D29]"
                          : "border-white/20 bg-transparent"
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>

                  <p className="text-[11px] text-[#BABABA]/70 mt-2.5 pl-9 leading-relaxed">
                    {sc.description}
                  </p>
                </div>
              );
            })}
          </div>

          {simulationError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>
                {typeof simulationError === "object"
                  ? (simulationError as any)?.message || JSON.stringify(simulationError)
                  : String(simulationError)}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#161216]/60 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            disabled={isRunningSimulation}
            className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-display text-[#BABABA] hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleRunSimulation}
            disabled={isRunningSimulation}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6D29] to-[#E04516] text-white text-xs font-display font-medium shadow-[0_0_20px_rgba(255,109,41,0.35)] hover:shadow-[0_0_28px_rgba(255,109,41,0.55)] transition-all cursor-pointer disabled:opacity-50"
          >
            {isRunningSimulation ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Simulation...</span>
              </>
            ) : (
              <>
                <span>Run Simulation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
