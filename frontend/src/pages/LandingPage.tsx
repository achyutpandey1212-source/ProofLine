import React from "react";
import { Hero } from "../components/landing/Hero";

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-proof-black text-proof-offwhite font-sans selection:bg-proof-orange/20 selection:text-proof-offwhite">
      {/* Landing Page Hero and minimal header only */}
      <Hero />
    </div>
  );
};
