import React from "react";

interface HeroMicroUIProps {
  scrollIndicatorRef: React.RefObject<HTMLDivElement | null>;
}

export const HeroMicroUI: React.FC<HeroMicroUIProps> = ({ scrollIndicatorRef }) => {
  return (
    <div
      ref={scrollIndicatorRef}
      className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 pb-6 sm:pb-8 flex items-center justify-end pointer-events-none select-none font-mono"
    >
      {/* Retain atmospheric metadata SYS // 01 on the right */}
      <div className="text-[10px] tracking-[0.24em] text-proof-gray/40 uppercase">
        SYS // 01
      </div>
    </div>
  );
};
