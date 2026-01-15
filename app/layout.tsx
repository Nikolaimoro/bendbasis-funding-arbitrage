import type { Metadata } from "next";
<<<<<<< HEAD
import { Inter, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
=======
import { Analytics } from "@vercel/analytics/next"
import { Inter, Roboto_Mono } from "next/font/google";
>>>>>>> 683a2ba (vercel analytics)
import "./globals.css";
import AppHeader from "@/components/AppHeader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500"],
  display: "swap",
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
          ${outfit.variable}
          antialiased
          bg-gray-900
          text-gray-200
        `}
      >
        {/* ====== page container ====== */}
        <div className="max-w-[1600px] mx-auto px-6 py-4">
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
