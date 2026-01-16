import type { Metadata } from "next";
import { Inter, Outfit, Roboto_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import AppHeader from "@/components/AppHeader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "Funding Dashboard",
  description: "Find funding arbitrage opportunities",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`
          ${inter.variable} 
          ${robotoMono.variable}
          ${outfit.variable}
          antialiased
          bg-gray-900
          text-gray-200
        `}
      >
        {/* ====== page container ====== */}
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <AppHeader />

          <main className="mt-6">
            {children}
          </main>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
