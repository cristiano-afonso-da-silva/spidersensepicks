"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type Props = {
  hero: ReactNode;
  children: ReactNode;
};

export function ParallaxShell({ hero, children }: Props) {
  const [scrollY, setScrollY] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReduced = () => setReduced(media.matches);
    syncReduced();
    media.addEventListener("change", syncReduced);

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrollY(window.scrollY));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      media.removeEventListener("change", syncReduced);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const y = reduced ? 0 : scrollY;
  const heroFade = reduced ? 1 : Math.max(0, 1 - y / 420);

  const layerFar: CSSProperties = {
    transform: `translate3d(0, ${y * 0.28}px, 0)`,
  };
  const layerNear: CSSProperties = {
    transform: `translate3d(0, ${y * 0.12}px, 0)`,
  };
  const heroStyle: CSSProperties = {
    transform: `translate3d(0, ${y * 0.22}px, 0)`,
    opacity: heroFade,
  };

  return (
    <div className="parallax-root">
      <div className="parallax-stage" aria-hidden>
        <div className="parallax-layer parallax-layer-far" style={layerFar} />
        <div className="parallax-layer parallax-layer-mid" style={layerNear} />
        <div className="parallax-veil" />
      </div>

      <main className="shell relative z-10 py-12 sm:py-16">
        <div className="parallax-hero will-change-transform" style={heroStyle}>
          {hero}
        </div>
        <div className="relative z-10">{children}</div>
      </main>
    </div>
  );
}
