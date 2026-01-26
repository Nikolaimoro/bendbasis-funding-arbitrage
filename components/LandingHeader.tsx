"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface BurgerIconProps {
  open: boolean;
  onClick: () => void;
}

function BurgerIcon({ open, onClick }: BurgerIconProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-6 h-6 flex flex-col items-center justify-center gap-1.25"
      aria-label={open ? "Close menu" : "Open menu"}
    >
      <span
        className={`block w-[22px] h-[1.5px] bg-black transition-all duration-300 ${
          open ? "rotate-45 translate-y-[4px]" : ""
        }`}
      />
      <span
        className={`block w-[22px] h-[1.5px] bg-black transition-all duration-300 ${
          open ? "-rotate-45 -translate-y-[3px]" : ""
        }`}
      />
    </button>
  );
}

export default function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 8);

      if (currentScrollY > 50) {
        if (currentScrollY > lastScrollY) {
          setIsVisible(false);
        } else if (currentScrollY < lastScrollY) {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <>
      <div className="h-[52px]" />
      <div
        className={[
          "fixed top-0 left-0 right-0 z-50",
          "flex gap-2 py-2 items-center border-b",
          isScrolled ? "border-[#E7E2E0] bg-white/90 backdrop-blur" : "border-transparent bg-transparent",
          "max-w-[1100px] px-8 mx-auto transition-transform duration-300",
          !isVisible && !mobileMenuOpen ? "-translate-y-full" : "translate-y-0",
        ].join(" ")}
      >
        <Link href="/" className="flex items-center pl-2" aria-label="bendbasis">
          <img
            src="/brand/logo_full.svg"
            alt="bendbasis"
            className="h-[18px] w-auto"
          />
        </Link>

        <div className="hidden md:flex ml-auto">
          <a
            href="/funding"
            className="inline-flex items-center justify-center rounded-full bg-[#201D1D] text-white text-sm font-medium px-6 py-2.5 hover:opacity-90 transition-opacity"
          >
            Open App
          </a>
        </div>

        <div className="md:hidden ml-auto">
          <BurgerIcon
            open={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          />
        </div>
      </div>

      <div
        className={[
          "fixed inset-0 z-40 bg-white pt-[52px]",
          "flex flex-col",
          "transition-all duration-300 ease-out md:hidden",
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto translate-y-0"
            : "opacity-0 pointer-events-none -translate-y-4",
        ].join(" ")}
      >
        <nav className="flex flex-col items-start gap-1 w-full pl-10 pr-6 pt-6">
          <a
            href="/funding"
            onClick={() => setMobileMenuOpen(false)}
            className="mt-2 w-full inline-flex items-center justify-center rounded-2xl bg-[#201D1D] text-white text-base font-medium py-3"
          >
            Open App
          </a>
        </nav>
        <div className="mt-auto w-full px-10 pb-8">
          <div className="border-t border-[#E7E2E0] pt-5">
            <div className="flex items-center gap-3">
              <a
                href="https://x.com/bendbasis"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Bendbasis on X"
                className="inline-flex h-10 w-10 items-center justify-center text-[#201D1D]"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4 fill-current"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.504 11.24h-6.662l-5.213-6.818-5.967 6.818H1.68l7.73-8.844L1.25 2.25h6.83l4.713 6.231L18.244 2.25zm-1.161 17.52h1.833L7.08 4.126H5.114l11.97 15.644z" />
                </svg>
              </a>
              <a
                href="https://t.me/bendbasis"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Bendbasis on Telegram"
                className="inline-flex h-10 w-10 items-center justify-center text-[#201D1D]"
              >
                <span
                  aria-hidden="true"
                  className="h-4 w-4 inline-block"
                  style={{
                    backgroundColor: "currentColor",
                    WebkitMaskImage: "url(/icons/social/telegram.svg)",
                    maskImage: "url(/icons/social/telegram.svg)",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                  }}
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
