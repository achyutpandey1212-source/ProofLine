import React from "react";

interface ProoflineIconProps {
  className?: string;
  size?: number;
}

/**
 * Proofline Brand Mark:
 * Renders the official Minimalist Cream P Emblem with Terracotta Accent logo asset.
 */
export const ProoflineIcon: React.FC<ProoflineIconProps> = ({
  className = "w-5 h-5",
  size = 20,
}) => {
  return (
    <img
      src="/logo/proofline-logo.png"
      alt="Proofline"
      width={size}
      height={size}
      className={`shrink-0 object-contain rounded-sm select-none ${className}`}
      style={{ width: size, height: size }}
      loading="eager"
    />
  );
};
