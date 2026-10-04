import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

export const DifferentiatorSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const copyRef = useRef<HTMLParagraphElement>(null);
  const statementsRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) return;

      gsap.fromTo(
        headlineRef.current,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 70%",
          },
        }
      );

      gsap.fromTo(
        copyRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          delay: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 70%",
          },
        }
      );

      const items = statementsRef.current?.querySelectorAll(".diff-statement");
      if (items && items.length > 0) {
        gsap.fromTo(
          items,
          { opacity: 0, x: -24 },
          {
            opacity: 1,
            x: 0,
            duration: 0.9,
            stagger: 0.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: statementsRef.current,
              start: "top 75%",
            },
          }
        );
      }
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative w-full py-28 sm:py-36 md:py-44 bg-[#080808] border-t border-white/[0.06] overflow-hidden"
    >
      {/* Subtle atmospheric radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[950px] h-[550px] pointer-events-none blur-[140px] opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, #FF6D29 0%, #B83B1B 40%, #453027 80%, transparent 100%)",
        }}
      />

      {/* Precision calibration measurement lines (felt engineering) */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute left-6 sm:left-12 top-12 bottom-12 w-px bg-white/[0.04] hidden lg:block" />
      <div className="absolute right-6 sm:right-12 top-12 bottom-12 w-px bg-white/[0.04] hidden lg:block" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 md:px-12">
        {/* Technical Calibration Index Marks */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-16 sm:mb-24">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#FF6D29]">
            03 — Philosophical Differentiator
          </span>
          <div className="flex items-center gap-4 font-mono text-[10px] text-white/40">
            <span>TOL: 0.00%</span>
            <span>·</span>
            <span>DETERMINISTIC KERNEL</span>
          </div>
        </div>

        {/* Section Headline */}
        <div className="max-w-4xl mb-20 sm:mb-28">
          <h2
            ref={headlineRef}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[70px] font-medium tracking-tight text-white leading-[1.08] mb-8"
          >
            AI can read the evidence.
            <br />
            Proofline checks the{" "}
            <span className="font-serif italic font-normal text-[#FFA776] bg-gradient-to-r from-[#FFD2B8] via-[#FF8A50] to-[#FF6D29] bg-clip-text text-transparent">
              claim.
            </span>
          </h2>
          <p
            ref={copyRef}
            className="font-display text-lg sm:text-2xl text-[#BABABA] max-w-2xl leading-relaxed font-normal"
          >
            Interpretation can be probabilistic.
            <br className="hidden sm:inline" />
            <span className="text-white font-medium">Critical verification shouldn't be.</span>
          </p>
        </div>

        {/* Three Authoritative Precision Statements */}
        <div
          ref={statementsRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 pt-8 border-t border-white/[0.08]"
        >
          {/* Statement 01 */}
          <div className="diff-statement p-8 sm:p-10 rounded-2xl bg-[#110F11]/80 border border-white/[0.08] relative group">
            <div className="flex items-center justify-between mb-8">
              <span className="font-mono text-[11px] text-[#FF6D29] tracking-widest uppercase">
                Axis · 01
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6D29]/60" />
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-white leading-snug mb-4">
              AI where interpretation matters.
            </h3>
            <p className="font-display text-sm text-[#BABABA] leading-relaxed">
              Extracting facts, parsing handwritten manifests, and reading visual weighbridge tickets
              without brittle OCR templates.
            </p>
          </div>

          {/* Statement 02 */}
          <div className="diff-statement p-8 sm:p-10 rounded-2xl bg-[#110F11]/80 border border-[#FF6D29]/25 relative group shadow-[0_10px_30px_rgba(255,109,41,0.06)]">
            <div className="flex items-center justify-between mb-8">
              <span className="font-mono text-[11px] text-[#FF6D29] tracking-widest uppercase">
                Axis · 02
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6D29]" />
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-white leading-snug mb-4">
              Deterministic logic where certainty matters.
            </h3>
            <p className="font-display text-sm text-[#BABABA] leading-relaxed">
              Arithmetic reconciliation, mathematical tolerance thresholds, and rigorous validation
              executed with zero hallucination.
            </p>
          </div>

          {/* Statement 03 */}
          <div className="diff-statement p-8 sm:p-10 rounded-2xl bg-[#110F11]/80 border border-white/[0.08] relative group">
            <div className="flex items-center justify-between mb-8">
              <span className="font-mono text-[11px] text-[#FF6D29] tracking-widest uppercase">
                Axis · 03
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6D29]/60" />
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-white leading-snug mb-4">
              Traceability where accountability matters.
            </h3>
            <p className="font-display text-sm text-[#BABABA] leading-relaxed">
              Every verified kilogram and dollar explicitly tied back to source files, visual crops,
              and tamper-evident findings.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
