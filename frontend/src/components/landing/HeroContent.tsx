import React from "react";
import { Link } from "react-router-dom";

interface HeroContentProps {
  contentWrapperRef: React.RefObject<HTMLDivElement | null>;
  eyebrowRef: React.RefObject<HTMLDivElement | null>;
  headlineLine1Ref: React.RefObject<HTMLSpanElement | null>;
  headlineLine2Ref: React.RefObject<HTMLSpanElement | null>;
  descriptionRef: React.RefObject<HTMLParagraphElement | null>;
  ctaGroupRef: React.RefObject<HTMLDivElement | null>;
}

export const HeroContent: React.FC<HeroContentProps> = ({
  contentWrapperRef,
  eyebrowRef,
  headlineLine1Ref,
  headlineLine2Ref,
  descriptionRef,
  ctaGroupRef,
}) => {
  return (
    <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 flex-1 flex flex-col justify-center">
      {/* Sitting roughly in left third of the viewport (max-w target: ~500-600px) */}
      <div
        ref={contentWrapperRef}
        className="max-w-[580px] flex flex-col gap-6 sm:gap-8 pt-20 sm:pt-24 will-change-transform"
      >
        {/* Eyebrow: IBM Plex Mono */}
        <div ref={eyebrowRef} className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-proof-vermillion opacity-90" />
          <span className="font-mono text-[11px] sm:text-xs font-medium tracking-[0.22em] uppercase text-proof-gray">
            EVIDENCE-DRIVEN VERIFICATION
          </span>
        </div>

        {/* Headline: Instrument Sans, confident, 80-96px on desktop, tight leading (0.92-0.96) */}
        <h1 className="font-display font-medium tracking-[-0.035em] text-5xl sm:text-7xl md:text-[5.25rem] lg:text-[5.75rem] leading-[0.92] sm:leading-[0.94] text-proof-offwhite">
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

        {/* Supporting Copy: Instrument Sans, concise, restrained */}
        <p
          ref={descriptionRef}
          className="font-display text-base sm:text-lg md:text-[1.125rem] text-proof-offwhite/75 font-normal max-w-[480px] leading-relaxed tracking-normal"
        >
          Proofline turns real-world evidence into a clear, traceable verification decision.
        </p>

        {/* CTAs: Understated dark/off-white with subtle border and tiny hover translation */}
        <div
          ref={ctaGroupRef}
          className="pt-2 sm:pt-4 flex flex-wrap items-center gap-4 sm:gap-6 font-display"
        >
          <Link
            to="/cases"
            className="group inline-flex items-center gap-2.5 px-6 sm:px-7 py-3 sm:py-3.5 text-xs sm:text-sm font-medium tracking-wide text-proof-offwhite bg-proof-charcoal/90 border border-proof-offwhite/25 hover:border-proof-offwhite/50 hover:bg-proof-charcoal transition-all duration-200"
          >
            <span>Start a verification</span>
            <span className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-1 text-proof-vermillion">
              →
            </span>
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center text-xs sm:text-sm font-normal tracking-wide text-proof-gray hover:text-proof-offwhite transition-colors duration-200"
          >
            See how it works
          </a>
        </div>
      </div>
    </div>
  );
};
