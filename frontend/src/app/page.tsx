import { LandingPage } from "@/components/LandingPage";
import { getRequestBrand } from "@/lib/request-brand";

export default async function HomePage() {
  const brand = await getRequestBrand();
  return <LandingPage brand={brand} />;
}
