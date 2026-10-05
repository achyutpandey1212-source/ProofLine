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
      {/* Subtle atmospheric vignette at the very top (restrained, no heavy orange cast) */}
      <div
        className={`absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] sm:w-[900px] h-[400px] pointer-events-none blur-[140px] ${
          glowIntensity === "prominent" ? "opacity-12" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 30%, #FF6D29 0%, #B83B1B 45%, #251B17 80%, transparent 100%)",
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
