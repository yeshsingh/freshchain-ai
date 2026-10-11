import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "@/components/providers";
import "./globals.css";

const site = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: "FreshChain AI — Stop food waste before it happens",
    template: "%s · FreshChain AI",
  },
  description:
    "An autonomous multi-agent control tower for perishable inventory. FreshChain fuses IoT sensors, visual decay analysis and local demand to predict true shelf life — then reprices, reroutes and offloads stock before it spoils.",
  openGraph: {
    title: "FreshChain AI",
    description: "Autonomous perishable-inventory control tower: see, understand, decide, act, measure.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f7f6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
