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

        {/* Minimal Navigation links inspired by reference: subtle editorial text */}
        <nav className="hidden md:flex items-center gap-8 font-display text-[13px] text-proof-gray font-normal tracking-wide">
          <a href="#how-it-works" className="hover:text-proof-offwhite transition-colors duration-200">
            System
          </a>
          <a href="#evidence" className="hover:text-proof-offwhite transition-colors duration-200">
            Evidence
          </a>
          <a href="#tolerance" className="hover:text-proof-offwhite transition-colors duration-200">
            Tolerance Engine
          </a>
          <a href="#docs" className="hover:text-proof-offwhite transition-colors duration-200">
            Specs
          </a>
        </nav>

        {/* Minimal Right Action: Sign In & Console / Get Started */}
        <div className="flex items-center gap-4 sm:gap-6 font-display">
          {!user && (
            <Link
              to="/login"
              className="text-xs sm:text-[13px] tracking-wide text-proof-gray hover:text-proof-offwhite transition-colors font-medium hidden sm:inline-block"
            >
              Sign In
            </Link>
          )}
          <Link
            to={user ? "/cases" : "/cases"}
            className="text-xs sm:text-[13px] tracking-[0.06em] font-medium text-proof-offwhite px-4 py-2 border border-proof-offwhite/20 hover:border-proof-offwhite/45 transition-all duration-200 bg-proof-charcoal/60 backdrop-blur-sm rounded-[10px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-proof-vermillion"
          >
            {user ? "Console" : "Get started"}
          </Link>
        </div>
      </div>
    </header>
  );
};
