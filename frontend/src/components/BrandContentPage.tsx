import type { ReactNode } from "react";
import type { BrandConfig, ContactPage, InformationBlock, InformationPage } from "@/brands/types";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

function PlaceholderBanner({ label }: { label: string }) {
  return (
    <aside
      role="status"
      className="mb-8 rounded-2xl border border-accent/40 bg-surface px-4 py-3 text-sm font-semibold leading-6 text-heading"
    >
      Internal placeholder — {label}. This is not published client content.
    </aside>
  );
}

function Block({ block }: { block: InformationBlock }) {
  if (block.type === "heading") {
    return (
      <h2 className="mt-8 font-sans text-xl font-extrabold tracking-[-0.03em] text-heading md:text-2xl">
        {block.text}
      </h2>
    );
  }

  if (block.type === "bullets") {
    return (
      <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-7 text-body">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  return <p className="mt-4 text-base leading-7 text-body">{block.text}</p>;
}

function PageShell({
  brand,
  title,
  placeholder,
  children,
}: {
  brand: BrandConfig;
  title: string;
  placeholder?: string;
  children: ReactNode;
}) {
  return (
    <>
      <Header brand={brand} />
      <main className="flex-1 bg-page">
        <article className="site-shell max-w-3xl py-16 md:py-20">
          {placeholder ? <PlaceholderBanner label={placeholder} /> : null}
          <h1 className="font-sans text-[clamp(1.8rem,4vw,2.5rem)] font-extrabold tracking-[-0.03em] text-heading">
            {title}
          </h1>
          {children}
        </article>
      </main>
      <Footer brand={brand} />
    </>
  );
}

export function InformationPageView({
  brand,
  page,
}: {
  brand: BrandConfig;
  page: InformationPage;
}) {
  return (
    <PageShell
      brand={brand}
      title={page.title}
      placeholder={page.status === "placeholder" ? page.title : undefined}
    >
      {page.lastUpdated ? (
        <p className="mt-3 text-sm font-medium text-muted">Last updated {page.lastUpdated}</p>
      ) : null}
      {page.intro ? <p className="mt-6 text-base leading-7 text-body">{page.intro}</p> : null}
      {page.blocks.map((block, index) => (
        <Block key={`${block.type}-${index}`} block={block} />
      ))}
    </PageShell>
  );
}

export function ContactPageView({
  brand,
  page,
}: {
  brand: BrandConfig;
  page: ContactPage;
}) {
  return (
    <PageShell
      brand={brand}
      title={page.heading}
      placeholder={page.status === "placeholder" ? "Contact details" : undefined}
    >
      {page.lastUpdated ? (
        <p className="mt-3 text-sm font-medium text-muted">Last updated {page.lastUpdated}</p>
      ) : null}
      {page.intro ? <p className="mt-6 text-base leading-7 text-body">{page.intro}</p> : null}
      {page.businessName ? (
        <p className="mt-6 text-base font-semibold text-heading">{page.businessName}</p>
      ) : null}
      {page.email ? (
        <p className="mt-4 text-base leading-7 text-body">
          Email{" "}
          <a className="font-semibold text-brand underline-offset-2 hover:underline" href={`mailto:${page.email}`}>
            {page.email}
          </a>
        </p>
      ) : (
        <p className="mt-4 text-base leading-7 text-muted">
          A public contact email has not been supplied yet.
        </p>
      )}
      {page.instructions ? (
        <p className="mt-4 text-base leading-7 text-body">{page.instructions}</p>
      ) : null}
    </PageShell>
  );
}

export function informationPageMetadata(
  page: InformationPage | ContactPage,
  brand?: BrandConfig,
  path?: string,
) {
  return {
    title: page.title,
    robots:
      page.status === "final"
        ? undefined
        : { index: false as const, follow: false as const },
    alternates:
      brand && path ? { canonical: `https://${brand.domain}${path}` } : undefined,
  };
}
