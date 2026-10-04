import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

export const ContextSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const bigStatRef = useRef<HTMLDivElement>(null);
  const sideFactsRef = useRef<HTMLDivElement>(null);

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
        bigStatRef.current,
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          delay: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 65%",
          },
        }
      );

      const sideItems = sideFactsRef.current?.querySelectorAll(".side-fact");
      if (sideItems && sideItems.length > 0) {
        gsap.fromTo(
          sideItems,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            stagger: 0.18,
            ease: "power3.out",
            scrollTrigger: {
              trigger: sideFactsRef.current,
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

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 md:px-12">
        {/* Section Header — Magazine Style */}
        <div className="max-w-4xl mb-20 sm:mb-28">
          <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#FF6D29] block mb-6">
            05 — The Scale
          </span>
          <h2
            ref={headlineRef}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-medium tracking-tight text-white leading-[1.08]"
          >
            The world is already moving enormous amounts of material.
            <br />
            <span className="text-white/40">The evidence moving with it is </span>
            <span className="font-serif italic font-normal text-[#FFA776] bg-gradient-to-r from-[#FFD2B8] via-[#FF8A50] to-[#FF6D29] bg-clip-text text-transparent">
              harder to trust.
            </span>
          </h2>
        </div>

        {/* Editorial Magazine Spread Layout (1 Dominant Number + 2 Small Supporting Facts) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 pt-8 border-t border-white/[0.08] items-start">
          {/* Dominant Stat Left Column */}
          <div
            ref={bigStatRef}
            className="lg:col-span-7 p-8 sm:p-12 md:p-14 rounded-3xl bg-[#110F11]/90 border border-white/[0.08] relative"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#FF6D29] block mb-4">
              Material Volume
            </span>
            <div className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-[96px] font-medium tracking-tighter text-white leading-none mb-6">
              2.12 Billion
            </div>
            <p className="font-display text-xl sm:text-2xl text-white/90 leading-snug max-w-xl mb-8">
              Tonnes of municipal solid waste generated globally each year, with paper declarations
              outpacing physical verification.
            </p>
            <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-[#BABABA]">
              <span>Source — World Bank</span>
              <span>What a Waste 2.0 (2018)</span>
            </div>
          </div>

          {/* Supporting Authoritative Facts Right Column */}
          <div ref={sideFactsRef} className="lg:col-span-5 flex flex-col space-y-6">
            {/* Supporting Fact 01 */}
            <div className="side-fact p-8 rounded-2xl bg-[#110F11]/60 border border-white/[0.06] flex flex-col justify-between">
              <div>
                <span className="font-mono text-3xl sm:text-4xl font-medium text-[#FFA776] block mb-3">
                  9%
                </span>
                <p className="font-display text-base text-white/90 leading-relaxed mb-4">
                  Of global plastic waste produced has ever been recycled. The gap between claimed recycling
                  and physical reprocessing is obscured by scattered documentation.
                </p>
              </div>
              <div className="pt-4 border-t border-white/[0.06] text-[10px] font-mono text-white/40">
                Source — OECD Global Plastics Outlook (2022)
              </div>
            </div>

            {/* Supporting Fact 02 */}
            <div className="side-fact p-8 rounded-2xl bg-[#110F11]/60 border border-white/[0.06] flex flex-col justify-between">
              <div>
                <span className="font-mono text-3xl sm:text-4xl font-medium text-white block mb-3">
                  Up to 30%
                </span>
                <p className="font-display text-base text-white/90 leading-relaxed mb-4">
                  Of transboundary waste shipments investigated in compliance audits contain classification
                  or weight documentation anomalies.
                </p>
              </div>
              <div className="pt-4 border-t border-white/[0.06] text-[10px] font-mono text-white/40">
                Source — European Commission Environmental Compliance & Governance (2021)
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
