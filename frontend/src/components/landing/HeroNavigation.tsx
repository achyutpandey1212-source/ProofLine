import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ProoflineIcon } from "../icons/ProoflineIcon";

interface HeroNavigationProps {
  navRef: React.RefObject<HTMLElement | null>;
}

export const HeroNavigation: React.FC<HeroNavigationProps> = ({ navRef }) => {
  const { user } = useAuth();

  return (
    <header
      ref={navRef}
      className="fixed top-0 left-0 w-full z-40 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-12 h-20 sm:h-24 flex items-center justify-between">
        {/* Brand: [Proofline icon] PROOFLINE */}
        <Link
          to="/"
          className="group inline-flex items-center gap-2.5 font-display tracking-[0.22em] text-xs sm:text-[13px] font-semibold uppercase text-proof-offwhite hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-proof-vermillion"
        >
          <ProoflineIcon
            size={18}
            className="transition-transform duration-300 group-hover:scale-105"
          />
          <span>PROOFLINE</span>
        </Link>

        {/* Minimal Right Action: Console (8-10px rounded geometry) */}
        <nav className="flex items-center font-display">
          <Link
            to={user ? "/cases" : "/login"}
            className="text-xs sm:text-[13px] tracking-[0.06em] font-medium text-proof-offwhite/85 hover:text-proof-offwhite px-4 py-2 border border-proof-offwhite/20 hover:border-proof-offwhite/45 transition-all duration-200 bg-proof-charcoal/50 backdrop-blur-[2px] rounded-[9px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-proof-vermillion"
          >
            Console
          </Link>
        </nav>
      </div>
    </header>
  );
};
