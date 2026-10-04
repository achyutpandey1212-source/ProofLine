import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

export const StatementSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const sublineRef = useRef<HTMLSpanElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) return;

      gsap.fromTo(
        headlineRef.current,
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 70%",
          },
        }
      );

      gsap.fromTo(
        sublineRef.current,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          delay: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 70%",
          },
        }
      );

      gsap.fromTo(
        ctaRef.current,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.3,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 70%",
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative w-full pt-32 sm:pt-40 md:pt-48 pb-16 sm:pb-24 bg-[#080808] border-t border-white/[0.06] overflow-hidden text-center"
    >
      {/* Subtle atmospheric radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[950px] h-[550px] pointer-events-none blur-[140px] opacity-35"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, #FF6D29 0%, #B83B1B 45%, #453027 80%, transparent 100%)",
        }}
      />
      {/* Orbital curved ring arc */}
      <div
        className="absolute top-1/4 -right-36 w-[450px] h-[600px] pointer-events-none rounded-full border border-[#FF6D29]/15 blur-[1px] opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(255, 109, 41, 0.18) 0%, transparent 70%)",
          transform: "rotate(18deg)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8">
        <h2
          ref={headlineRef}
          className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-[84px] font-medium tracking-tight text-white leading-[1.05] mb-4"
        >
          Don't take the claim at face value.
        </h2>
        <span
          ref={sublineRef}
          className="block font-serif italic font-normal text-4xl sm:text-6xl md:text-7xl lg:text-[84px] tracking-tight text-[#FFA776] bg-gradient-to-r from-[#FFD2B8] via-[#FF8A50] to-[#FF6D29] bg-clip-text text-transparent leading-[1.05] mb-12 sm:mb-16"
        >
          Verify it.
        </span>

        <div ref={ctaRef} className="inline-flex items-center justify-center">
          <Link
            to="/cases"
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-black font-display font-medium text-base hover:bg-[#FF6D29] hover:text-white transition-all duration-300 shadow-[0_4px_30px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_35px_rgba(255,109,41,0.4)]"
          >
            <span>Start a verification</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};
