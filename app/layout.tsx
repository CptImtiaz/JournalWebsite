import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { getJournal } from "@/lib/journal";
import { appUrl } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const j = await getJournal();
  const title = j.seoTitle || j.name;
  return {
    metadataBase: new URL(appUrl()),
    title: { default: title, template: `%s | ${j.shortName}` },
    description: j.seoDescription || j.description || undefined,
    keywords: j.seoKeywords || undefined,
    openGraph: { type: "website", siteName: j.name, title, description: j.seoDescription || j.description || undefined },
    twitter: { card: "summary" },
    alternates: { canonical: "/", types: { "application/rss+xml": "/feed.xml" } },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const j = await getJournal();
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        {children}
        {j.googleAnalyticsId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(j.googleAnalyticsId)}`} strategy="afterInteractive" />
            <Script id="ga" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config',${JSON.stringify(j.googleAnalyticsId)});`}</Script>
          </>
        )}
      </body>
    </html>
  );
}
