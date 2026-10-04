import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

export const InfrastructureSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const copyRef = useRef<HTMLParagraphElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);

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

      const nodes = diagramRef.current?.querySelectorAll(".infra-node");
      if (nodes && nodes.length > 0) {
        gsap.fromTo(
          nodes,
          { opacity: 0, scale: 0.9 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.8,
            stagger: 0.12,
            ease: "back.out(1.4)",
            scrollTrigger: {
              trigger: diagramRef.current,
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
        {/* Section Header */}
        <div className="max-w-4xl mb-20 sm:mb-28">
          <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#FF6D29] block mb-6">
            07 — Infrastructure
          </span>
          <h2
            ref={headlineRef}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-medium tracking-tight text-white leading-[1.08] mb-8"
          >
            Verification shouldn't require
            <br />
            <span className="text-white/40">another </span>
            <span className="font-serif italic font-normal text-[#FFA776] bg-gradient-to-r from-[#FFD2B8] via-[#FF8A50] to-[#FF6D29] bg-clip-text text-transparent">
              workflow.
            </span>
          </h2>
          <p
            ref={copyRef}
            className="font-display text-lg sm:text-xl text-[#BABABA] max-w-2xl leading-relaxed"
          >
            Proofline can evolve from a destination into a layer — connecting to the systems where
            evidence already lives.
          </p>
        </div>

        {/* Abstract Convergence Architecture (No Code, No MCP, Pure Minimal Systems Abstract) */}
        <div
          ref={diagramRef}
          className="relative w-full h-[360px] sm:h-[420px] rounded-3xl bg-[#110F11]/80 border border-white/[0.08] p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden"
        >
          {/* Subtle grid backdrop */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, #FFFFFF 1px, transparent 1px), linear-gradient(to bottom, #FFFFFF 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          {/* Left Ingress Nodes: Existing Systems */}
          <div className="flex flex-col space-y-3 sm:space-y-4 w-full md:w-auto relative z-10">
            <div className="infra-node px-5 py-3 rounded-xl bg-[#161316] border border-white/10 text-left">
              <span className="font-mono text-[10px] text-white/40 uppercase block">Source A</span>
              <span className="font-display text-sm text-white font-medium">ERP & Ledger Records</span>
            </div>
            <div className="infra-node px-5 py-3 rounded-xl bg-[#161316] border border-white/10 text-left">
              <span className="font-mono text-[10px] text-white/40 uppercase block">Source B</span>
              <span className="font-display text-sm text-white font-medium">Weighbridge & Depot Terminals</span>
            </div>
            <div className="infra-node px-5 py-3 rounded-xl bg-[#161316] border border-white/10 text-left">
              <span className="font-mono text-[10px] text-white/40 uppercase block">Source C</span>
              <span className="font-display text-sm text-white font-medium">Trade Documents & Scans</span>
            </div>
          </div>

          {/* Center: The Proofline Verification Layer */}
          <div className="infra-node relative z-10 p-8 rounded-3xl bg-[#161316] border border-[#FF6D29]/40 text-center shadow-[0_0_50px_rgba(255,109,41,0.18)] max-w-xs w-full">
            <div className="w-2 h-2 rounded-full bg-[#FF6D29] mx-auto mb-3" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#FF6D29] block mb-1">
              Embedded Layer
            </span>
            <h3 className="font-display text-xl text-white font-medium tracking-tight mb-2">
              Proofline Core
            </h3>
            <p className="font-display text-xs text-[#BABABA] leading-relaxed">
              Deterministic Reconciliation & Factual Truth Engine
            </p>
          </div>

          {/* Right: Downstream Confidence & Action */}
          <div className="flex flex-col space-y-3 sm:space-y-4 w-full md:w-auto relative z-10">
            <div className="infra-node px-5 py-3 rounded-xl bg-[#161316] border border-white/10 text-left">
              <span className="font-mono text-[10px] text-[#FFA776] uppercase block">Action A</span>
              <span className="font-display text-sm text-white font-medium">Automated Settlement</span>
            </div>
            <div className="infra-node px-5 py-3 rounded-xl bg-[#161316] border border-white/10 text-left">
              <span className="font-mono text-[10px] text-[#FFA776] uppercase block">Action B</span>
              <span className="font-display text-sm text-white font-medium">Audit-Ready Compliance Log</span>
            </div>
            <div className="infra-node px-5 py-3 rounded-xl bg-[#161316] border border-white/10 text-left">
              <span className="font-mono text-[10px] text-[#FFA776] uppercase block">Action C</span>
              <span className="font-display text-sm text-white font-medium">Discrepancy Exception Flags</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
