import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

interface AudienceCategory {
  tag: string;
  title: string;
  description: string;
  metricLabel: string;
}

const AUDIENCE_CATEGORIES: AudienceCategory[] = [
  {
    tag: "01",
    title: "Recyclers",
    description: "Verify material, weight and transaction records across physical depots and weighbridges.",
    metricLabel: "Scale & Ticket Reconciliation",
  },
  {
    tag: "02",
    title: "Manufacturers",
    description: "Validate supplier claims, incoming raw bill-of-materials, and shipment integrity.",
    metricLabel: "Inbound Manifest Validation",
  },
  {
    tag: "03",
    title: "Procurement",
    description: "Check evidence before releasing capital or approving high-volume transactions.",
    metricLabel: "Disbursement Checkpoint",
  },
  {
    tag: "04",
    title: "Audit & Compliance",
    description: "Turn scattered folders and paper records into traceable, mathematically verified findings.",
    metricLabel: "Audit Trail Readiness",
  },
  {
    tag: "05",
    title: "Government & Regulators",
    description: "Support environmental inspection, EPR credit authentication, and regulatory reconciliation.",
    metricLabel: "Statutory Filing Verification",
  },
];

export const AudienceSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

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

      const items = listRef.current?.querySelectorAll(".audience-row");
      if (items && items.length > 0) {
        gsap.fromTo(
          items,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: listRef.current,
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
      {/* Orbital curved ring arc */}
      <div
        className="absolute top-1/4 -right-40 w-[460px] h-[620px] pointer-events-none rounded-full border border-[#FF6D29]/15 blur-[1px] opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(255, 109, 41, 0.12) 0%, transparent 70%)",
          transform: "rotate(20deg)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 md:px-12">
        {/* Section Header */}
        <div className="max-w-3xl mb-20 sm:mb-28">
          <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#FF6D29] block mb-6">
            04 — Application
          </span>
          <h2
            ref={headlineRef}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-medium tracking-tight text-white leading-[1.08] mb-6"
          >
            Where{" "}
            <span className="font-serif italic font-normal text-[#FFA776] bg-gradient-to-r from-[#FFD2B8] via-[#FF8A50] to-[#FF6D29] bg-clip-text text-transparent">
              proof
            </span>{" "}
            matters.
          </h2>
          <p className="font-display text-lg sm:text-xl text-[#BABABA] max-w-xl leading-relaxed">
            Proofline can sit wherever a business decision depends on real-world evidence.
          </p>
        </div>

        {/* Refined Asymmetric List with Subtle Dividers — Not a Generic 5-Card Grid */}
        <div ref={listRef} className="border-t border-white/[0.08] divide-y divide-white/[0.08]">
          {AUDIENCE_CATEGORIES.map((cat) => (
            <div
              key={cat.tag}
              className="audience-row py-8 sm:py-12 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 md:gap-8 items-baseline transition-colors hover:bg-white/[0.015] px-2 sm:px-4"
            >
              {/* Index Column */}
              <div className="md:col-span-1">
                <span className="font-mono text-xs tracking-wider text-[#FF6D29]">
                  {cat.tag}
                </span>
              </div>

              {/* Title Column */}
              <div className="md:col-span-4">
                <h3 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-white">
                  {cat.title}
                </h3>
              </div>

              {/* Description Column */}
              <div className="md:col-span-4">
                <p className="font-display text-sm sm:text-base text-[#BABABA] leading-relaxed">
                  {cat.description}
                </p>
              </div>

              {/* Metric/Context Tag Column */}
              <div className="md:col-span-3 text-left md:text-right">
                <span className="inline-block font-mono text-[11px] tracking-wider text-white/50 bg-white/[0.03] border border-white/[0.06] rounded-full px-3 py-1">
                  {cat.metricLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
