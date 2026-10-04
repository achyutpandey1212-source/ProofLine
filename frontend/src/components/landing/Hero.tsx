import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { HeroNavigation } from "./HeroNavigation";
import { HeroBackground } from "./HeroBackground";
import { HeroContent } from "./HeroContent";
import { HeroMicroUI } from "./HeroMicroUI";

gsap.registerPlugin(ScrollTrigger);

export const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const headlineLine1Ref = useRef<HTMLSpanElement>(null);
  const headlineLine2Ref = useRef<HTMLSpanElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const ctaGroupRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        // Reduced motion: immediate reveal without displacement
        gsap.set(
          [
            videoContainerRef.current,
            navRef.current,
            headlineLine1Ref.current,
            headlineLine2Ref.current,
            descriptionRef.current,
            ctaGroupRef.current,
            scrollIndicatorRef.current,
          ],
          { opacity: 1, y: 0 }
        );
        return;
      }

      // Initial state setups
      gsap.set(videoContainerRef.current, { opacity: 0 });
      gsap.set(navRef.current, { opacity: 0, y: -8 });
      gsap.set(headlineLine1Ref.current, { opacity: 0, y: 28 });
      gsap.set(headlineLine2Ref.current, { opacity: 0, y: 28 });
      gsap.set(descriptionRef.current, { opacity: 0, y: 14 });
      gsap.set(ctaGroupRef.current, { opacity: 0, y: 14 });
      gsap.set(scrollIndicatorRef.current, { opacity: 0 });

      // Choreographed Master Entrance Timeline:
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      // 0.20s: Video fade-in
      tl.to(
        videoContainerRef.current,
        {
          opacity: 1,
          duration: 1.4,
          ease: "power2.inOut",
        },
        0.2
      )
        // 0.40s: Nav
        .to(
          navRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power2.out",
          },
          0.4
        )
        // 0.65s: Headline Line 1 ("Proof,")
        .to(
          headlineLine1Ref.current,
          {
            opacity: 1,
            y: 0,
            duration: 1.0,
            ease: "power4.out",
          },
          0.65
        )
        // 0.85s: Headline Line 2 ("not promises.")
        .to(
          headlineLine2Ref.current,
          {
            opacity: 1,
            y: 0,
            duration: 1.0,
            ease: "power4.out",
          },
          0.85
        )
        // 1.10s: Supporting copy
        .to(
          descriptionRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
          },
          1.1
        )
        // 1.30s: Improvised CTA Group
        .to(
          ctaGroupRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: "power3.out",
          },
          1.3
        )
        // 1.55s: Micro UI
        .to(
          scrollIndicatorRef.current,
          {
            opacity: 1,
            duration: 0.9,
            ease: "power2.out",
          },
          1.55
        );

      // ScrollTrigger: Cinematic scroll orchestration
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom 30%",
          scrub: 1.0,
          invalidateOnRefresh: true,
        },
      });

      // 1. Mars video scales 1.0 -> 1.08 with central horizon depth
      if (videoRef.current) {
        scrollTl.to(
          videoRef.current,
          {
            scale: 1.08,
            yPercent: 4,
            ease: "none",
          },
          0
        );
      }

      // 2. Hero content moves upward slightly and fades gradually
      if (contentWrapperRef.current) {
        scrollTl.to(
          contentWrapperRef.current,
          {
            y: -50,
            opacity: 0,
            ease: "power2.inOut",
          },
          0
        );
      }

      // 3. Header background transition on scroll
      if (navRef.current) {
        ScrollTrigger.create({
          trigger: containerRef.current,
          start: "15% top",
          onEnter: () => {
            gsap.to(navRef.current, {
              backgroundColor: "rgba(8, 8, 8, 0.85)",
              backdropFilter: "blur(12px)",
              borderColor: "rgba(244, 241, 234, 0.08)",
              borderBottomWidth: "1px",
              duration: 0.4,
            });
          },
          onLeaveBack: () => {
            gsap.to(navRef.current, {
              backgroundColor: "rgba(8, 8, 8, 0)",
              backdropFilter: "blur(0px)",
              borderColor: "rgba(244, 241, 234, 0)",
              borderBottomWidth: "0px",
              duration: 0.4,
            });
          },
        });
      }
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative w-full h-[100svh] min-h-[660px] overflow-hidden bg-proof-black text-proof-offwhite flex flex-col justify-between"
    >
      {/* Navigation */}
      <HeroNavigation navRef={navRef} />

      {/* Cinematic Mars Central Celestial Sphere Background */}
      <HeroBackground videoRef={videoRef} videoContainerRef={videoContainerRef} />

      {/* Hero Typographic Content */}
      <HeroContent
        contentWrapperRef={contentWrapperRef}
        headlineLine1Ref={headlineLine1Ref}
        headlineLine2Ref={headlineLine2Ref}
        descriptionRef={descriptionRef}
        ctaGroupRef={ctaGroupRef}
      />

      {/* Micro UI */}
      <HeroMicroUI scrollIndicatorRef={scrollIndicatorRef} />
    </section>
  );
};
