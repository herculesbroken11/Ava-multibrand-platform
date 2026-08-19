import type { BrandConfig } from "@/brands/types";
import { ScriptText } from "@/components/ui/ScriptText";

function splitHeadline(headline: string) {
  const match = headline.match(/^(.*?[.!?])\s*(.*)$/);

  if (match?.[2]) {
    return { title: match[1], subtitle: match[2] };
  }

  return { title: headline, subtitle: "" };
}

export function IndependenceSection({ brand }: { brand: BrandConfig }) {
  const parsed = splitHeadline(brand.independence.headline);
  const title = brand.independence.subtitle
    ? brand.independence.headline
    : parsed.title;
  const subtitle = brand.independence.subtitle ?? parsed.subtitle;

  return (
    <section className="bg-page pt-8 pb-2 md:pt-10">
      <div className="site-shell">
        <h2 className="max-w-4xl font-sans text-[clamp(1.85rem,4.2vw,3.7rem)] font-extrabold tracking-[-0.03em] text-heading">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-2">
            <ScriptText className="text-[clamp(1.55rem,3.2vw,2.9rem)] font-bold leading-tight text-brand">
              {subtitle}
            </ScriptText>
          </p>
        ) : null}
        <div className="mt-6 grid max-w-5xl grid-cols-1 gap-5 md:mt-8 md:grid-cols-2 md:gap-x-10 md:gap-y-6 xl:gap-x-16">
          {brand.independence.paragraphs.map((paragraph) => (
            <p
              key={paragraph}
              className="max-w-[38rem] font-serif text-[clamp(1.05rem,1.65vw,1.48rem)] font-normal leading-7 text-body md:leading-8"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
