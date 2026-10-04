import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Results Tracker · Spider Sense Picks",
  description:
    "Spider Sense Picks results tracker: every posted pick with odds, stake, outcome and net units.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
