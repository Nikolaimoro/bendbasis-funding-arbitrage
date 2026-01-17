"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/* ---------- nav items ---------- */
const NAV_ITEMS = [
  { href: "/funding", label: "Funding" },
  { href: "/arbitrage", label: "Arbitrage" },
  { href: "/backtester", label: "Backtester" },
];

export default function AppHeader() {
  const path = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const logoToneByPath: Record<string, "light" | "dark"> = {
    "/funding": "light",
    "/arbitrage": "light",
    "/backtester": "light",
  };
  const logoTone =
    Object.entries(logoToneByPath).find(([route]) => path.startsWith(route))
      ?.[1] ?? "light";
  const logoClassName =
    logoTone === "light"
      ? "h-[18px] w-auto invert"
      : "h-[18px] w-auto invert-0";

  const link = (href: string, label: string) => {
    const active = path.startsWith(href);
    return (
      <Link
        href={href}
        className={`text-base text-white font-roboto font-normal ${
          active ? "opacity-100" : "opacity-80 hover:opacity-100"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <>
      {/* desktop + mobile header bar */}
      <div className="flex gap-6 mb-6 border-b border-gray-800 pb-3 items-baseline pl-6 pr-6 justify-between">
        <div className="flex gap-6 items-baseline">
          <Link
            href="/funding"
            className="flex items-center"
            aria-label="Funding Dashboard Home"
          >
            <img
              src="/brand/logo.svg"
              alt="Funding Dashboard"
              className={logoClassName}
            />
          </Link>
          {/* desktop nav - hidden on mobile */}
          <div className="hidden md:flex gap-6 items-baseline">
            {NAV_ITEMS.map((item) => (
              <div key={item.href}>{link(item.href, item.label)}</div>
            ))}
          </div>
        </div>

        {/* mobile burger button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden relative w-6 h-6 flex flex-col justify-center items-center z-50"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {/* top line */}
          <span
            className={`block w-6 h-0.5 bg-white transition-all duration-300 ease-out ${
              mobileMenuOpen
                ? "rotate-45 translate-y-0"
                : "-translate-y-1.5 rotate-0"
            }`}
          />
          {/* middle line */}
          <span
            className={`block w-6 h-0.5 bg-white transition-all duration-300 ease-out ${
              mobileMenuOpen ? "opacity-0 scale-0" : "opacity-100 scale-100"
            }`}
          />
          {/* bottom line */}
          <span
            className={`block w-6 h-0.5 bg-white transition-all duration-300 ease-out ${
              mobileMenuOpen
                ? "-rotate-45 translate-y-0"
                : "translate-y-1.5 rotate-0"
            }`}
          />
        </button>
      </div>

      {/* mobile menu overlay */}
      <div
        className={`fixed inset-0 bg-gray-900/95 backdrop-blur-sm z-40 transition-opacity duration-300 ease-out md:hidden ${
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* menu items container */}
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {NAV_ITEMS.map((item, index) => {
            const active = path.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-3xl text-white font-roboto font-normal transition-all duration-300 ease-out ${
                  active ? "opacity-100" : "opacity-80 hover:opacity-100"
                } ${
                  mobileMenuOpen
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
                style={{
                  transitionDelay: mobileMenuOpen
                    ? `${50 + index * 50}ms`
                    : "0ms",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
