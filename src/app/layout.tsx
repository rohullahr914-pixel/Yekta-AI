import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-serif", display: "swap" });
export const metadata: Metadata = { title: "Yekta AI — a little closer", description: "A thoughtful space for meaningful conversation. Meet Yekta, your AI companion." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body className={`${dmSans.variable} ${cormorant.variable}`}>{children}</body></html>; }
