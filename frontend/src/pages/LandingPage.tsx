import React from "react";
import { Hero } from "../components/landing/Hero";
import { FinalCTASection } from "../components/landing/FinalCTASection";

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#080808] text-proof-offwhite font-sans selection:bg-proof-orange/20 selection:text-proof-offwhite overflow-x-hidden">
      {/* 01 — Hero */}
      <Hero />

      {/* 02 — Footer */}
      <FinalCTASection />
    </div>
  );
};

