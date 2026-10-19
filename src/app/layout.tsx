import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./marketing.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://jeneviv.com",
  ),
  title: {
    default: "Jeneviv — Group collections, finally under control",
    template: "%s · Jeneviv",
  },
  description:
    "Jeneviv gives course reps, PTAs, cooperatives and associations a payment link, a live dashboard and a verified payer list. Every naira confirmed, every payer accounted for.",
  keywords: [
    "group collections Nigeria",
    "school fees collection",
    "course rep collection",
    "payment link Nigeria",
    "cooperative dues",
    "PTA levies",
    "Jeneviv",
  ],
  applicationName: "Jeneviv",
  authors: [{ name: "Acadeva Limited" }],
  creator: "Jeneviv",
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "/",
    siteName: "Jeneviv",
    title: "Jeneviv — Group collections, finally under control",
    description:
      "One payment link. A live dashboard. A verified payer list. Built for the way Nigerian groups actually collect money.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jeneviv — Group collections, finally under control",
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
    <html lang="en">
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
