import type { StructuredBlock } from "@/conversation/types";
import { ComparisonTable } from "@/components/conversation/ComparisonTable";
import { EmphasizedText } from "@/components/conversation/EmphasizedText";
import { SourceReferences } from "@/components/conversation/SourceReferences";
import { cn } from "@/lib/cn";

function ListBlock({
  items,
  ordered = false,
}: {
  items: string[];
  ordered?: boolean;
}) {
  const List = ordered ? "ol" : "ul";

  return (
    <List
      className={cn(
        "space-y-1.5 pl-5 text-[0.98rem] leading-6 md:text-base md:leading-7",
        ordered ? "list-decimal" : "list-disc",
      )}
    >
      {items.map((item) => (
        <li key={item} className="break-words">
          <EmphasizedText text={item} />
        </li>
      ))}
    </List>
  );
}

function LabeledList({
  heading,
  items,
}: {
  heading: string;
  items: string[];
}) {
  return (
    <section className="rounded-xl bg-surface px-3.5 py-3">
      <h3 className="text-sm font-extrabold tracking-[-0.02em] text-heading">
        {heading}
      </h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-[0.95rem] leading-6">
        {items.map((item) => (
          <li key={item} className="break-words">
            <EmphasizedText text={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StructuredResponse({ blocks }: { blocks: StructuredBlock[] }) {
  return (
    <div className="mt-3 space-y-3">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        switch (block.type) {
          case "heading":
            return (
              <h3
                key={key}
                className="font-sans text-base font-extrabold tracking-[-0.03em] text-heading md:text-lg"
              >
                <EmphasizedText text={block.text} />
              </h3>
            );
          case "paragraph":
            return (
              <p key={key} className="whitespace-pre-wrap break-words">
                <EmphasizedText text={block.text} />
              </p>
            );
          case "bullets":
            return <ListBlock key={key} items={block.items} />;
          case "numbered":
            return <ListBlock key={key} items={block.items} ordered />;
          case "recommendation":
            return (
              <section
                key={key}
                className="rounded-xl border border-brand/20 bg-brand-soft px-3.5 py-3"
              >
                <h3 className="text-sm font-extrabold tracking-[-0.02em] text-brand">
                  {block.title ?? "Recommendation"}
                </h3>
                <p className="mt-1.5 break-words">
                  <EmphasizedText text={block.text} />
                </p>
              </section>
            );
          case "advantages":
            return (
              <LabeledList
                key={key}
                heading={block.heading ?? "Advantages"}
                items={block.items}
              />
            );
          case "limitations":
            return (
              <LabeledList
                key={key}
                heading={block.heading ?? "Limitations"}
                items={block.items}
              />
            );
          case "considerations":
            return (
              <LabeledList
                key={key}
                heading={block.heading ?? "Important considerations"}
                items={block.items}
              />
            );
          case "followUpPrompt":
            return (
              <p key={key} className="text-[0.95rem] leading-6 text-muted">
                <EmphasizedText text={block.text} />
              </p>
            );
          case "comparison":
            return <ComparisonTable key={key} table={block.table} />;
          case "sources":
            return <SourceReferences key={key} sources={block.sources} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
