import React from "react";
import { useInteractiveDemo } from "./InteractiveDemoDriver";
import { X } from "lucide-react";

export const InteractiveDemoHUD: React.FC = () => {
  const { demoState, cancelInteractiveDemo } = useInteractiveDemo();

  if (!demoState.isActive) return null;

  const getStepIndex = () => {
    switch (demoState.step) {
      case "NAVIGATING_NEW_CASE":
      case "TYPING_FORM":
      case "SUBMITTING_CASE":
        return 1;
      case "UPLOADING_EVIDENCE":
        return 2;
      case "RUNNING_VERIFICATION":
        return 3;
      case "LANDING_REPORT":
        return 4;
      default:
        return 1;
    }
  };

  const currentStepNum = getStepIndex();

  return (
    <aside
      aria-label="Interactive Demo Guide"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full select-none pointer-events-auto"
    >
      <div className="rounded-2xl bg-[#0F0D10]/95 border border-white/10 p-4 shadow-[0_20px_45px_rgba(0,0,0,0.85)] backdrop-blur-xl text-white">
        {/* Header: Restrained Obsidian aesthetic */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6D29]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#BABABA]">
              Interactive Demo &bull; Step {currentStepNum}/4
            </span>
          </div>

          <button
            type="button"
            onClick={cancelInteractiveDemo}
            className="text-[10px] font-mono text-[#BABABA]/70 hover:text-white px-2 py-0.5 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/[0.04] transition cursor-pointer flex items-center gap-1"
            title="Stop interactive demo"
          >
            <span>Exit</span>
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Primary Message */}
        <div className="space-y-1 font-display">
          <div className="text-xs font-medium text-white leading-snug">
            {demoState.currentMessage}
          </div>
          {demoState.subMessage && (
            <p className="text-[11px] text-[#BABABA] leading-relaxed">
              {demoState.subMessage}
            </p>
          )}
        </div>

        {/* Minimal Progress Line & Breadcrumbs */}
        <div className="mt-3.5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-[#BABABA]">
          <div className="flex items-center gap-2">
            <span className={currentStepNum === 1 ? "text-[#FFA776] font-medium" : "text-[#BABABA]/50"}>
              Intake
            </span>
            <span className="text-white/20">/</span>
            <span className={currentStepNum === 2 ? "text-[#FFA776] font-medium" : "text-[#BABABA]/50"}>
              Evidence
            </span>
            <span className="text-white/20">/</span>
            <span className={currentStepNum === 3 ? "text-[#FFA776] font-medium" : "text-[#BABABA]/50"}>
              Verify
            </span>
            <span className="text-white/20">/</span>
            <span className={currentStepNum === 4 ? "text-emerald-400 font-medium" : "text-[#BABABA]/50"}>
              Audit
            </span>
          </div>

          {demoState.step === "UPLOADING_EVIDENCE" && demoState.uploadedCount > 0 && (
            <span className="text-[#BABABA] font-mono">
              {demoState.uploadedCount}/{demoState.totalUploads}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};
