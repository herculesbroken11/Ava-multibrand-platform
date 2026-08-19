import type { Metadata } from "next";
import { Caveat, Plus_Jakarta_Sans, Source_Serif_4 } from "next/font/google";
import { BrandStyles } from "@/components/BrandStyles";
import { getActiveBrand } from "@/lib/brand";
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

export function generateMetadata(): Metadata {
  const brand = getActiveBrand();

  return {
    title: brand.seo.title,
    description: brand.seo.description,
    applicationName: brand.name,
    openGraph: {
      title: brand.seo.title,
      description: brand.seo.description,
      siteName: brand.name,
      type: "website",
    },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  const brand = getActiveBrand();

  return (
    <html
      lang="en-AU"
      className={`${plusJakarta.variable} ${caveat.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-page font-sans text-body">
        <BrandStyles brand={brand} />
        {children}
      </body>
    </html>
  );
}
