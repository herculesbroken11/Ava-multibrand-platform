import { z } from "zod";
import {
  BRAND_IDS,
  findDuplicateHostnames,
  getSharedBrand,
  isBrandId,
  type SharedBrandRecord,
} from "@product-reviews/contracts";
import type { BackendBrand } from "./registry";
import { listBackendBrands } from "./registry";

const hostnameSchema = z
  .string()
  .trim()
  .min(1)
  .max(253)
  .regex(
    /^(?:localhost|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}|127\.0\.0\.1)$/i,
    "must be a hostname without protocol or path",
  );

const backendBrandSchema = z.object({
  id: z.enum(BRAND_IDS),
  name: z.string().trim().min(1).max(120),
  avaName: z.string().trim().min(1).max(40),
  avaRole: z.string().trim().min(1).max(200),
  domain: hostnameSchema,
  kind: z.enum(["production", "test"]),
  countryCode: z.string().trim().regex(/^[A-Z]{2}$/),
  countryName: z.string().trim().min(1).max(80),
  currency: z.string().trim().regex(/^[A-Z]{3}$/),
  timezone: z.string().trim().min(1).max(64),
  locale: z.string().trim().min(2).max(16),
  searchLocation: z.object({
    country: z.string().trim().regex(/^[A-Z]{2}$/),
    timezone: z.string().trim().min(1).optional(),
    city: z.string().trim().min(1).optional(),
    region: z.string().trim().min(1).optional(),
  }),
  marketDefaultsHeading: z.string().trim().min(1).max(80),
  publicContext: z.string().trim().min(1).max(2000),
  marketGuidance: z.array(z.string().trim().min(1)).min(1).max(12),
  brandInstructions: z.string().trim().min(1).max(4000),
  categoryContext: z.string().trim().min(1).max(400).optional(),
  featureFlags: z.record(z.boolean()).optional(),
});

export function validateBackendBrand(brand: BackendBrand): string[] {
  const issues: string[] = [];
  const parsed = backendBrandSchema.safeParse(brand);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.push(`${brand.id}.${issue.path.join(".")}: ${issue.message}`);
    }
    return issues;
  }

  const shared = getSharedBrand(brand.id);
  if (!shared) {
    issues.push(`${brand.id}: missing shared brand record`);
    return issues;
  }
  if (brand.domain !== shared.canonicalDomain) {
    issues.push(
      `${brand.id}.domain must match shared canonicalDomain (${shared.canonicalDomain})`,
    );
  }
  if (brand.kind !== shared.kind) {
    issues.push(`${brand.id}.kind must match shared kind (${shared.kind})`);
  }
  return issues;
}

export function validateBackendBrandRegistry(
  records: readonly SharedBrandRecord[] | undefined = undefined,
): string[] {
  const issues: string[] = [];
  const brands = listBackendBrands();
  const seen = new Set<string>();

  for (const brand of brands) {
    if (seen.has(brand.id)) {
      issues.push(`duplicate backend brand id: ${brand.id}`);
    }
    seen.add(brand.id);
    issues.push(...validateBackendBrand(brand));
  }

  for (const id of BRAND_IDS) {
    if (!brands.some((brand) => brand.id === id)) {
      issues.push(`missing backend brand: ${id}`);
    }
  }

  if (!isBrandId("productreviews") || !brands.some((brand) => brand.id === "productreviews")) {
    issues.push("production brand productreviews must be registered");
  }

  issues.push(
    ...findDuplicateHostnames(records).map((item) => `duplicate hostname alias: ${item}`),
  );

  return issues;
}
