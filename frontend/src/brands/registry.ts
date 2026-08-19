import { productReviewsBrand } from "@/brands/productreviews";
import type { BrandConfig } from "@/brands/types";

export const brandRegistry: Record<string, BrandConfig> = {
  [productReviewsBrand.id]: productReviewsBrand,
};
