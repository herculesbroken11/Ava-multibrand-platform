import {
  isBrandId,
  type BrandId,
  type BrandKind,
} from "@product-reviews/contracts";
import type { SearchUserLocation } from "../search/search-types";

export interface BackendBrand {
  id: BrandId;
  name: string;
  avaName: string;
  avaRole: string;
  domain: string;
  kind: BrandKind;
  countryCode: string;
  countryName: string;
  currency: string;
  timezone: string;
  locale: string;
  searchLocation: SearchUserLocation;
  marketDefaultsHeading: string;
  publicContext: string;
  marketGuidance: string[];
  brandInstructions: string;
  categoryContext?: string;
  featureFlags?: Record<string, boolean>;
}

const brands: Record<BrandId, BackendBrand> = {
  productreviews: {
    id: "productreviews",
    name: "ProductReviews.com.au",
    avaName: "Ava",
    avaRole: "Independent product research assistant",
    domain: "productreviews.com.au",
    kind: "production",
    countryCode: "AU",
    countryName: "Australia",
    currency: "AUD",
    timezone: "Australia/Sydney",
    locale: "en-AU",
    searchLocation: {
      country: "AU",
      timezone: "Australia/Sydney",
      region: "Australia",
    },
    marketDefaultsHeading: "Australian-first defaults",
    publicContext: "Help Australian consumers decide what to buy.",
    marketGuidance: [
      "Use Australian terminology, consumer context, warranties, model variants, and electrical context where relevant and reliable",
      "Mention Australian retailers only when you actually have that information",
      "Do not fabricate Australian availability, stock, or pricing",
    ],
    brandInstructions:
      "Commercial relationships must never determine recommendations. Where a commercial relationship might later earn a commission, that would be disclosed separately — it must never change what you recommend.",
  },
  testbrand: {
    id: "testbrand",
    name: "Test Brand (fixture)",
    avaName: "Ava",
    avaRole: "Test-only research assistant",
    domain: "testbrand.local",
    kind: "test",
    countryCode: "NZ",
    countryName: "New Zealand",
    currency: "NZD",
    timezone: "Pacific/Auckland",
    locale: "en-NZ",
    searchLocation: {
      country: "NZ",
      timezone: "Pacific/Auckland",
      region: "New Zealand",
    },
    marketDefaultsHeading: "New Zealand-first defaults",
    publicContext:
      "TEST FIXTURE ONLY — not a public brand. Use this configuration solely to prove hostname and market switching.",
    marketGuidance: [
      "Default to New Zealand consumer context",
      "Do not fabricate local availability, stock, or pricing",
    ],
    brandInstructions: "This is a non-production fixture brand.",
    categoryContext: "TEST FIXTURE ONLY — not a public brand. Category: fixture products.",
  },
};

export function getBackendBrand(
  id: string,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): BackendBrand | undefined {
  if (!isBrandId(id)) return undefined;
  const brand = brands[id];
  if (brand.kind === "test" && nodeEnv === "production") return undefined;
  return brand;
}

export function listBackendBrands(): BackendBrand[] {
  return Object.values(brands);
}

export function listBackendBrandIds(): BrandId[] {
  return Object.keys(brands) as BrandId[];
}
