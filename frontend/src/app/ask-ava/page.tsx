import type { Metadata } from "next";
import { ConversationView } from "@/components/conversation/ConversationView";
import { parseInitialQuestion } from "@/lib/ask-ava";
import { getRequestBrand, resolveRequestBrand } from "@/lib/request-brand";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await resolveRequestBrand();
  if (!brand) {
    return { title: "Unknown host", robots: { index: false, follow: false } };
  }

  return {
    title: `Ask ${brand.ava.name} — ${brand.name}`,
    description: brand.seo.description,
    robots: { index: false, follow: false },
    alternates: { canonical: `https://${brand.domain}/ask-ava` },
  };
}

export default async function AskAvaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const brand = await getRequestBrand();
  const params = await searchParams;
  const initialQuestion = parseInitialQuestion(params.q);

  return (
    <ConversationView brand={brand} initialQuestion={initialQuestion} />
  );
}
