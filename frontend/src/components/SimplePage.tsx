import type { BrandConfig } from "@/brands/types";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export function SimplePage({
  brand,
  title,
}: {
  brand: BrandConfig;
  title: string;
}) {
  return (
    <>
      <Header brand={brand} />
      <main className="flex-1 bg-page">
        <div className="site-shell py-20">
          <h1 className="font-sans text-[clamp(1.8rem,4vw,2.5rem)] font-extrabold tracking-[-0.03em] text-heading">
            {title}
          </h1>
        </div>
      </main>
      <Footer brand={brand} />
    </>
  );
}
