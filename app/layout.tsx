import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, JetBrains_Mono, Inter, Noto_Sans_Devanagari, Fraunces, Noto_Serif_Devanagari } from "next/font/google";
import "./globals.css";

/* Huge condensed grotesque — bold tropical display */
const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--f-display",
  display: "block",
});

/* Tight monospace for metadata, labels, serial numbers */
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--f-mono",
  display: "block",
});

/* Devanagari font for Goa native mark */
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["700"],
  variable: "--f-devanagari",
  display: "block",
});

/* Body / UI sans */
const sans = Inter({
  subsets: ["latin"],
  variable: "--f-sans",
  display: "swap",
});

const passDisplay = Fraunces({
  subsets: ['latin'], weight: ['600','700','900'], style: ['normal','italic'],
  display: 'block', variable: '--font-pass-display',
});
const passMono = JetBrains_Mono({
  subsets: ['latin'], weight: ['400','500','600','700'],
  display: 'block', variable: '--font-pass-mono',
});
const passDeva = Noto_Serif_Devanagari({
  subsets: ['devanagari'], weight: ['600','700'],
  display: 'block', variable: '--font-pass-deva',
});

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: "Frame in Goa — Hacker House Goa 2026",
  description:
    "Drop a photo, get your Hacker House Goa 2026 profile frame or builder boarding pass. Download it, post it. #FrameInGoa",
  openGraph: {
    title: "Frame in Goa — Hacker House Goa 2026",
    description:
      "Drop a photo, get your HH Goa 2026 frame or builder pass in seconds. No login.",
    type: "website",
    url: BASE,
  },
  twitter: {
    card: "summary_large_image",
    title: "Frame in Goa — Hacker House Goa 2026",
    description:
      "Drop a photo, get your HH Goa 2026 frame or builder pass in seconds. No login.",
  },
};

export const viewport: Viewport = {
  themeColor: "#F5ECD7",
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
      className={`${display.variable} ${mono.variable} ${sans.variable} ${devanagari.variable} ${passDisplay.variable} ${passMono.variable} ${passDeva.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
