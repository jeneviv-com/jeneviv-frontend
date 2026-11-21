import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { GeistPixelSquare } from "geist/font/pixel";
import "./globals.css";
import "./marketing.css";
import "./bachs.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://jeneviv.up.railway.app",
  ),
  title: {
    default: "jeneviv | Group collections, finally under control",
    template: "%s · jeneviv",
  },
  description:
    "jeneviv gives course reps, PTAs, cooperatives and associations a payment link, a live dashboard and a verified payer list. Every naira confirmed, every payer accounted for.",
  keywords: [
    "group collections Nigeria",
    "school fees collection",
    "course rep collection",
    "payment link Nigeria",
    "cooperative dues",
    "PTA levies",
    "jeneviv",
  ],
  applicationName: "jeneviv",
  authors: [{ name: "Acadeva Limited" }],
  creator: "jeneviv",
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "/",
    siteName: "jeneviv",
    title: "jeneviv | Group collections, finally under control",
    description:
      "One payment link. A live dashboard. A verified payer list. Built for the way Nigerian groups actually collect money.",
  },
  twitter: {
    card: "summary_large_image",
    title: "jeneviv | Group collections, finally under control",
    description:
      "One payment link. A live dashboard. A verified payer list. Built for the way Nigerian groups actually collect money.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${GeistPixelSquare.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href={appUrl} />
      </head>
      <body>{children}</body>
    </html>
  );
}
