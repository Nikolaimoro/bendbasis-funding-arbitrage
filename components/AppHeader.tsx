"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppHeader() {
  const path = usePathname();
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
        className={[
          "group relative text-base text-white font-roboto font-normal",
          "px-2 py-2.5 rounded-md transition-colors duration-200",
          "hover:bg-[#383d50]",
          "after:content-[''] after:absolute after:left-0 after:right-0 after:h-[2px]",
          "after:bg-gradient-to-r after:from-[#9E5DEE] after:to-[#FA814D]",
          "after:-bottom-[8px]",
          active
            ? "after:scale-x-100"
            : "after:scale-x-0 after:origin-left after:transition-transform after:duration-300 after:ease-out group-hover:after:scale-x-100",
        ].join(" ")}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="flex gap-4 mb-4 border-b border-[#343a4e] pb-1 items-center pl-4">
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
      {link("/funding", "Funding")}
      {link("/arbitrage", "Arbitrage")}
      {link("/backtester", "Backtester")}
    </div>
  );
}
