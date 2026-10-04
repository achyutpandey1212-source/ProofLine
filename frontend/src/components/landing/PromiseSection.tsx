import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

interface PrincipleItem {
  number: string;
  title: string;
  copy: string;
}

const PRINCIPLES: PrincipleItem[] = [
  {
    number: "01",
    title: "Understand",
    copy: "Make sense of documents, images and records.",
  },
  {
    number: "02",
    title: "Verify",
    copy: "Check claims against the evidence behind them.",
  },
  {
    number: "03",
    title: "Decide",
    copy: "Know when the numbers, records and story don't align.",
  },
];

export const PromiseSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const principlesListRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) return;

      // Headline entrance
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

      // Progressive reveal of the 3 principles
      const items = principlesListRef.current?.querySelectorAll(".principle-row");
      if (items && items.length > 0) {
        gsap.fromTo(
          items,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.22,
            ease: "power3.out",
            scrollTrigger: {
              trigger: principlesListRef.current,
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
        className="absolute top-1/3 -right-36 w-[450px] h-[600px] pointer-events-none rounded-full border border-[#FF6D29]/15 blur-[1px] opacity-35"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(255, 109, 41, 0.15) 0%, transparent 70%)",
          transform: "rotate(24deg)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8 md:px-12">
        {/* Large Centered Headline */}
        <div className="text-center max-w-3xl mx-auto mb-24 sm:mb-32">
          <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#FF6D29] block mb-6">
            02 — The Promise
          </span>
          <h2
            ref={headlineRef}
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[76px] font-medium tracking-tight text-white leading-[1.04] mb-8"
          >
            From evidence
            <br />
            <span className="text-white/40">to </span>
            <span className="font-serif italic font-normal text-[#FFA776] bg-gradient-to-r from-[#FFD2B8] via-[#FF8A50] to-[#FF6D29] bg-clip-text text-transparent">
              confidence.
            </span>
          </h2>
          <p className="font-display text-lg sm:text-xl text-[#BABABA] max-w-xl mx-auto leading-relaxed">
            Proofline turns real-world evidence into decisions you can trace, understand and act on.
          </p>
        </div>

        {/* Three Minimal Principles — Large Typography with Subtle Separators */}
        <div ref={principlesListRef} className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {PRINCIPLES.map((item) => (
            <div
              key={item.number}
              className="principle-row py-12 sm:py-16 md:py-20 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-baseline transition-colors hover:bg-white/[0.015]"
            >
              {/* Monospace Indicator */}
              <div className="md:col-span-2">
                <span className="font-mono text-sm tracking-wider text-[#FF6D29]">
                  {item.number}
                </span>
              </div>

              {/* Principle Name */}
              <div className="md:col-span-5">
                <h3 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white">
                  {item.title}
                </h3>
              </div>

              {/* Short Statement */}
              <div className="md:col-span-5">
                <p className="font-display text-base sm:text-lg text-[#BABABA] leading-relaxed">
                  {item.copy}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
