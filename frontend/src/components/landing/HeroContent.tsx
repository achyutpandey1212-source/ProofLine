import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface HeroContentProps {
  contentWrapperRef: React.RefObject<HTMLDivElement | null>;
  headlineLine1Ref: React.RefObject<HTMLSpanElement | null>;
  headlineLine2Ref: React.RefObject<HTMLSpanElement | null>;
  descriptionRef: React.RefObject<HTMLParagraphElement | null>;
  ctaGroupRef: React.RefObject<HTMLDivElement | null>;
}

export const HeroContent: React.FC<HeroContentProps> = ({
  contentWrapperRef,
  headlineLine1Ref,
  headlineLine2Ref,
  descriptionRef,
  ctaGroupRef,
}) => {
  return (
    <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 flex-1 flex flex-col justify-center items-center text-center">
      {/* Central Typographic Composition */}
      <div
        ref={contentWrapperRef}
        className="max-w-[820px] flex flex-col items-center gap-6 sm:gap-8 pt-12 sm:pt-16 will-change-transform"
      >
        {/* Headline: Monumental, confident, centered, tight leading */}
        <h1 className="font-display font-medium tracking-[-0.035em] text-5xl sm:text-7xl md:text-[5.75rem] lg:text-[6.5rem] leading-[0.92] sm:leading-[0.93] text-proof-offwhite text-center">
          <span className="block overflow-hidden pb-1">
            <span ref={headlineLine1Ref} className="block text-proof-offwhite">
              Proof,
            </span>
          </span>
          <span className="block overflow-hidden pb-3">
            <span
              ref={headlineLine2Ref}
              className="block bg-gradient-to-r from-proof-offwhite via-proof-offwhite to-proof-vermillion/90 bg-clip-text text-transparent"
            >
              not promises.
            </span>
          </span>
        </h1>

        {/* Supporting Copy: Instrument Sans, centered, restrained */}
        <p
          ref={descriptionRef}
          className="font-display text-base sm:text-lg md:text-xl text-proof-offwhite/75 font-normal max-w-[580px] leading-relaxed tracking-normal text-center"
        >
          Proofline turns real-world evidence into a clear, traceable verification decision.
        </p>

        {/* 
          CTA Control (Green circle element - refined & improvised):
          A dedicated, beautifully engineered primary verification action button
          combining an architectural pill geometry, crisp contrast, vermillion accent, and secondary link.
        */}
        <div
          ref={ctaGroupRef}
          className="pt-3 sm:pt-4 flex flex-col items-center gap-4 sm:gap-5 font-display"
        >
          {/* Primary Action Button */}
          <Link
            to="/cases"
            className="group relative inline-flex items-center justify-center gap-3 px-8 sm:px-9 py-3.5 sm:py-4 rounded-full bg-proof-offwhite text-proof-black font-semibold text-sm sm:text-[15px] tracking-wide hover:bg-white transition-all duration-300 shadow-[0_4px_24px_rgba(244,241,234,0.18)] hover:shadow-[0_6px_32px_rgba(244,241,234,0.28)] hover:scale-[1.02] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proof-vermillion"
          >
            <span>Start a verification</span>
            <span className="w-5 h-5 rounded-full bg-proof-black/10 flex items-center justify-center transition-transform duration-300 ease-out group-hover:translate-x-1">
              <ArrowRight className="w-3.5 h-3.5 text-proof-black" />
            </span>
          </Link>

          {/* Secondary Action */}
          <a
            href="#how-it-works"
            className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-normal tracking-wide text-proof-gray hover:text-proof-offwhite transition-colors duration-200"
          >
            <span>See how it works</span>
            <span className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-1 text-proof-offwhite/60 group-hover:text-proof-offwhite">
              →
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};
