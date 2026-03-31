import type { Metadata } from "next";
import { Bebas_Neue, DM_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  subsets: ["latin"],
});

const instrument = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskBoard — Agentic Todo Manager",
  description: "A brutalist task manager with editorial flair",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bebas.variable} ${dmMono.variable} ${instrument.variable} antialiased`}
    >
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
