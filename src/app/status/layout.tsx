import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eccho Passport - Live Status Portal",
  description: "Check your live waiting status and room assignments for the Eccho Overseas Study Abroad Fair.",
  openGraph: {
    title: "Eccho Passport - Live Status Portal",
    description: "Check your live waiting status and room assignments.",
    images: [{
      url: "/flyer.png?v=2",
      width: 1200,
      height: 630,
      alt: "Eccho Overseas Study Abroad Fair Status Portal",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eccho Passport - Live Status Portal",
    description: "Check your live waiting status.",
    images: ["/flyer.png?v=2"],
  },
};

export default function StatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
