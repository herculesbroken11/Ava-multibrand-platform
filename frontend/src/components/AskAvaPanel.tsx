"use client";

import Form from "next/form";
import { useRouter } from "next/navigation";
import type { BrandConfig } from "@/brands/types";
import { stashPendingQuestion } from "@/conversation/session-storage";
import { ScriptText } from "@/components/ui/ScriptText";
import { ArrowUpIcon } from "@/components/ui/icons";
import { trackAskAvaStart } from "@/lib/analytics/events";
import {
  ASK_AVA_PATH,
  ASK_AVA_QUERY_PARAM,
  MAX_QUESTION_LENGTH,
  buildAskAvaHref,
  clampQuestion,
} from "@/lib/ask-ava";

export function AskAvaPanel({
  brand,
  query,
  onQueryChange,
  inputId = "ask-ava-input",
}: {
  brand: BrandConfig;
  query: string;
  onQueryChange: (value: string) => void;
  inputId?: string;
}) {
  const router = useRouter();
  const canSubmit = clampQuestion(query).length > 0;

  function goToConversation(question: string) {
    const next = clampQuestion(question);
    if (!next) return;
    stashPendingQuestion(brand.id, next);
    trackAskAvaStart({ brandId: brand.id, entry: "composer" });
    router.push(buildAskAvaHref(next));
  }

  return (
    <section
      id="ask-ava"
      className="relative z-20 mt-5 -mb-1 md:-mt-[clamp(2.5rem,8vh,4.5rem)] xl:-mt-[clamp(3.75rem,12vh,6.75rem)]"
    >
      <div className="site-shell">
        <div className="rounded-[24px] bg-[#adadadf5] px-4 py-6 shadow-[0_18px_44px_rgba(40,32,20,0.12)] md:rounded-[32px] md:px-8 md:py-7 xl:px-10 xl:py-8">
          <h2 className="flex flex-wrap items-end justify-center gap-x-[0.28em] gap-y-2 text-center font-normal leading-none tracking-normal">
            <ScriptText className="text-[clamp(1.85rem,7.2vw,5.9rem)] font-normal text-white [text-shadow:0_1px_10px_rgba(0,0,0,0.28)]">
              {brand.askAva.headlinePrefix}
            </ScriptText>
            <span
              className="relative mb-[0.08em] inline-block origin-bottom -rotate-[2.5deg] font-sans text-[clamp(1.45rem,5.2vw,3.6rem)] font-extrabold uppercase not-italic leading-none tracking-[0.08em] text-brand"
              style={{
                fontFamily:
                  "var(--font-plus-jakarta), ui-sans-serif, system-ui, sans-serif",
              }}
            >
              {brand.askAva.headlineAccent}
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-[0.22em] left-0 h-[0.28em] w-full text-accent"
                viewBox="0 0 120 10"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 7 C 22 2, 48 9, 70 5 C 88 2, 104 8, 118 4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h2>

          <div className="mx-auto mt-5 max-w-3xl md:mt-7">
            <Form
              action={ASK_AVA_PATH}
              onSubmit={(event) => {
                const next = clampQuestion(query);
                if (!next) {
                  event.preventDefault();
                  return;
                }
                stashPendingQuestion(brand.id, next);
                event.preventDefault();
                goToConversation(next);
              }}
            >
              <label htmlFor={inputId} className="sr-only">
                {brand.askAva.placeholder}
              </label>
              <div className="flex items-center rounded-full bg-white p-1.5">
                <input
                  id={inputId}
                  name={ASK_AVA_QUERY_PARAM}
                  type="text"
                  value={query}
                  maxLength={MAX_QUESTION_LENGTH}
                  required
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder={brand.askAva.placeholder}
                  className="min-h-11 min-w-0 flex-1 bg-transparent px-4 py-2.5 text-[clamp(0.98rem,1.25vw,1.18rem)] font-medium text-heading outline-none placeholder:font-medium placeholder:text-muted md:px-6 md:py-3"
                  autoComplete="off"
                  enterKeyHint="send"
                />
                <button
                  type="submit"
                  disabled={!canSubmit}
                  aria-label={brand.askAva.cta}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-on-primary transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50 md:h-12 md:w-12"
                >
                  <ArrowUpIcon className="h-5 w-5" />
                </button>
              </div>
            </Form>

            <p className="mt-3 flex items-center gap-2.5 text-[clamp(1rem,1.4vw,1.32rem)] font-medium text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.25)] md:mt-4">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand md:h-3 md:w-3"
                aria-hidden="true"
              />
              {brand.askAva.statusText}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
