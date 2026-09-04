import type { Metadata, Viewport } from "next";
import {
  Anton,
  Barlow,
  Barlow_Condensed,
  Kaushan_Script,
} from "next/font/google";
import { EVENT, getAppUrl } from "@/lib/config";
import "./globals.css";

const display = Anton({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const script = Kaushan_Script({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
});

const label = Barlow_Condensed({
  variable: "--font-label",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Barlow({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

function resolveMetadataBase(): URL {
  return new URL(getAppUrl());
}

const siteDescription = `${EVENT.name} — ${EVENT.dateLabel} at ${EVENT.locationLabel}. Register your team.`;

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: EVENT.name,
  description: siteDescription,
  applicationName: "Official-ish",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "Official-ish",
    statusBarStyle: "black-translucent",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  openGraph: {
    title: EVENT.brandNav,
    description: siteDescription,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: EVENT.brandNav,
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  themeColor: "#16354f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${script.variable} ${label.variable} ${body.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
