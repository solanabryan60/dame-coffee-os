'use client';

import { useEffect, useRef, useState } from 'react';

const clips = [
  {
    src: '/assets/hero-source/cold-brew-plastic.mp4',
    description: 'Iced cold brew in a clear plastic cup.',
  },
  {
    src: '/assets/hero-source/matcha-cafe-pour.mp4',
    description: 'Fresh whisked matcha being poured into milk at the café bar.',
  },
];

const cutDurationSeconds = 3;

export default function HomeHeroReel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [clipIndex, setClipIndex] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.pause();
      return;
    }

    video.play().catch(() => {
      // The reel is decorative; a visitor can continue using the page without it.
    });
  }, [clipIndex]);

  return (
    <video
      key={clipIndex}
      ref={videoRef}
      className="dame-home-v3-hero-video"
      src={clips[clipIndex].src}
      autoPlay
      muted
      playsInline
      preload="auto"
      aria-label={clips[clipIndex].description}
      onTimeUpdate={(event) => {
        if (event.currentTarget.currentTime >= cutDurationSeconds) {
          setClipIndex((current) => (current + 1) % clips.length);
        }
      }}
      onEnded={() => setClipIndex((current) => (current + 1) % clips.length)}
      onError={() => setClipIndex((current) => (current + 1) % clips.length)}
    />
  );
}
