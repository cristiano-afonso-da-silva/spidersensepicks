import type { Metadata } from "next";
import { EB_Garamond, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const garamond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Spider Sense Picks | Performance Report",
  description:
    "Private performance dashboard for Spider Sense Picks — log daily picks, odds, units, and results.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${garamond.variable} ${mono.variable} h-full antialiased`}
      style={
        {
          "--font-display": "var(--font-eb-garamond)",
          "--font-body": "var(--font-eb-garamond)",
        } as React.CSSProperties
      }
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-eb-garamond)]">
        {children}
      </body>
    </html>
  );
}
