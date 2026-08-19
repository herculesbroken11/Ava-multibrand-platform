import Link from "next/link";
import type { BrandConfig } from "@/brands/types";
import { ScriptText } from "@/components/ui/ScriptText";
import { ArrowRightIcon, ChatIcon } from "@/components/ui/icons";

export function AvaLearningSection({ brand }: { brand: BrandConfig }) {
  return (
    <section className="bg-footer text-on-primary">
      <div className="site-shell flex flex-col gap-6 py-8 md:gap-8 md:py-10 xl:flex-row xl:items-center xl:gap-10 xl:py-12">
        <div className="max-w-[280px] shrink-0">
          <ScriptText className="text-[clamp(1.55rem,2.6vw,2.45rem)] font-bold leading-tight tracking-tight text-white">
            {brand.learning.heading}
          </ScriptText>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center text-white/85 md:h-12 md:w-12">
            <ChatIcon className="h-7 w-7 md:h-8 md:w-8" />
          </span>
          <p className="max-w-xl text-[clamp(0.98rem,1.2vw,1.12rem)] leading-6 text-white/80">
            {brand.learning.body}
          </p>
          <Link
            href={brand.learning.ctaHref}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-[0.95rem] font-bold text-on-accent transition-opacity hover:opacity-90"
          >
            {brand.learning.cta}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
