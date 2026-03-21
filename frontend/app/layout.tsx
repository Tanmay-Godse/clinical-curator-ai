import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Clinical Skills Coach",
  description:
    "Simulation-only suturing practice coach with a live mock trainer loop.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
