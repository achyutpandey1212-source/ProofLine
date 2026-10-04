import React from "react";

interface HeroMicroUIProps {
  scrollIndicatorRef: React.RefObject<HTMLDivElement | null>;
}

export const HeroMicroUI: React.FC<HeroMicroUIProps> = ({ scrollIndicatorRef }) => {
  return (
    <div
      ref={scrollIndicatorRef}
      className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 pb-6 sm:pb-8 flex items-center justify-between pointer-events-none select-none font-mono"
    >
      {/* SCROLL Indicator with subtle thin vertical pulse line */}
      <div className="flex items-center gap-3 text-proof-gray/60">
        <span className="text-[10px] tracking-[0.22em] uppercase font-medium">
          SCROLL
        </span>
        <div className="w-[1px] h-5 bg-proof-gray/25 overflow-hidden relative">
          <div className="scroll-line-pulse w-full h-full bg-proof-offwhite/85" />
        </div>
      </div>

      {/* Atmospheric metadata: SYS // 01 */}
      <div className="text-[10px] tracking-[0.24em] text-proof-gray/40 uppercase">
        SYS // 01
      </div>
    </div>
  );
};
