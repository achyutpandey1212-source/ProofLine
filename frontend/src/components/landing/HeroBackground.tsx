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
      {/* Cinematic Mars Video Asset */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="w-full h-full object-cover object-[70%_bottom] md:object-[65%_center] lg:object-center will-change-transform"
      >
        <source src="/video/gemini_generated_video_4082fbe4.mp4" type="video/mp4" />
      </video>

      {/* Layered cinematic overlays: preserving Mars burnt-orange atmosphere while maximizing editorial typography contrast */}
      {/* 1. Base subtle ambient tone to avoid harsh clipping */}
      <div className="absolute inset-0 bg-proof-black/35 pointer-events-none" />

      {/* 2. Strong directional gradient: deep shadow on the left third for razor-sharp typography readability, easing out across the planet */}
      <div className="absolute inset-0 bg-gradient-to-r from-proof-black via-proof-black/80 to-transparent pointer-events-none md:w-[70%] lg:w-[60%]" />

      {/* 3. Subtle vertical framing: top shadow for minimal header clarity, bottom shadow for graceful transition to subsequent sections */}
      <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-proof-black/85 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-proof-black via-proof-black/70 to-transparent pointer-events-none" />
    </div>
  );
};
