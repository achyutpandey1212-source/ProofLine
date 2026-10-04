import React from "react";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "prominent" | "subtle";
}

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = "",
  variant = "default",
}) => {
  const variantStyles = {
    default:
      "bg-[#141215]/85 hover:bg-[#181418] border-white/[0.08] hover:border-white/[0.18] shadow-[0_16px_40px_rgba(0,0,0,0.7)]",
    prominent:
      "bg-gradient-to-b from-[#1d1418]/90 to-[#120F12]/90 hover:from-[#24171d] hover:to-[#171217] border-[#FF6D29]/30 hover:border-[#FF6D29]/60 shadow-[0_16px_40px_rgba(255,109,41,0.12)]",
    subtle:
      "bg-[#0e0c0f]/75 border-white/[0.05] shadow-[0_8px_24px_rgba(0,0,0,0.5)]",
  };

  return (
    <div
      className={`rounded-2xl sm:rounded-3xl border backdrop-blur-md transition-all duration-300 ${variantStyles[variant]} ${className}`}
    >
      {children}
    </div>
  );
};
