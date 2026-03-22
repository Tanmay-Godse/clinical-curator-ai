import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const displayFont = Manrope({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-display",
});

const bodyFont = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "AI Clinical Skills Coach",
  description:
    "Simulation-only suturing practice coach with live stage-by-stage feedback.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${displayFont.variable} ${bodyFont.variable}`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
