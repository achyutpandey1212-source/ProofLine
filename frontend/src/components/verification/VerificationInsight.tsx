import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { VERIFIED_INSIGHTS, VerificationInsightItem } from "../../data/verificationInsights";

interface VerificationInsightProps {
  intervalMs?: number;
}

export const VerificationInsight: React.FC<VerificationInsightProps> = ({
  intervalMs = 8000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!containerRef.current) return;

      // Animate out
      gsap.to(containerRef.current, {
        opacity: 0,
        y: -6,
        duration: 0.35,
        ease: "power2.in",
        onComplete: () => {
          setCurrentIndex((prev) => (prev + 1) % VERIFIED_INSIGHTS.length);
          // Animate in
          gsap.fromTo(
            containerRef.current,
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
          );
        },
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  const current: VerificationInsightItem = VERIFIED_INSIGHTS[currentIndex]!;
  const displayNum = String(currentIndex + 1).padStart(2, "0");

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl bg-[#120F12]/80 border border-white/10 p-6 sm:p-7 backdrop-blur-xl shadow-[0_16px_36px_rgba(0,0,0,0.65)]">
      {/* Top micro-header */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/[0.08] text-[11px] font-display">
        <span className="font-mono text-[#FF6D29] tracking-wider uppercase">
          {displayNum} // WHY VERIFICATION MATTERS
        </span>
        <span className="text-[#BABABA]/50 font-mono">
          {currentIndex + 1} of {VERIFIED_INSIGHTS.length}
        </span>
      </div>

      {/* Rotating content box */}
      <div ref={containerRef} className="space-y-3 font-display">
        {/* Large Stat Metric */}
        <div className="text-3xl sm:text-4xl font-semibold tracking-tight text-white leading-none">
          {current.metric}
        </div>

        {/* Headline */}
        <div className="text-sm sm:text-base font-medium text-white/90 leading-snug">
          {current.headline}
        </div>

        {/* Short explanation */}
        <p className="text-xs text-[#BABABA] leading-relaxed">
          {current.detail}
        </p>

        {/* Tiny verified source attribution */}
        <div className="pt-3 border-t border-white/[0.06] text-[11px] font-mono text-[#BABABA]/60 flex items-center justify-between">
          <span>Source: {current.sourceOrg} ({current.year})</span>
          <span className="truncate max-w-[200px] hidden sm:inline" title={current.reportName}>
            {current.reportName}
          </span>
        </div>
      </div>
    </div>
  );
};
