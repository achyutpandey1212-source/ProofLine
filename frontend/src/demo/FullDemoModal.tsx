import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DemoManager, DemoStepProgress } from "../demo/demoRunner";
import { Sparkles, CheckCircle2, AlertCircle, RefreshCw, X, Play } from "lucide-react";

interface FullDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FullDemoModal: React.FC<FullDemoModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<DemoStepProgress>({
    step: "IDLE",
    message: "Ready to execute official demo scenario (EW-104 PET scrap).",
  });

  if (!isOpen) return null;

  const handleStartFullDemo = async () => {
    try {
      setRunning(true);
      const createdCase = await DemoManager.runFullDemo((p) => {
        setProgress(p);
      });

      setTimeout(() => {
        navigate(`/cases/${createdCase.caseId}`);
      }, 1500);
    } catch {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 font-sans">
      <div className="w-full max-w-lg rounded-3xl bg-[#141215] border border-white/10 p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-white">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF6D29]/15 border border-[#FF6D29]/30 flex items-center justify-center text-[#FF6D29]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-semibold text-white tracking-tight">Full Demo Scenario</h2>
              <p className="text-[11px] font-display text-[#BABABA]">Automated end-to-end reconciliation</p>
            </div>
          </div>
          {!running && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-[#BABABA] hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="space-y-4 text-xs font-display">
          <div className="rounded-2xl bg-black/40 border border-white/[0.08] p-4 space-y-1.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#FFA776]">Transaction Context:</div>
            <div className="text-white font-medium">EW-104 &bull; ABC Recycling Pvt Ltd</div>
            <div className="text-[#BABABA]">Claimed Net: 560 kg PET Flakes &bull; ₹39,200</div>
          </div>

          <div className="rounded-2xl bg-black/40 border border-white/[0.08] p-4 space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#BABABA]">Live Pipeline Status:</div>
            <div className="flex items-start gap-2.5">
              {progress.step === "COMPLETED" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : progress.step === "ERROR" ? (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              ) : running ? (
                <RefreshCw className="w-4 h-4 text-[#FF6D29] animate-spin shrink-0 mt-0.5" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-white/20 shrink-0 mt-1.5" />
              )}
              <div className="text-white leading-relaxed">{progress.message}</div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            {!running && (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-[#BABABA] hover:text-white hover:bg-white/[0.04] transition cursor-pointer"
              >
                Close
              </button>
            )}
            <button
              onClick={handleStartFullDemo}
              disabled={running}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6D29] to-[#E04516] text-white text-xs font-medium shadow-[0_0_20px_rgba(255,109,41,0.4)] hover:shadow-[0_0_28px_rgba(255,109,41,0.6)] transition-all cursor-pointer disabled:opacity-50"
            >
              {running ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Evidence...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Scenario</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
