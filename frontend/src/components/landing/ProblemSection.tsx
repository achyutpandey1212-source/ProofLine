import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

export const ProblemSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fragmentsRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const copyRef = useRef<HTMLParagraphElement>(null);
  const focalPointRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) return;

      // Text reveal
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
            start: "top 75%",
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
            start: "top 75%",
          },
        }
      );

      // Convergence of fragments toward focal center
      const fragments = fragmentsRef.current?.querySelectorAll(".evidence-fragment");
      if (fragments && fragments.length > 0) {
        gsap.to(fragments, {
          x: 0,
          y: 0,
          scale: 0.92,
          opacity: 0.85,
          ease: "power1.inOut",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 60%",
            end: "bottom 80%",
            scrub: 1.2,
          },
        });
      }

      // Focal glow pulse
      if (focalPointRef.current) {
        gsap.fromTo(
          focalPointRef.current,
          { scale: 0.8, opacity: 0.3 },
          {
            scale: 1.15,
            opacity: 0.9,
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 50%",
              end: "bottom 70%",
              scrub: true,
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
      {/* Subtle atmospheric background gradient & orbital arcs */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[950px] h-[550px] pointer-events-none blur-[140px] opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, #FF6D29 0%, #B83B1B 45%, #453027 80%, transparent 100%)",
        }}
      />
      <div
        className="absolute top-1/4 -left-36 w-[450px] h-[600px] pointer-events-none rounded-full border border-[#FF6D29]/15 blur-[1px] opacity-35"
        style={{
          background:
            "radial-gradient(ellipse at 80% 50%, rgba(255, 109, 41, 0.15) 0%, transparent 70%)",
          transform: "rotate(-20deg)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 md:px-12">
        {/* Editorial Heading */}
        <div className="max-w-3xl mb-20 sm:mb-28">
          <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#FF6D29] block mb-6">
            01 — The Friction
          </span>
          <h2
            ref={headlineRef}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-medium tracking-tight text-white leading-[1.08] mb-6"
          >
            Claims are everywhere.
            <br />
            <span className="font-serif italic font-normal text-[#FFA776] bg-gradient-to-r from-[#FFD2B8] via-[#FF8A50] to-[#FF6D29] bg-clip-text text-transparent">
              Proof
            </span>{" "}
            <span className="text-white/40">is fragmented.</span>
          </h2>
          <p
            ref={copyRef}
            className="font-display text-lg sm:text-xl text-[#BABABA] max-w-xl leading-relaxed font-normal"
          >
            Businesses make decisions using invoices, receipts, photographs, records and declarations
            — often scattered across systems and people.
          </p>
        </div>

        {/* Abstract Evidence Fragment Composition (Fragments converging on scroll) */}
        <div
          ref={fragmentsRef}
          className="relative w-full h-[480px] sm:h-[540px] md:h-[580px] rounded-[32px] bg-[#110F11]/60 border border-white/[0.07] overflow-hidden flex items-center justify-center"
        >
          {/* Subtle grid backdrop */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, #FFFFFF 1px, transparent 1px), linear-gradient(to bottom, #FFFFFF 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          {/* Central convergence node */}
          <div
            ref={focalPointRef}
            className="relative z-10 flex flex-col items-center justify-center text-center p-8 rounded-full bg-[#161316] border border-[#FF6D29]/40 shadow-[0_0_60px_rgba(255,109,41,0.2)]"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF6D29] mb-3 animate-ping" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#FF6D29]">
              Reconciled Node
            </span>
            <span className="font-display text-xs text-white/80 mt-0.5">Clarity</span>
          </div>

          {/* Fragment 01 — Top Left: Invoice Manifest Snippet */}
          <div
            className="evidence-fragment absolute left-6 sm:left-14 top-10 sm:top-14 p-4 sm:p-5 rounded-2xl bg-[#161316]/90 border border-white/10 backdrop-blur-md shadow-2xl transition-transform"
            style={{ transform: "translate(-35px, -25px)" }}
          >
            <div className="flex items-center justify-between gap-6 mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#BABABA]">
                Commercial Invoice
              </span>
              <span className="font-mono text-[10px] text-white/40">INV-89211</span>
            </div>
            <div className="font-mono text-base sm:text-lg text-white font-medium">560.00 kg</div>
            <div className="text-[11px] font-sans text-white/50 mt-1">Stated Gross Dispatched</div>
          </div>

          {/* Fragment 02 — Top Right: Calibration Timestamp */}
          <div
            className="evidence-fragment absolute right-6 sm:right-16 top-12 sm:top-16 p-4 sm:p-5 rounded-2xl bg-[#161316]/90 border border-white/10 backdrop-blur-md shadow-2xl transition-transform"
            style={{ transform: "translate(40px, -20px)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#BABABA]">
                Scale Terminal 01
              </span>
            </div>
            <div className="font-mono text-base sm:text-lg text-white font-medium">184.60 kg</div>
            <div className="text-[11px] font-mono text-white/40 mt-1">14:22:08 UTC · CAL-VERIFIED</div>
          </div>

          {/* Fragment 03 — Bottom Left: Visual Inspection Tag */}
          <div
            className="evidence-fragment absolute left-8 sm:left-20 bottom-12 sm:bottom-16 p-4 sm:p-5 rounded-2xl bg-[#161316]/90 border border-white/10 backdrop-blur-md shadow-2xl transition-transform"
            style={{ transform: "translate(-30px, 30px)" }}
          >
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#BABABA] mb-1.5">
              Material Classification
            </div>
            <div className="font-display text-sm sm:text-base text-white font-medium">
              Aluminium Ingot 6063
            </div>
            <div className="font-mono text-[10px] text-[#FFA776] mt-1">Density Match: 99.4%</div>
          </div>

          {/* Fragment 04 — Bottom Right: Scale Ticket 02 */}
          <div
            className="evidence-fragment absolute right-8 sm:right-20 bottom-10 sm:bottom-14 p-4 sm:p-5 rounded-2xl bg-[#161316]/90 border border-white/10 backdrop-blur-md shadow-2xl transition-transform"
            style={{ transform: "translate(35px, 25px)" }}
          >
            <div className="flex items-center justify-between gap-6 mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#BABABA]">
                Gross Axle Tare
              </span>
              <span className="font-mono text-[10px] text-white/40">TKT-0043</span>
            </div>
            <div className="font-mono text-base sm:text-lg text-white font-medium">371.00 kg</div>
            <div className="text-[11px] font-sans text-white/50 mt-1">Aggregate Batch 02 & 03</div>
          </div>

          {/* Connecting vector hair-lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-white/[0.08] stroke-dasharray-[4_6]">
            <line x1="20%" y1="20%" x2="50%" y2="50%" />
            <line x1="80%" y1="20%" x2="50%" y2="50%" />
            <line x1="25%" y1="80%" x2="50%" y2="50%" />
            <line x1="75%" y1="80%" x2="50%" y2="50%" />
          </svg>
        </div>

        {/* Narrative transition anchor */}
        <div className="mt-12 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/40">
            Fragmented evidence → deterministic clarity
          </p>
        </div>
      </div>
    </section>
  );
};
