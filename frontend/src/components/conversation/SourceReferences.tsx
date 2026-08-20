"use client";

import type { SourceReference } from "@/conversation/types";
import { trackSourceOpen } from "@/lib/analytics/events";

export function SourceReferences({
  sources,
  brandId,
  turnNumber,
}: {
  sources: SourceReference[];
  brandId?: string;
  turnNumber?: number;
}) {
  if (sources.length === 0) return null;

  return (
    <section className="mt-4 border-t border-line pt-3">
      <h3 className="text-xs font-bold tracking-wide text-muted uppercase">
        Sources
      </h3>
      <ul className="mt-2 space-y-2">
        {sources.map((source) => (
          <li key={`${source.url}-${source.title}`} className="min-w-0">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg text-sm font-semibold break-words text-heading hover:text-brand"
              onClick={() => {
                if (!brandId) return;
                trackSourceOpen({ brandId, turnNumber });
              }}
            >
              {source.title}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <p className="text-xs font-medium text-muted">
              {source.domain}
              {source.date ? ` · ${source.date}` : null}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
