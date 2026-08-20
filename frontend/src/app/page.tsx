import { LandingPage } from "@/components/LandingPage";
import { getRequestBrand, resolveRequestBrand } from "@/lib/request-brand";

export async function generateMetadata() {
  const brand = await resolveRequestBrand();
  if (!brand) {
    return { title: "Unknown host", robots: { index: false as const, follow: false as const } };
  }

  const url = `https://${brand.domain}`;
  return {
    title: brand.seo.title,
    description: brand.seo.description,
    alternates: { canonical: url },
    openGraph: { url },
  };
}

export default async function HomePage() {
  const brand = await getRequestBrand();
  return <LandingPage brand={brand} />;
}
