import { InformationPageView, informationPageMetadata } from "@/components/BrandContentPage";
import { getRequestBrand, resolveRequestBrand } from "@/lib/request-brand";

export async function generateMetadata() {
  const brand = await resolveRequestBrand();
  if (!brand) return { title: "Disclaimer", robots: { index: false, follow: false } };
  return informationPageMetadata(brand.pages.disclaimer, brand, "/disclaimer");
}

export default async function DisclaimerPage() {
  const brand = await getRequestBrand();
  return <InformationPageView brand={brand} page={brand.pages.disclaimer} />;
}
