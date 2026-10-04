import React from "react";
import { Hero } from "../components/landing/Hero";
import { ProblemSection } from "../components/landing/ProblemSection";
import { PromiseSection } from "../components/landing/PromiseSection";
import { DifferentiatorSection } from "../components/landing/DifferentiatorSection";
import { AudienceSection } from "../components/landing/AudienceSection";
import { ContextSection } from "../components/landing/ContextSection";
import { VisionSection } from "../components/landing/VisionSection";
import { InfrastructureSection } from "../components/landing/InfrastructureSection";
import { StatementSection } from "../components/landing/StatementSection";
import { FinalCTASection } from "../components/landing/FinalCTASection";

export const LandingPage: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-[#080808] text-proof-offwhite font-sans selection:bg-proof-orange/20 selection:text-proof-offwhite overflow-x-hidden">
      {/* Ambient stardust pattern across entire landing experience */}
      <div
        className="fixed inset-0 pointer-events-none opacity-25 mix-blend-screen z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 18% 25%, rgba(255,255,255,0.7) 1px, transparent 1px),
                            radial-gradient(circle at 74% 18%, rgba(255,255,255,0.6) 1px, transparent 1px),
                            radial-gradient(circle at 86% 62%, rgba(255,255,255,0.5) 1px, transparent 1px),
                            radial-gradient(circle at 34% 78%, rgba(255,255,255,0.4) 1px, transparent 1px),
                            radial-gradient(circle at 58% 38%, rgba(255,255,255,0.8) 1.2px, transparent 1.2px)`,
          backgroundSize: "320px 320px",
        }}
      />

      {/* 01 — Hero (Preserved completely) */}
      <Hero />

      {/* 02 — Section 01: The Problem */}
      <ProblemSection />

      {/* 03 — Section 02: The Proofline Promise */}
      <PromiseSection />

      {/* 04 — Section 03: The Differentiator */}
      <DifferentiatorSection />

      {/* 05 — Section 04: Who It's For */}
      <AudienceSection />

      {/* 06 — Section 05: The Scale / Context */}
      <ContextSection />

      {/* 07 — Section 06: The Bigger Vision */}
      <VisionSection />

      {/* 08 — Section 07: The Integration / Infrastructure Idea */}
      <InfrastructureSection />

      {/* 09 — Section 08: Final Statement Before Footer */}
      <StatementSection />

      {/* 10 — Footer (Preserved completely) */}
      <FinalCTASection />
    </div>
  );
};

