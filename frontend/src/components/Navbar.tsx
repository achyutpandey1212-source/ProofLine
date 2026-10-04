import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ProoflineIcon } from "./icons/ProoflineIcon";
import { LogOut } from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const isCases = location.pathname.startsWith("/cases");
  const isHome = location.pathname === "/";

  return (
    <header className="sticky top-6 z-40 w-full px-4 sm:px-6 pointer-events-none mb-10 sm:mb-14">
      {/* 
        Horizontal-cylindrical / rounded pill container:
        - Floating, centered with max width
        - Deep obsidian glassmorphism with backdrop blur
        - Ultra-thin border with subtle ambient highlight
        - Ample bottom margin to create breathing room above page content
      */}
      <nav className="pointer-events-auto max-w-5xl mx-auto h-14 sm:h-16 px-4 sm:px-6 rounded-full bg-[#120F12]/80 border border-white/10 backdrop-blur-xl shadow-[0_16px_36px_rgba(0,0,0,0.65)] flex items-center justify-between transition-all">
        {/* Brand: Uses official Proofline logo image with typography matching landing */}
        <Link
          to="/"
          className="group inline-flex items-center gap-3 font-display tracking-[0.16em] text-xs sm:text-sm font-semibold uppercase text-proof-offwhite hover:text-white transition-colors"
        >
          <ProoflineIcon
            size={28}
            className="transition-transform duration-300 group-hover:scale-105"
          />
          <span className="tracking-[0.18em]">PROOFLINE</span>
        </Link>

        {/* Navigation Links: Strict order "Home" at start/left, then "Console" */}
        <div className="flex items-center gap-1 sm:gap-2 font-display text-xs sm:text-sm">
          <Link
            to="/"
            className={`px-3.5 sm:px-4 py-1.5 rounded-full transition-all ${
              isHome
                ? "bg-white/[0.08] text-white font-medium border border-white/10"
                : "text-[#BABABA] hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            Home
          </Link>
          <Link
            to="/cases"
            className={`px-3.5 sm:px-4 py-1.5 rounded-full transition-all ${
              isCases
                ? "bg-white/[0.08] text-white font-medium border border-white/10"
                : "text-[#BABABA] hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            Console
          </Link>
        </div>

        {/* User Status / Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden md:inline-block text-xs font-display text-[#BABABA] max-w-[140px] truncate">
                {user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 text-xs font-display text-[#BABABA] hover:text-white transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF6D29] to-[#E04516] text-white text-xs font-display font-medium shadow-[0_0_18px_rgba(255,109,41,0.4)] hover:shadow-[0_0_24px_rgba(255,109,41,0.6)] transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};
