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

      // Automatically navigate to case details after initiating
      setTimeout(() => {
        navigate(`/cases/${createdCase.caseId}`);
      }, 1500);
    } catch {
      // Error handled in progress state
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-sans">
      <div className="w-full max-w-lg border-2 border-black bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-black mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-black" />
            <h2 className="font-mono text-sm font-bold uppercase">PROOF_LINE // FULL DEMO EXECUTION</h2>
          </div>
          {!running && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 transition cursor-pointer text-black"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="space-y-4 text-xs font-mono">
          <div className="border border-gray-300 p-3 bg-gray-50">
            <div className="font-bold mb-1 uppercase">OFFICIAL HACKATHON SCENARIO:</div>
            <div>Transaction: EW-104 (ABC Recycling Pvt Ltd)</div>
            <div>Claimed Net: 560 kg PET Flakes</div>
            <div>Evidence: 1 Commercial Invoice + 3 Scale Slips (184.6 kg, 193.2 kg, 177.8 kg)</div>
            <div>Expected: 555.6 kg Measured (0.79% Variance, LOW Risk)</div>
          </div>

          {/* Real Steps Sequence */}
          <div className="border border-black p-4 space-y-2.5 bg-white">
            <div className="font-bold text-gray-700 uppercase mb-2">EXECUTION SEQUENCE:</div>

            <div className="flex items-center gap-2">
              {progress.step === "CREATE_CASE" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : progress.createdCase ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-black" />
              ) : (
                <span className="w-3.5 h-3.5 inline-block border border-gray-400 text-center text-[10px] leading-3">1</span>
              )}
              <span className={progress.createdCase ? "font-bold text-black" : "text-gray-600"}>
                Create Real Case (EW-104)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {progress.step === "UPLOAD_EVIDENCE" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : progress.uploadedItems && progress.uploadedItems.length >= 4 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-black" />
              ) : (
                <span className="w-3.5 h-3.5 inline-block border border-gray-400 text-center text-[10px] leading-3">2</span>
              )}
              <span
                className={
                  progress.uploadedItems && progress.uploadedItems.length >= 4
                    ? "font-bold text-black"
                    : "text-gray-600"
                }
              >
                Upload 4 Synthetic Evidence Files to ImageKit
                {progress.uploadedItems && progress.uploadedItems.length > 0 && (
                  <span className="text-[11px] text-gray-500 ml-1">
                    ({progress.uploadedItems.length}/4 complete)
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {progress.step === "START_VERIFICATION" || progress.step === "COMPLETED" ? (
                progress.step === "COMPLETED" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )
              ) : (
                <span className="w-3.5 h-3.5 inline-block border border-gray-400 text-center text-[10px] leading-3">3</span>
              )}
              <span className={progress.step === "COMPLETED" ? "font-bold text-black" : "text-gray-600"}>
                Trigger Real Verification Engine (Gemini + LangGraph)
              </span>
            </div>
          </div>

          {/* Status / Error Box */}
          <div className="p-3 border border-gray-400 bg-gray-50 flex items-start gap-2">
            {progress.step === "ERROR" ? (
              <AlertCircle className="w-4 h-4 text-black flex-shrink-0" />
            ) : running ? (
              <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-black flex-shrink-0" />
            )}
            <div className="leading-tight">
              <span className="font-bold">STATUS: </span>
              {progress.message}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            {!running && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-400 text-black hover:bg-gray-100 transition cursor-pointer"
              >
                CANCEL
              </button>
            )}

            {progress.step === "ERROR" ? (
              <button
                type="button"
                onClick={handleStartFullDemo}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-black bg-black text-white hover:bg-white hover:text-black transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>RETRY DEMO</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={running}
                onClick={handleStartFullDemo}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-black bg-black text-white hover:bg-white hover:text-black disabled:opacity-50 transition cursor-pointer font-bold"
              >
                {running ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>EXECUTING REAL PIPELINE...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>RUN FULL DEMO NOW</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
