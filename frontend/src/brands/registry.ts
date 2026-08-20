import { productReviewsBrand } from "./productreviews";
import { testBrand } from "./testbrand";
import type { BrandConfig } from "./types";

export const registeredFrontendBrands: BrandConfig[] = [
  productReviewsBrand,
  testBrand,
];

export const brandRegistry: Record<string, BrandConfig> = Object.fromEntries(
  registeredFrontendBrands.map((brand) => [brand.id, brand]),
);
