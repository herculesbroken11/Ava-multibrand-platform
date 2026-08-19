import type { Metadata } from "next";
import { ConversationView } from "@/components/conversation/ConversationView";
import { parseInitialQuestion } from "@/lib/ask-ava";
import { getActiveBrand } from "@/lib/brand";

export function generateMetadata(): Metadata {
  const brand = getActiveBrand();

  return {
    title: `Ask ${brand.ava.name} — ${brand.name}`,
    description: brand.seo.description,
  };
}

export default async function AskAvaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const brand = getActiveBrand();
  const params = await searchParams;
  const initialQuestion = parseInitialQuestion(params.q);

  return (
    <ConversationView brand={brand} initialQuestion={initialQuestion} />
  );
}
