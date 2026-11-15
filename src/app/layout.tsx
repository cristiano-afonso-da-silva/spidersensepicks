import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: "./fonts/InterVariable.woff2",
  variable: "--font-inter",
  weight: "100 900",
  style: "normal",
  display: "swap",
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
