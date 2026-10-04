import React from "react";

interface HeroBackgroundProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export const HeroBackground: React.FC<HeroBackgroundProps> = ({
  videoRef,
  videoContainerRef,
}) => {
  return (
    <div
      ref={videoContainerRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden bg-proof-black will-change-transform"
    >
      {/* 
        Central Celestial Sphere treatment:
        Inspired by the reference image's deep glowing cosmic curvature that spans across the center/horizon.
        The Mars video is centered with cinematic perspective, complemented by radial horizon ambient glow.
      */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="w-full h-full object-cover object-[center_62%] md:object-[center_60%] lg:object-center will-change-transform"
        >
          <source src="/video/gemini_generated_video_4082fbe4.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Layered cinematic overlays: preserving Mars burnt-orange horizon atmosphere with central editorial lighting */}
      {/* 1. Deep celestial ambient vignette around the perimeter */}
      <div className="absolute inset-0 bg-proof-black/30 pointer-events-none" />

      {/* 2. Soft radial vignette from center-out to ensure edges fade smoothly into deep charcoal/black */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(8,8,8,0.0)_20%,rgba(8,8,8,0.7)_70%,rgba(8,8,8,0.95)_100%)] pointer-events-none" />

      {/* 3. Subtle warm vermillion ambient atmospheric rim glow behind the horizon */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_52%,rgba(225,91,53,0.14)_0%,rgba(199,90,50,0.05)_40%,transparent_75%)] pointer-events-none" />

      {/* 4. Top and bottom gradients for navigation clarity and seamless transition */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-proof-black/90 via-proof-black/40 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-proof-black via-proof-black/80 to-transparent pointer-events-none" />
    </div>
  );
};
