import { SimplePage } from "@/components/SimplePage";
import { getActiveBrand } from "@/lib/brand";

export default function ContactPage() {
  return <SimplePage brand={getActiveBrand()} title="Contact" />;
}
