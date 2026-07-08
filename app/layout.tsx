import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const SITE_URL = "https://realpfp.vercel.app";
const TITLE = "Profile pictures that look like real people";
const DESCRIPTION =
  "Generate realistic, diverse AI profile photos with nano-banana-2 — bring your own fal.ai key. Private by design: your key never leaves your browser.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Realistic Profile Picture Generator",
  keywords: [
    "AI profile picture",
    "realistic AI headshots",
    "AI portrait generator",
    "profile photo generator",
    "nano-banana-2",
    "fal.ai",
  ],
  alternates: { canonical: SITE_URL },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Realistic Profile Picture Generator",
    locale: "en_GB",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Realistic AI profile pictures",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@james_frewin",
    creator: "@james_frewin",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

// JSON-LD structured data — helps search engines understand the app and
// gives crawlable authorship backlinks (jamesfrewin.com + octoberwip.com).
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "RealPFP",
  url: SITE_URL,
  description: DESCRIPTION,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: {
    "@type": "Person",
    name: "James Frewin",
    url: "https://jamesfrewin.com",
  },
  creator: {
    "@type": "Organization",
    name: "OCTOBER",
    url: "https://octoberwip.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen bg-background antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        {children}
        <Toaster position="top-center" richColors />
        <Analytics />
      </body>
    </html>
  );
}
