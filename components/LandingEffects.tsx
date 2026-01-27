"use client";

import { useEffect } from "react";

export default function LandingEffects() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          el.classList.add("is-visible");
          observer.unobserve(el);
        });
      },
      { threshold: 0.2 }
    );

    elements.forEach((el) => {
      const delay = el.dataset.revealDelay;
      if (delay) {
        el.style.transitionDelay = `${delay}ms`;
      }
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
