import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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
        {/* Brand: ● PROOFLINE */}
        <Link
          to="/"
          className="group inline-flex items-center gap-2.5 font-display tracking-[0.22em] text-xs sm:text-[13px] font-semibold uppercase text-proof-offwhite hover:text-white transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-proof-vermillion inline-block shrink-0 transition-transform duration-300 group-hover:scale-125 shadow-[0_0_10px_rgba(225,91,53,0.4)]" />
          <span>PROOFLINE</span>
        </Link>

        {/* Minimal Right Action: Console */}
        <nav className="flex items-center font-display">
          <Link
            to={user ? "/cases" : "/login"}
            className="text-xs sm:text-[13px] tracking-[0.08em] font-medium text-proof-offwhite/80 hover:text-proof-offwhite px-3.5 py-1.5 sm:px-4 sm:py-2 border border-proof-offwhite/20 hover:border-proof-offwhite/45 transition-all duration-200 bg-proof-charcoal/40 backdrop-blur-[2px]"
          >
            Console
          </Link>
        </nav>
      </div>
    </header>
  );
};
