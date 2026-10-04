import React from "react";

interface HeroMicroUIProps {
  scrollIndicatorRef: React.RefObject<HTMLDivElement | null>;
}

export const HeroMicroUI: React.FC<HeroMicroUIProps> = ({ scrollIndicatorRef }) => {
  return (
    <div
      ref={scrollIndicatorRef}
      className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 pb-6 sm:pb-8 flex flex-col gap-6 items-center pointer-events-none select-none"
    >
      {/* Enterprise integrations / Trusted verification protocols strip (Inspired by reference image's bottom logo bar) */}
      <div className="w-full flex flex-col items-center gap-3">
        <span className="text-[10px] tracking-[0.24em] font-mono text-proof-gray/50 uppercase">
          BUILT FOR DETERMINISTIC MULTI-DOCUMENT AUDITS
        </span>
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-proof-gray/60 font-mono text-xs tracking-wider">
          <span className="hover:text-proof-offwhite transition-colors">WEIGHBRIDGE v2</span>
          <span className="text-proof-gray/30">&bull;</span>
          <span className="hover:text-proof-offwhite transition-colors">ISO/IEC 17025</span>
          <span className="text-proof-gray/30">&bull;</span>
          <span className="hover:text-proof-offwhite transition-colors">TOLERANCE 0.05%</span>
          <span className="text-proof-gray/30">&bull;</span>
          <span className="hover:text-proof-offwhite transition-colors">SHA-256 AUDIT</span>
        </div>
      </div>

      {/* Atmospheric metadata & subtle scroll line */}
      <div className="w-full flex items-center justify-between font-mono">
        <div className="flex items-center gap-3 text-proof-gray/60">
          <span className="text-[10px] tracking-[0.22em] uppercase font-medium">
            SCROLL
          </span>
          <div className="w-[1px] h-4 bg-proof-gray/25 overflow-hidden relative">
            <div className="scroll-line-pulse w-full h-full bg-proof-offwhite/85" />
          </div>
        </div>

        <div className="text-[10px] tracking-[0.24em] text-proof-gray/40 uppercase">
          SYS // 01
        </div>
      </div>
    </div>
  );
};
