import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

import { Footer } from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Eccho Overseas - Study Abroad Fair",
  description: "Join India's leading international education fair. Meet top universities and get on-spot admissions.",
  icons: {
    icon: "/favicon.png?v=2",
    apple: "/favicon.png?v=2",
  },
  openGraph: {
    title: "Eccho Overseas - Study Abroad Fair",
    description: "Join India's leading international education fair. Meet top universities and get on-spot admissions.",
    url: "https://fair.ecchouk.co.uk",
    siteName: "Eccho Overseas",
    images: [
      {
        url: "/flyer.png?v=2",
        width: 1200,
        height: 630,
        alt: "Eccho Overseas Study Abroad Fair Flyer",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eccho Overseas - Study Abroad Fair",
    description: "Join India's leading international education fair.",
    images: ["/flyer.png?v=2"],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ colorScheme: 'light' }} className={cn(inter.variable, "antialiased scroll-smooth")}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="min-h-screen bg-[#FBFBFD] text-slate-900 flex flex-col font-sans selection:bg-primary/20 selection:text-primary overflow-x-hidden">
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
