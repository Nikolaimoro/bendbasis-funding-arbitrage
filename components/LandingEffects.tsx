"use client";

import { useEffect } from "react";

export default function LandingEffects() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    const root = document.documentElement;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let frame: number | null = null;

    const animate = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      root.style.setProperty("--grad-x", `${currentX.toFixed(2)}px`);
      root.style.setProperty("--grad-y", `${currentY.toFixed(2)}px`);
      frame = window.requestAnimationFrame(animate);
    };

    const handleMove = (event: PointerEvent) => {
      const { innerWidth, innerHeight } = window;
      if (!innerWidth || !innerHeight) return;
      const x = (event.clientX / innerWidth - 0.5) * 36;
      const y = (event.clientY / innerHeight - 0.5) * 24;
      targetX = x;
      targetY = y;
    };

    const handleLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    frame = window.requestAnimationFrame(animate);
    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("mouseleave", handleLeave);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

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
