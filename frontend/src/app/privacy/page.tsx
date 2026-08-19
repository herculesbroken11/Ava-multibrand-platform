import { SimplePage } from "@/components/SimplePage";
import { getActiveBrand } from "@/lib/brand";

export default function PrivacyPage() {
  return <SimplePage brand={getActiveBrand()} title="Privacy Policy" />;
}
