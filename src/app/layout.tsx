import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Spider Sense Picks | Results Tracker",
  description:
    "Private performance dashboard for Spider Sense Picks — log daily picks, odds, units, and results.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      style={
        {
          "--font-display": "var(--font-inter)",
          "--font-body": "var(--font-inter)",
          "--font-mono": "var(--font-inter)",
        } as React.CSSProperties
      }
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-inter)]">
        {children}
      </body>
    </html>
  );
}
