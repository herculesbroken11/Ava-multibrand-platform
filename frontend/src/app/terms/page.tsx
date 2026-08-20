import { InformationPageView, informationPageMetadata } from "@/components/BrandContentPage";
import { getRequestBrand, resolveRequestBrand } from "@/lib/request-brand";

export async function generateMetadata() {
  const brand = await resolveRequestBrand();
  if (!brand) return { title: "Terms & Conditions", robots: { index: false, follow: false } };
  return informationPageMetadata(brand.pages.terms);
}

export default async function TermsPage() {
  const brand = await getRequestBrand();
  return <InformationPageView brand={brand} page={brand.pages.terms} />;
}
