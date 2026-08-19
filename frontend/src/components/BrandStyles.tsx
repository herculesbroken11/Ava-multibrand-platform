import type { CSSProperties } from "react";
import type { BrandConfig } from "@/brands/types";
import { brandCssVars } from "@/lib/brand";

export function BrandStyles({ brand }: { brand: BrandConfig }) {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root { ${Object.entries(brandCssVars(brand))
          .map(([key, value]) => `${key}: ${value};`)
          .join(" ")} }`,
      }}
    />
  );
}

export function brandStyleObject(brand: BrandConfig): CSSProperties {
  return brandCssVars(brand) as CSSProperties;
}
