import { LandingPage } from "@/components/LandingPage";
import { getActiveBrand } from "@/lib/brand";

export default function HomePage() {
  const brand = getActiveBrand();
  return <LandingPage brand={brand} />;
}
