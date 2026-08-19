import { SimplePage } from "@/components/SimplePage";
import { getActiveBrand } from "@/lib/brand";

export default function AboutPage() {
  return <SimplePage brand={getActiveBrand()} title="About" />;
}
