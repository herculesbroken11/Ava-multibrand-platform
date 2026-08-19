import type { BrandConfig } from "@/brands/types";
import { AvaVisual } from "@/components/AvaVisual";
import { ScriptText } from "@/components/ui/ScriptText";
import { CheckIcon } from "@/components/ui/icons";

function AvaIntro({
  text,
  role,
  name,
}: {
  text: string;
  role?: string;
  name: string;
}) {
  const index = text.indexOf(name);

  return (
    <div className="max-w-[8.5rem] text-right sm:max-w-[11rem] md:max-w-[13rem] xl:max-w-[15rem]">
      {index === -1 ? (
        <p className="font-script text-[0.95rem] font-bold leading-tight text-heading [text-shadow:0_1px_8px_rgba(255,255,255,0.95)] sm:text-[1.1rem] md:text-[1.3rem] xl:text-[1.65rem]">
          {text}
        </p>
      ) : (
        <p className="font-script text-[0.95rem] font-bold leading-tight text-heading [text-shadow:0_1px_8px_rgba(255,255,255,0.95)] sm:text-[1.1rem] md:text-[1.3rem] xl:text-[1.65rem]">
          {text.slice(0, index)}
          <span className="font-bold text-brand">{name}</span>
          {text.slice(index + name.length)}
        </p>
      )}
      {role ? (
        <p className="mt-0.5 whitespace-pre-line font-script text-[0.82rem] font-bold leading-tight text-heading [text-shadow:0_1px_8px_rgba(255,255,255,0.95)] sm:text-[0.95rem] md:text-[1.15rem] xl:text-[1.35rem]">
          {role}
        </p>
      ) : null}
    </div>
  );
}

function HeroCopy({ brand }: { brand: BrandConfig }) {
  const [prominent, ...rest] = brand.hero.trustItems;

  return (
    <div className="min-w-0">
      <h1 className="font-sans text-[1.45rem] font-extrabold leading-[1.08] tracking-[-0.045em] text-heading [text-shadow:0_1px_10px_rgba(255,255,255,0.95)] sm:text-[1.85rem] md:text-[2.55rem] xl:text-[4.25rem]">
        {brand.hero.heading}{" "}
        <ScriptText className="mx-0.5 text-[1.3rem] font-bold leading-none text-brand sm:text-[1.65rem] md:text-[2.25rem] xl:text-[3.8rem]">
          {brand.hero.headingAccent}
        </ScriptText>
        {brand.hero.headingEnd ? ` ${brand.hero.headingEnd}` : null}
      </h1>

      <ul className="mt-2 space-y-1.5 md:mt-4 md:space-y-2">
        {prominent ? (
          <li className="flex min-w-0 items-start gap-2">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 stroke-[2.6] text-brand md:mt-1 md:h-5 md:w-5 xl:h-6 xl:w-6" />
            <p className="min-w-0 text-[0.82rem] font-extrabold leading-snug text-heading [text-shadow:0_1px_8px_rgba(255,255,255,0.95)] sm:text-[0.95rem] md:text-[1.15rem] xl:text-[1.4rem]">
              {prominent}
            </p>
          </li>
        ) : null}
        {rest.map((item) => (
          <li key={item} className="flex min-w-0 items-start gap-2">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 stroke-[2.6] text-brand md:mt-1 md:h-5 md:w-5" />
            <p className="min-w-0 text-[0.78rem] font-bold leading-snug text-heading [text-shadow:0_1px_8px_rgba(255,255,255,0.95)] sm:text-[0.9rem] md:text-[1.05rem] xl:text-[1.22rem]">
              {item}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-2 max-w-[22rem] md:mt-4">
        <ScriptText
          underline
          underlineClassName="text-brand"
          className="text-[0.95rem] font-bold leading-tight text-brand [text-shadow:0_1px_8px_rgba(255,255,255,0.9)] sm:text-[1.15rem] md:text-[1.5rem] xl:text-[2rem]"
        >
          {brand.hero.handwrittenNote}
        </ScriptText>
      </p>
    </div>
  );
}

export function HeroSection({ brand }: { brand: BrandConfig }) {
  return (
    <section className="relative w-full">
      <div className="relative w-full">
        <AvaVisual brand={brand} />

        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="site-shell pt-3 md:pt-[clamp(0.75rem,2vh,1.5rem)]">
            <div className="w-full max-w-[16rem] sm:max-w-[20rem] md:max-w-[calc(48vw-12rem)] xl:max-w-[min(36rem,calc(48vw-15rem))]">
              <HeroCopy brand={brand} />
            </div>
          </div>

          <div className="absolute top-[46%] left-1/2 flex -translate-x-[calc(100%+0.4rem)] items-start gap-1 max-[360px]:left-3 max-[360px]:translate-x-0 sm:top-[30%] sm:-translate-x-[calc(100%+0.85rem)] md:top-[20%] md:-translate-x-[calc(100%+1.5rem)] xl:top-[16%] xl:-translate-x-[calc(100%+2.25rem)]">
            <AvaIntro
              text={brand.hero.avaIntro}
              role={brand.hero.avaRole}
              name={brand.ava.name}
            />
            <svg
              aria-hidden="true"
              className="mt-1.5 h-6 w-8 shrink-0 text-brand sm:h-8 sm:w-11 md:mt-2 md:h-9 md:w-14"
              viewBox="0 0 70 40"
              fill="none"
            >
              <path
                d="M8 10 C 28 8, 48 14, 62 30"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M50 24 l14 8 -12 2"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
