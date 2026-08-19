import type { BrandConfig } from "@/brands/types";
import { SuggestedQuestionBubble } from "@/components/SuggestedQuestionBubble";
import { ScriptText } from "@/components/ui/ScriptText";

export function SuggestedQuestionsSection({
  brand,
}: {
  brand: BrandConfig;
}) {
  const colors = brand.colors.questionBubbles;

  return (
    <section className="bg-page pt-10 pb-4 md:pt-14">
      <div className="site-shell">
        <div className="mb-6 flex items-end gap-3 md:mb-8">
          <div>
            <h2 className="font-sans text-[clamp(1.7rem,3.2vw,2.75rem)] font-extrabold tracking-[-0.03em] text-heading">
              {brand.suggestedQuestions.heading}
            </h2>
            <p className="mt-1.5 text-[clamp(1.05rem,1.7vw,1.5rem)] font-medium text-muted">
              {brand.suggestedQuestions.subheading}
            </p>
          </div>
          <svg
            aria-hidden="true"
            className="mb-1 hidden h-10 w-10 text-brand sm:block md:h-12 md:w-12"
            viewBox="0 0 40 40"
            fill="none"
          >
            <path
              d="M8 8 C 12 22, 22 28, 32 30"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
            <path
              d="M25 24 l8 6 -9 2"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-8 md:gap-y-5">
          {brand.suggestedQuestions.questions.map((question, index) => (
            <SuggestedQuestionBubble
              key={question.id}
              brandId={brand.id}
              question={question}
              color={colors[index % colors.length]}
            />
          ))}
        </div>

        {brand.suggestedQuestions.footerNote ? (
          <p className="mt-6 text-left md:mt-8 md:text-right">
            <ScriptText className="text-[clamp(1.4rem,2.6vw,2.35rem)] font-bold text-brand">
              {brand.suggestedQuestions.footerNote}
            </ScriptText>
            <svg
              aria-hidden="true"
              className="ml-2 inline-block h-8 w-10 -translate-y-1 text-brand md:h-10 md:w-12"
              viewBox="0 0 40 32"
              fill="none"
            >
              <path
                d="M32 24 C 24 24, 18 16, 18 8"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
              <path
                d="M12 12 l6 -6 3 8"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </p>
        ) : null}
      </div>
    </section>
  );
}
