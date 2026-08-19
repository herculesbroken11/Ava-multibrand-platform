import { SimplePage } from "@/components/SimplePage";
import { getActiveBrand } from "@/lib/brand";

export default function TermsPage() {
  return <SimplePage brand={getActiveBrand()} title="Terms & Conditions" />;
}
