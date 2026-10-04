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
              className="block text-proof-offwhite"
            >
              not{" "}
              <span className="font-serif italic font-normal text-[#FFA776] bg-gradient-to-r from-[#FFD2B8] via-[#FF8A50] to-[#FF6D29] bg-clip-text text-transparent">
                promises.
              </span>
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
          CTA Control:
          Engineered 3D flip / page-turn hover interaction with Vermillion accent back-face.
          - Front face: Crisp off-white pill surface with high-contrast pitch-black text & arrow.
          - Back face: Rich vermillion (#E15B35) surface with crisp off-white text & animated arrow.
        */}
        <div
          ref={ctaGroupRef}
          className="pt-3 sm:pt-4 flex flex-col items-center gap-4 sm:gap-5 font-display"
        >
          {/* 3D Flip Card Container */}
          <div className="group relative [perspective:1000px]">
            <Link
              to="/cases"
              className="relative block h-[52px] sm:h-[56px] w-[240px] sm:w-[260px] rounded-full transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateX(180deg)] shadow-[0_8px_30px_rgba(0,0,0,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proof-vermillion"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* FRONT FACE: Off-white surface, razor-sharp black text */}
              <div
                className="absolute inset-0 flex items-center justify-between px-6 sm:px-7 rounded-full bg-[#F4F1EA] text-[#000000] border border-[#F4F1EA] shadow-[0_4px_24px_rgba(244,241,234,0.2)] transition-shadow duration-300"
                style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
              >
                <span className="font-semibold text-sm sm:text-[15px] tracking-wide text-black select-none">
                  Start a verification
                </span>
                <span className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center shrink-0">
                  <ArrowRight className="w-3.5 h-3.5 text-black stroke-[2.2]" />
                </span>
              </div>

              {/* BACK FACE: Vermillion accent surface, smooth page-flip reveal */}
              <div
                className="absolute inset-0 flex items-center justify-between px-6 sm:px-7 rounded-full bg-[#E15B35] text-[#F4F1EA] border border-[#E15B35] shadow-[0_8px_32px_rgba(225,91,53,0.4)] [transform:rotateX(180deg)]"
                style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
              >
                <span className="font-semibold text-sm sm:text-[15px] tracking-wide text-[#F4F1EA] select-none">
                  Start a verification
                </span>
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <ArrowRight className="w-3.5 h-3.5 text-[#F4F1EA] stroke-[2.2] translate-x-0.5" />
                </span>
              </div>
            </Link>
          </div>

          {/* Secondary Action */}
          <a
            href="#footer"
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
