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
  const eyebrowRef = useRef<HTMLDivElement>(null);
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
        // Reduced motion: immediate reveal without heavy displacement or continuous camera animations
        gsap.set(
          [
            videoContainerRef.current,
            navRef.current,
            eyebrowRef.current,
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

      // Initial state setups: page begins dark/subdued
      gsap.set(videoContainerRef.current, { opacity: 0 });
      gsap.set(navRef.current, { opacity: 0, y: -8 });
      gsap.set(eyebrowRef.current, { opacity: 0, y: 12 });
      gsap.set(headlineLine1Ref.current, { opacity: 0, y: 28 });
      gsap.set(headlineLine2Ref.current, { opacity: 0, y: 28 });
      gsap.set(descriptionRef.current, { opacity: 0, y: 14 });
      gsap.set(ctaGroupRef.current, { opacity: 0, y: 14 });
      gsap.set(scrollIndicatorRef.current, { opacity: 0 });

      // Choreographed Master Entrance Timeline:
      // 0.00s Page is almost black.
      // 0.20s Mars video begins to become visible.
      // 0.40s PROOFLINE fades in and moves upward ~8px.
      // 0.60s Eyebrow fades in and moves upward ~12px.
      // 0.75s "Proof," enters with a subtle upward motion.
      // 0.95s "not promises." enters slightly after it.
      // 1.20s Supporting copy fades upward.
      // 1.40s Primary CTA and secondary CTA enter.
      // 1.70s Micro UI elements appear.
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
        // 0.40s: Nav (PROOFLINE)
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
        // 0.60s: Eyebrow
        .to(
          eyebrowRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: "power3.out",
          },
          0.6
        )
        // 0.75s: Headline Line 1 ("Proof,")
        .to(
          headlineLine1Ref.current,
          {
            opacity: 1,
            y: 0,
            duration: 1.0,
            ease: "power4.out",
          },
          0.75
        )
        // 0.95s: Headline Line 2 ("not promises.")
        .to(
          headlineLine2Ref.current,
          {
            opacity: 1,
            y: 0,
            duration: 1.0,
            ease: "power4.out",
          },
          0.95
        )
        // 1.20s: Supporting copy
        .to(
          descriptionRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
          },
          1.2
        )
        // 1.40s: CTAs
        .to(
          ctaGroupRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: "power3.out",
          },
          1.4
        )
        // 1.70s: Micro UI
        .to(
          scrollIndicatorRef.current,
          {
            opacity: 1,
            duration: 1.0,
            ease: "power2.out",
          },
          1.7
        );

      // Micro UI line pulse animation (calm and rhythmic)
      gsap.to(".scroll-line-pulse", {
        scaleY: 0.35,
        transformOrigin: "top center",
        opacity: 0.25,
        repeat: -1,
        yoyo: true,
        duration: 2.0,
        ease: "sine.inOut",
      });

      // ScrollTrigger: Cinematic scroll orchestration
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.2,
          invalidateOnRefresh: true,
        },
      });

      // 1. Mars video scales 1.0 -> 1.08 and drifts subtly downward/right
      if (videoRef.current) {
        scrollTl.to(
          videoRef.current,
          {
            scale: 1.08,
            xPercent: 3,
            yPercent: 6,
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
            y: -80,
            opacity: 0,
            ease: "power2.inOut",
          },
          0
        );
      }

      // 3. Scroll indicator fades early
      if (scrollIndicatorRef.current) {
        scrollTl.to(
          scrollIndicatorRef.current,
          {
            opacity: 0,
            duration: 0.3,
            ease: "power1.out",
          },
          0
        );
      }

      // 4. Subtle header background transition as user scrolls past 15%
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
      className="relative w-full h-[100svh] min-h-[640px] overflow-hidden bg-proof-black text-proof-offwhite flex flex-col justify-between"
    >
      {/* Navigation */}
      <HeroNavigation navRef={navRef} />

      {/* Cinematic Mars Video Background */}
      <HeroBackground videoRef={videoRef} videoContainerRef={videoContainerRef} />

      {/* Hero Typographic Content (Left-Third, Large Negative Space) */}
      <HeroContent
        contentWrapperRef={contentWrapperRef}
        eyebrowRef={eyebrowRef}
        headlineLine1Ref={headlineLine1Ref}
        headlineLine2Ref={headlineLine2Ref}
        descriptionRef={descriptionRef}
        ctaGroupRef={ctaGroupRef}
      />

      {/* Micro UI: SCROLL & SYS // 01 */}
      <HeroMicroUI scrollIndicatorRef={scrollIndicatorRef} />
    </section>
  );
};
