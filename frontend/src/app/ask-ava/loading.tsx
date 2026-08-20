import { ConversationHeader } from "@/components/conversation/ConversationHeader";
import { getRequestBrand } from "@/lib/request-brand";

export default async function AskAvaLoading() {
  const brand = await getRequestBrand();

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <ConversationHeader brand={brand} />
      <p className="border-b border-line bg-brand-soft px-4 py-2 text-center text-xs font-medium leading-5 text-heading md:text-sm">
        {brand.conversation.previewNotice}
      </p>
      <main className="site-shell flex-1 py-6">
        <p className="text-sm font-medium text-muted">
          {brand.conversation.loadingLabel}
        </p>
      </main>
    </div>
  );
}
