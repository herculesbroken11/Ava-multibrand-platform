import type { BrandConfig } from "@/brands/types";
import { AskExperience } from "@/components/AskExperience";
import { AvaLearningSection } from "@/components/AvaLearningSection";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { IndependenceSection } from "@/components/IndependenceSection";
import { TrustPrinciples } from "@/components/TrustPrinciples";

export function LandingPage({ brand }: { brand: BrandConfig }) {
  return (
    <>
      <Header brand={brand} />
      <main>
        <HeroSection brand={brand} />
        <AskExperience brand={brand} />
        <IndependenceSection brand={brand} />
        <TrustPrinciples brand={brand} />
        <AvaLearningSection brand={brand} />
      </main>
      <Footer brand={brand} />
    </>
  );
}
