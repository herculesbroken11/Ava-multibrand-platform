import { ContactPageView, informationPageMetadata } from "@/components/BrandContentPage";
import { getRequestBrand, resolveRequestBrand } from "@/lib/request-brand";

export async function generateMetadata() {
  const brand = await resolveRequestBrand();
  if (!brand) return { title: "Contact", robots: { index: false, follow: false } };
  return informationPageMetadata(brand.pages.contact);
}

export default async function ContactPage() {
  const brand = await getRequestBrand();
  return <ContactPageView brand={brand} page={brand.pages.contact} />;
}
