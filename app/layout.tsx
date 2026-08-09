import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--f-display",
  display: "block",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--f-mono",
  display: "block",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--f-sans",
  display: "swap",
});

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(BASE), 
  title: "Frame in Goa \u2014 Hacker House Goa 2026",
  description:
    "Drop a photo, get your Hacker House Goa 2026 profile frame or builder boarding pass. Download it, post it. #FrameInGoa",
  openGraph: {
    title: "Frame in Goa \u2014 Hacker House Goa 2026",
    description:
      "Drop a photo, get your HH Goa 2026 frame or builder pass in seconds. No login.",
    type: "website",
    url: BASE,
  },
  twitter: {
    card: "summary_large_image",
    title: "Frame in Goa \u2014 Hacker House Goa 2026",
    description:
      "Drop a photo, get your HH Goa 2026 frame or builder pass in seconds. No login.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D1B2A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${mono.variable} ${sans.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
