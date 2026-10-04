import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, FileCheck2, ArrowRight } from "lucide-react";

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
    <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 flex-1 flex flex-col justify-center items-center text-center">
      {/* Floating Evidence & Verification Pills: Inspired by reference image's orbiting interactive pill chips */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block overflow-hidden">
        {/* Left Floating Pill Chip: Weighbridge & Invoices */}
        <div className="hero-floating-chip-left absolute left-6 xl:left-12 top-[46%] -translate-y-1/2 pointer-events-auto">
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-[14px] bg-proof-charcoal/70 border border-proof-offwhite/15 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.6)] text-xs font-mono text-proof-offwhite/90 hover:border-proof-vermillion/50 transition-colors">
            <FileCheck2 className="w-3.5 h-3.5 text-proof-vermillion" />
            <span className="tracking-tight text-proof-offwhite/85">Scale slips &times; Invoices</span>
            <span className="w-1.5 h-1.5 rounded-full bg-proof-vermillion animate-pulse" />
          </div>
        </div>

        {/* Right Floating Pill Chip: Tolerance Engine */}
        <div className="hero-floating-chip-right absolute right-6 xl:right-12 top-[48%] -translate-y-1/2 pointer-events-auto">
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-[14px] bg-proof-charcoal/70 border border-proof-offwhite/15 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.6)] text-xs font-mono text-proof-offwhite/90 hover:border-proof-vermillion/50 transition-colors">
            <ShieldCheck className="w-3.5 h-3.5 text-proof-offwhite" />
            <span className="tracking-tight text-proof-offwhite/85">Tolerance audit</span>
            <span className="text-[10px] text-proof-gray font-mono px-1.5 py-0.5 rounded bg-proof-black/60 border border-proof-offwhite/10">0.0% variance</span>
          </div>
        </div>

        {/* Lower Right Interactive Verification Badge */}
        <div className="hero-floating-badge absolute right-24 xl:right-32 bottom-[22%] pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[12px] bg-proof-vermillion/15 border border-proof-vermillion/40 backdrop-blur-md text-[11px] font-sans font-medium text-proof-offwhite shadow-[0_4px_20px_rgba(225,91,53,0.25)]">
            <span className="w-1.5 h-1.5 rounded-full bg-proof-vermillion" />
            <span>Deterministic Math</span>
          </div>
        </div>
      </div>

      {/* Central Typographic Composition */}
      <div
        ref={contentWrapperRef}
        className="max-w-[760px] flex flex-col items-center gap-6 sm:gap-7 pt-16 sm:pt-20 will-change-transform"
      >
        {/* Eyebrow Pill: Inspired by the Reference's Pill Badge with luminous ring */}
        <div
          ref={eyebrowRef}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-proof-charcoal/80 border border-proof-offwhite/15 backdrop-blur-sm shadow-inner"
        >
          <span className="w-2 h-2 rounded-full border border-proof-vermillion flex items-center justify-center">
            <span className="w-1 h-1 rounded-full bg-proof-vermillion" />
          </span>
          <span className="font-mono text-[10px] sm:text-[11px] font-medium tracking-[0.2em] uppercase text-proof-offwhite/90">
            EVIDENCE-DRIVEN VERIFICATION
          </span>
        </div>

        {/* Headline: Monumental, confident, centered, tight leading */}
        <h1 className="font-display font-medium tracking-[-0.035em] text-5xl sm:text-7xl md:text-[5.5rem] lg:text-[6.25rem] leading-[0.92] sm:leading-[0.93] text-proof-offwhite text-center">
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
          className="font-display text-base sm:text-lg md:text-xl text-proof-offwhite/75 font-normal max-w-[560px] leading-relaxed tracking-normal text-center"
        >
          Proofline turns real-world evidence into a clear, traceable verification decision.
        </p>

        {/* Integrated Console / Verification Input Dock (Inspired by reference's interactive input dock) */}
        <div
          ref={ctaGroupRef}
          className="w-full max-w-md pt-2 flex flex-col sm:flex-row items-center gap-3 sm:gap-0 p-1.5 rounded-[16px] bg-proof-charcoal/60 border border-proof-offwhite/20 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.5)] font-display"
        >
          <input
            type="text"
            placeholder="Enter case ID or invoice #..."
            readOnly
            className="w-full px-4 py-2.5 bg-transparent text-xs sm:text-sm text-proof-offwhite placeholder:text-proof-gray/70 focus:outline-none cursor-default font-mono tracking-wide"
          />
          <Link
            to="/cases"
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[12px] bg-proof-offwhite text-proof-black font-semibold text-xs sm:text-sm tracking-wide hover:bg-white transition-all duration-200 shadow-sm"
          >
            <span>Start a verification</span>
            <ArrowRight className="w-3.5 h-3.5 text-proof-black" />
          </Link>
        </div>

        {/* Secondary Action */}
        <div className="flex items-center gap-6 font-display text-xs sm:text-sm">
          <a
            href="#how-it-works"
            className="group inline-flex items-center gap-1.5 text-proof-gray hover:text-proof-offwhite transition-colors duration-200"
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
