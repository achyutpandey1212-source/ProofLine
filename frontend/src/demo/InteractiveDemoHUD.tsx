import React from "react";
import { useInteractiveDemo } from "./InteractiveDemoDriver";
import { X, Check } from "lucide-react";

export const InteractiveDemoHUD: React.FC = () => {
  const { demoState, cancelInteractiveDemo } = useInteractiveDemo();

  if (!demoState.isActive) return null;

  const getStepNumber = () => {
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

  const currentStep = getStepNumber();

  const steps = [
    { num: 1, label: "Case Intake" },
    { num: 2, label: "Evidence" },
    { num: 3, label: "Verification" },
    { num: 4, label: "Proof" },
  ];

  return (
    <aside
      aria-label="Interactive Demo Controller"
      className="fixed bottom-5 right-5 z-50 max-w-xs sm:max-w-sm w-full select-none pointer-events-auto transition-all"
    >
      <div className="rounded-2xl bg-[#0F0D10]/95 border border-white/10 p-4 shadow-[0_16px_36px_rgba(0,0,0,0.85)] backdrop-blur-md text-white font-display">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08] mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6D29]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#BABABA]">
              Interactive Demo
            </span>
          </div>

          <button
            type="button"
            onClick={cancelInteractiveDemo}
            className="text-[10px] font-mono text-[#BABABA]/70 hover:text-white px-2 py-0.5 rounded-md hover:bg-white/[0.06] transition cursor-pointer flex items-center gap-1"
            title="Exit demo walkthrough"
          >
            <span>Exit</span>
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* 4 Steps Checklist */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {steps.map((s) => {
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <div
                key={s.num}
                className={`py-1.5 px-2 rounded-lg text-center border transition-all ${
                  isCurrent
                    ? "bg-[#FF6D29]/15 border-[#FF6D29]/40 text-[#FFA776]"
                    : isDone
                    ? "bg-white/[0.03] border-white/[0.06] text-[#BABABA]"
                    : "bg-transparent border-transparent text-[#BABABA]/40"
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  {isDone ? (
                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                  ) : (
                    <span className="text-[9px] font-mono opacity-70">
                      0{s.num}
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-medium truncate mt-0.5">
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Dynamic Action Message */}
        <div className="space-y-1 bg-black/40 rounded-xl p-2.5 border border-white/[0.06]">
          <div className="text-xs font-medium text-white leading-tight">
            {demoState.currentMessage}
          </div>
          {demoState.subMessage && (
            <p className="text-[11px] text-[#BABABA] leading-snug">
              {demoState.subMessage}
            </p>
          )}
        </div>

        {/* Evidence Counter Footer */}
        {demoState.step === "UPLOADING_EVIDENCE" && (
          <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-[#BABABA]">
            <span>Evidence Intake</span>
            <span className="text-[#FFA776]">
              {demoState.uploadedCount} / {demoState.totalUploads} registered
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
