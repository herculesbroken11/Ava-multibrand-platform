import { InformationPageView, informationPageMetadata } from "@/components/BrandContentPage";
import { getRequestBrand, resolveRequestBrand } from "@/lib/request-brand";

export async function generateMetadata() {
  const brand = await resolveRequestBrand();
  const page = brand?.pages.about;
  if (!page) return { title: "About", robots: { index: false, follow: false } };
  return informationPageMetadata(page);
}

export default async function AboutPage() {
  const brand = await getRequestBrand();
  const page = brand.pages.about ?? {
    title: "About",
    status: "placeholder" as const,
    intro: "About copy has not been supplied for this brand.",
    blocks: [],
  };
  return <InformationPageView brand={brand} page={page} />;
}
