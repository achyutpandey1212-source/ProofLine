import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Globe } from "lucide-react";

export const FinalCTASection: React.FC = () => {
  return (
    <footer id="footer" className="relative w-full px-2 sm:px-4 md:px-6 pb-6 pt-16 sm:pt-24 bg-[#080808] text-proof-offwhite overflow-hidden">
      {/* 
        Full-width obsidian card container matching Schmidt reference and modern clean design:
        - Pure obsidian background (#110F11) with ultra-fine border
        - Rich terracotta sunset horizon glow
        - Clean, professional typography with ZERO AI-slop pills
        - Edge-to-edge watermark wordmark
      */}
      <div className="relative w-full rounded-[32px] sm:rounded-[44px] md:rounded-[52px] bg-[#110F11] border border-white/[0.08] px-8 sm:px-14 md:px-20 pt-16 sm:pt-20 md:pt-24 pb-0 overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.9)] flex flex-col justify-between min-h-[640px] sm:min-h-[720px]">
        
        {/* Terracotta / brand-orange sunset glow at bottom */}
        <div
          className="absolute inset-x-0 bottom-0 h-[380px] sm:h-[480px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 95% 75% at 50% 100%, rgba(255, 109, 41, 0.45) 0%, rgba(199, 90, 50, 0.28) 38%, rgba(69, 48, 39, 0.12) 68%, transparent 100%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#FF6D29]/25 via-[#C75A32]/10 to-transparent pointer-events-none" />

        {/* 
          REGION 1: Clean, professional, modern layout
          Top Row: Nav on Left, Social & Contacts on Right (Pure Schmidt layout)
        */}
        <div className="relative z-10 w-full flex flex-col sm:flex-row justify-between items-start gap-10">
          
          {/* Left: Clean Navigation Stack */}
          <div className="flex flex-col space-y-4 font-display text-xl sm:text-2xl font-medium tracking-tight text-white/90">
            <Link to="/" className="hover:text-white transition-colors w-max">
              Home
            </Link>
            <Link to="/cases" className="hover:text-white transition-colors w-max">
              Console
            </Link>
            <Link to="/cases" className="hover:text-white transition-colors w-max">
              Reconciliation
            </Link>
            <Link to="/login" className="hover:text-white transition-colors w-max">
              Sign In
            </Link>
          </div>

          {/* Right: Social Channels & Contact Info */}
          <div className="flex flex-col items-start sm:items-end text-left sm:text-right space-y-3 font-display">
            {/* Social icons row */}
            <div className="flex items-center gap-3 mb-2 text-proof-offwhite">
              <a
                href="https://proofline.dev"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center hover:bg-white/[0.14] hover:border-white/25 transition-all text-proof-offwhite"
                aria-label="Website"
              >
                <Globe className="w-4 h-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center hover:bg-white/[0.14] hover:border-white/25 transition-all text-proof-offwhite"
                aria-label="GitHub"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center hover:bg-white/[0.14] hover:border-white/25 transition-all text-proof-offwhite"
                aria-label="X"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center hover:bg-white/[0.14] hover:border-white/25 transition-all text-proof-offwhite"
                aria-label="LinkedIn"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>

            <div className="text-sm text-[#BABABA]">
              E-mail: <span className="text-white font-medium">verify@proofline.dev</span>
            </div>
            <div className="text-sm text-[#BABABA]">
              Case Inquiries: <span className="text-white font-medium">+1 (800) 776-6354</span>
            </div>
            <div className="text-sm text-[#BABABA]">
              San Francisco, CA
            </div>
          </div>
        </div>

        {/* 
          Middle: Clear, Monumental Call-to-Action (NO PILLS)
        */}
        <div className="relative z-10 my-16 sm:my-20 flex flex-col items-center text-center">
          <h3 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white mb-3 max-w-2xl leading-tight">
            Ready to verify{" "}
            <span className="font-serif italic font-normal text-[#FFA776] bg-gradient-to-r from-[#FFD2B8] via-[#FF8A50] to-[#FF6D29] bg-clip-text text-transparent">
              real-world
            </span>{" "}
            transactions?
          </h3>
          <p className="font-display text-base sm:text-lg text-[#BABABA] max-w-lg mb-8 leading-relaxed">
            Proofline turns physical manifests, scale tickets, and ERP slips into audited proof.
          </p>

          {/* 3D Flip Action Button */}
          <div className="group relative [perspective:1000px]">
            <Link
              to="/cases"
              className="relative block h-[54px] sm:h-[58px] w-[250px] sm:w-[270px] rounded-full transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateX(180deg)] shadow-[0_8px_30px_rgba(0,0,0,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6D29]"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* FRONT FACE */}
              <div
                className="absolute inset-0 flex items-center justify-between px-7 rounded-full bg-[#F4F1EA] text-[#000000] border border-[#F4F1EA] shadow-[0_4px_24px_rgba(244,241,234,0.2)]"
                style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
              >
                <span className="font-semibold text-[15px] tracking-wide text-black select-none">
                  Start a verification
                </span>
                <span className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center shrink-0">
                  <ArrowRight className="w-4 h-4 text-black stroke-[2.2]" />
                </span>
              </div>

              {/* BACK FACE */}
              <div
                className="absolute inset-0 flex items-center justify-between px-7 rounded-full bg-[#FF6D29] text-[#F4F1EA] border border-[#FF6D29] shadow-[0_8px_32px_rgba(255,109,41,0.4)] [transform:rotateX(180deg)]"
                style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
              >
                <span className="font-semibold text-[15px] tracking-wide text-[#F4F1EA] select-none">
                  Start a verification
                </span>
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <ArrowRight className="w-4 h-4 text-[#F4F1EA] stroke-[2.2] translate-x-0.5" />
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* 
          REGION 2: Occupies the WHOLE WIDTH edge-to-edge
          Massive watermark typography ("Proofline") centered and spanning across the horizon
        */}
        <div className="relative z-0 mt-8 sm:mt-12 select-none pointer-events-none w-full overflow-hidden flex items-end justify-center">
          <div className="text-[20vw] sm:text-[21vw] md:text-[21.5vw] font-display font-bold leading-[0.78] tracking-tighter text-white/[0.07] text-center w-full transform translate-y-3 sm:translate-y-6 md:translate-y-8 select-none">
            Proofline
          </div>
        </div>
      </div>
    </footer>
  );
};
