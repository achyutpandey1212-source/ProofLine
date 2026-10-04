import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

const EXPANSION_TIERS = [
  { label: "Transactions", note: "Individual shipments & scale tickets" },
  { label: "Suppliers", note: "Recurring vendor counterparty integrity" },
  { label: "Facilities", note: "Site-wide mass-balance accounting" },
  { label: "Supply Chains", note: "End-to-end custody transfer verification" },
  { label: "Compliance", note: "Statutory ESG and regulatory filing truth" },
];

export const VisionSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const copyRef = useRef<HTMLParagraphElement>(null);
  const tiersRef = useRef<HTMLDivElement>(null);

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

      const tiers = tiersRef.current?.querySelectorAll(".vision-tier");
      if (tiers && tiers.length > 0) {
        gsap.fromTo(
          tiers,
          { opacity: 0.2, x: -16 },
          {
            opacity: 1,
            x: 0,
            duration: 0.8,
            stagger: 0.16,
            ease: "power2.out",
            scrollTrigger: {
              trigger: tiersRef.current,
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
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[950px] h-[550px] pointer-events-none blur-[140px] opacity-25"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, #FF6D29 0%, #B83B1B 40%, #453027 80%, transparent 100%)",
        }}
      />
      {/* Orbital curved ring arc */}
      <div
        className="absolute top-1/3 -left-36 w-[450px] h-[600px] pointer-events-none rounded-full border border-[#FF6D29]/15 blur-[1px] opacity-35"
        style={{
          background:
            "radial-gradient(ellipse at 80% 50%, rgba(255, 109, 41, 0.15) 0%, transparent 70%)",
          transform: "rotate(-18deg)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 md:px-12">
        {/* Section Header */}
        <div className="max-w-4xl mb-20 sm:mb-28">
          <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#FF6D29] block mb-6">
            06 — Horizon
          </span>
          <h2
            ref={headlineRef}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-medium tracking-tight text-white leading-[1.08] mb-8"
          >
            Today, a transaction.
            <br />
            <span className="text-white/40">Tomorrow, a </span>
            <span className="font-serif italic font-normal text-[#FFA776] bg-gradient-to-r from-[#FFD2B8] via-[#FF8A50] to-[#FF6D29] bg-clip-text text-transparent">
              verification layer.
            </span>
          </h2>
          <p
            ref={copyRef}
            className="font-display text-lg sm:text-xl text-[#BABABA] max-w-2xl leading-relaxed"
          >
            Proofline starts by verifying individual claims. The same intelligence can eventually sit
            inside the systems businesses already use.
          </p>
        </div>

        {/* Minimal Progression without dates (Transactions -> Suppliers -> Facilities -> Supply Chains -> Compliance) */}
        <div ref={tiersRef} className="pt-8 border-t border-white/[0.08] space-y-3 sm:space-y-4 max-w-4xl">
          {EXPANSION_TIERS.map((tier, idx) => {
            const isRoot = idx === 0;
            return (
              <div
                key={tier.label}
                className={`vision-tier p-6 sm:p-8 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isRoot
                    ? "bg-[#161316] border-[#FF6D29]/40 shadow-[0_4px_30px_rgba(255,109,41,0.1)]"
                    : "bg-[#110F11]/60 border-white/[0.06] hover:border-white/15"
                }`}
              >
                <div className="flex items-center gap-4 sm:gap-6">
                  <span
                    className={`font-mono text-xs ${
                      isRoot ? "text-[#FF6D29]" : "text-white/30"
                    }`}
                  >
                    0{idx + 1}
                  </span>
                  <span className="font-display text-xl sm:text-2xl md:text-3xl font-medium text-white tracking-tight">
                    {tier.label}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-display text-xs sm:text-sm text-[#BABABA]">
                    {tier.note}
                  </span>
                  {isRoot && (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#FF6D29] bg-[#FF6D29]/10 border border-[#FF6D29]/30 rounded-full px-2.5 py-0.5">
                      Current Wedge
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
