"use client";

import { useState } from "react";
import type { BrandConfig } from "@/brands/types";
import { AskAvaPanel } from "@/components/AskAvaPanel";
import { SuggestedQuestionsSection } from "@/components/SuggestedQuestionsSection";

export function AskExperience({ brand }: { brand: BrandConfig }) {
  const [query, setQuery] = useState("");

  return (
    <div>
      <AskAvaPanel
        brand={brand}
        query={query}
        onQueryChange={setQuery}
      />
      <SuggestedQuestionsSection brand={brand} />
    </div>
  );
}
