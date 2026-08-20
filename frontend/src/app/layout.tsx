import type { Metadata } from "next";
import { Caveat, Plus_Jakarta_Sans, Source_Serif_4 } from "next/font/google";
import { AnalyticsScripts } from "@/components/AnalyticsScripts";
import { BrandStyles } from "@/components/BrandStyles";
import { resolveRequestBrand } from "@/lib/request-brand";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const brand = await resolveRequestBrand();

  if (!brand) {
    return {
      title: "Unknown host",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: brand.seo.title,
    description: brand.seo.description,
    applicationName: brand.name,
    metadataBase: new URL(`https://${brand.domain}`),
    icons: brand.favicon ? { icon: brand.favicon } : undefined,
    openGraph: {
      title: brand.seo.title,
      description: brand.seo.description,
      siteName: brand.name,
      type: "website",
      images: brand.seo.ogImage ? [{ url: brand.seo.ogImage }] : undefined,
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const brand = await resolveRequestBrand();

  if (!brand) {
    return (
      <html lang="en" className="h-full">
        <body className="flex min-h-full items-center justify-center bg-white text-slate-800">
          <p>Unknown host</p>
        </body>
      </html>
    );
  }

  return (
    <html
      lang={brand.locale ?? "en-AU"}
      data-scroll-behavior="smooth"
      className={`${plusJakarta.variable} ${caveat.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-page font-sans text-body">
        <BrandStyles brand={brand} />
        <AnalyticsScripts brand={brand} />
        {children}
      </body>
    </html>
  );
}
