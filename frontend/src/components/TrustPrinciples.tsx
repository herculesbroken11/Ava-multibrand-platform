import type { BrandConfig } from "@/brands/types";
import { TrustIcon } from "@/components/ui/icons";

export function TrustPrinciples({ brand }: { brand: BrandConfig }) {
  return (
    <section className="bg-page py-10 md:py-14 xl:py-16">
      <div className="site-shell">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10 xl:grid-cols-4 xl:gap-12">
          {brand.trustPrinciples.map((principle) => (
            <div key={principle.id}>
              <span className="flex h-14 w-14 items-center justify-center text-brand md:h-20 md:w-20 xl:h-28 xl:w-28">
                <TrustIcon
                  id={principle.icon}
                  className="h-12 w-12 md:h-16 md:w-16 xl:h-24 xl:w-24"
                />
              </span>
              <h3 className="mt-3 font-sans text-[clamp(1.2rem,2.2vw,1.95rem)] font-extrabold tracking-[-0.03em] text-heading md:mt-5">
                {principle.title}
              </h3>
              <p className="mt-2 max-w-[280px] text-[clamp(1rem,1.45vw,1.32rem)] font-medium leading-snug text-muted">
                {principle.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
