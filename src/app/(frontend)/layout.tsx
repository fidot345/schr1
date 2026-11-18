import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Zilla_Slab } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const zillaSlab = Zilla_Slab({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-zilla-slab",
  display: "swap",
});

const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Schreinerei Tannrieder",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className={`${zillaSlab.variable} ${atkinson.variable}`}>
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
