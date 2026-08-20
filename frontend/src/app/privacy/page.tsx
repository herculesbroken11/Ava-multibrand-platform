import { InformationPageView, informationPageMetadata } from "@/components/BrandContentPage";
import { getRequestBrand, resolveRequestBrand } from "@/lib/request-brand";

export async function generateMetadata() {
  const brand = await resolveRequestBrand();
  if (!brand) return { title: "Privacy Policy", robots: { index: false, follow: false } };
  return informationPageMetadata(brand.pages.privacy, brand, "/privacy");
}

export default async function PrivacyPage() {
  const brand = await getRequestBrand();
  return <InformationPageView brand={brand} page={brand.pages.privacy} />;
}
