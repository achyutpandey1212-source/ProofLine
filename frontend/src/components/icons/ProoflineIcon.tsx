import React from "react";

interface ProoflineIconProps {
  className?: string;
  size?: number;
}

/**
 * Proofline Brand Mark:
 * A precision geometric proof-symbol combining an architectural shield contour
 * with an evidence check/datum stroke and a vermillion convergence point.
 * Works seamlessly at 14px–24px.
 */
export const ProoflineIcon: React.FC<ProoflineIconProps> = ({
  className = "w-4 h-4",
  size = 18,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* Precision verification shield contour: crisp, authoritative, mathematical */}
      <path
        d="M10 2.2L3.5 5.2V9.8C3.5 14.1 6.3 17.1 10 18.2C13.7 17.1 16.5 14.1 16.5 9.8V5.2L10 2.2Z"
        stroke="#F4F1EA"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-90"
      />

      {/* Internal verification stroke: check / proof datum line */}
      <path
        d="M7 10.2L9.2 12.4L13.2 8.4"
        stroke="#F4F1EA"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Subtle vermillion precision anchor point */}
      <circle
        cx="10"
        cy="2.2"
        r="1.2"
        fill="#E15B35"
      />
    </svg>
  );
};
