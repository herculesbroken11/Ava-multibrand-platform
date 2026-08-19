"use client";

import Link from "next/link";
import type { SuggestedQuestion } from "@/brands/types";
import { stashPendingQuestion } from "@/conversation/session-storage";
import { buildAskAvaHref } from "@/lib/ask-ava";
import { trackAskAvaStart } from "@/lib/analytics/events";

export function SuggestedQuestionBubble({
  brandId,
  question,
  color,
}: {
  brandId: string;
  question: SuggestedQuestion;
  color: string;
}) {
  const href = buildAskAvaHref(question.text);

  return (
    <Link
      href={href}
      onClick={() => {
        stashPendingQuestion(brandId, question.text);
        trackAskAvaStart({ brandId, entry: "suggested_question" });
      }}
      className="group relative block w-full rounded-[24px] px-5 py-4 text-left text-white shadow-[0_8px_18px_rgba(40,32,20,0.12)] transition-transform md:rounded-[28px] md:px-6 md:py-6 motion-safe:hover:-translate-y-0.5"
      style={{ backgroundColor: color }}
    >
      <span
        aria-hidden="true"
        className="absolute bottom-5 left-0 h-3.5 w-3.5 rotate-45 rounded-[2px] md:-left-[7px]"
        style={{ backgroundColor: color }}
      />
      <span className="block min-h-11 text-[clamp(1.08rem,1.85vw,1.62rem)] font-semibold leading-snug tracking-[-0.01em] break-words">
        {question.text}
      </span>
    </Link>
  );
}
