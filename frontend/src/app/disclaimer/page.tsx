import { SimplePage } from "@/components/SimplePage";
import { getActiveBrand } from "@/lib/brand";

export default function DisclaimerPage() {
  return <SimplePage brand={getActiveBrand()} title="Disclaimer" />;
}
