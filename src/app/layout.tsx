import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NextMove — v0.1 prototype",
  description:
    "Give us your real experience and the job you want. NextMove creates a stronger, honest application adapted to the German hiring market.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
