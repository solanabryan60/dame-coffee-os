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

const cutDurationMilliseconds = 6500;

export default function HomeHeroReel() {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [clipIndex, setClipIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      videoRefs.current.forEach((video) => video?.pause());
      return;
    }

    const nextIndex = (clipIndex + 1) % clips.length;
    const nextVideo = videoRefs.current[nextIndex];

    const timer = window.setTimeout(() => {
      if (nextVideo) {
        nextVideo.currentTime = 0;
        nextVideo.play().catch(() => {
          // The reel is decorative; a visitor can continue using the page without it.
        });
      }
      setClipIndex(nextIndex);
    }, cutDurationMilliseconds);

    return () => window.clearTimeout(timer);
  }, [clipIndex]);

  return (
    <>
      {clips.map((clip, index) => (
        <video
          key={clip.src}
          ref={(video) => {
            videoRefs.current[index] = video;
          }}
          className={`dame-home-v3-hero-video ${index === clipIndex ? 'is-active' : ''}`}
          src={clip.src}
          autoPlay
          muted
          playsInline
          loop
          preload="auto"
          aria-label={clip.description}
        />
      ))}
    </>
  );
}
