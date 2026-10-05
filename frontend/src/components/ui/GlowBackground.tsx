import React from "react";

interface GlowBackgroundProps {
  children: React.ReactNode;
  className?: string;
  glowIntensity?: "subtle" | "prominent";
}

export const GlowBackground: React.FC<GlowBackgroundProps> = ({
  children,
  className = "",
  glowIntensity = "prominent",
}) => {
  return (
    <div className={`relative min-h-screen bg-[#080808] text-white selection:bg-[#FF6D29]/20 selection:text-white overflow-x-clip ${className}`}>
      {/* Top ambient radial bloom */}
      <div
        className={`absolute -top-32 left-1/2 -translate-x-1/2 w-[650px] sm:w-[900px] h-[520px] pointer-events-none blur-[130px] ${
          glowIntensity === "prominent" ? "opacity-45" : "opacity-30"
        }`}
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 30%, #FF6D29 0%, #B83B1B 45%, #453027 80%, transparent 100%)",
        }}
      />

      {/* Orbital curved ring arcs on left and right */}
      <div
        className="absolute -top-16 -left-48 sm:-left-28 w-[380px] sm:w-[500px] h-[640px] pointer-events-none rounded-full border border-[#FF6D29]/15 blur-[1px] opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 80% 50%, rgba(255, 109, 41, 0.18) 0%, rgba(69, 48, 39, 0.08) 50%, transparent 80%)",
          transform: "rotate(-18deg)",
        }}
      />
      <div
        className="absolute -top-16 -right-48 sm:-right-28 w-[380px] sm:w-[500px] h-[640px] pointer-events-none rounded-full border border-[#FF6D29]/15 blur-[1px] opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(255, 109, 41, 0.18) 0%, rgba(69, 48, 39, 0.08) 50%, transparent 80%)",
          transform: "rotate(18deg)",
        }}
      />

      {/* Ambient stardust pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25 mix-blend-screen"
        style={{
          backgroundImage: `radial-gradient(circle at 18% 25%, rgba(255,255,255,0.7) 1px, transparent 1px),
                            radial-gradient(circle at 74% 18%, rgba(255,255,255,0.6) 1px, transparent 1px),
                            radial-gradient(circle at 86% 62%, rgba(255,255,255,0.5) 1px, transparent 1px),
                            radial-gradient(circle at 34% 78%, rgba(255,255,255,0.4) 1px, transparent 1px),
                            radial-gradient(circle at 58% 38%, rgba(255,255,255,0.8) 1.2px, transparent 1.2px)`,
          backgroundSize: "320px 320px",
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
};
