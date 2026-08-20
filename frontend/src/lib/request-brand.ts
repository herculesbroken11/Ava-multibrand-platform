import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { BrandConfig } from "@/brands/types";
import { registeredFrontendBrands } from "@/brands/registry";
import {
  resolveFrontendPublicDir,
  validateFrontendBrandRegistry,
} from "@/brands/schema";
import {
  resolveBrandFromRequestHeaders,
  trustForwardedHostEnabled,
} from "@/lib/brand";

let validated = false;

export function assertFrontendBrandsValid(): void {
  if (validated) return;
  const issues = validateFrontendBrandRegistry(registeredFrontendBrands, {
    publicDir: resolveFrontendPublicDir(),
    checkAssets: false,
  });
  if (issues.length > 0) {
    throw new Error(`Invalid brand configuration:\n${issues.join("\n")}`);
  }
  validated = true;
}

export async function resolveRequestBrand(): Promise<BrandConfig | undefined> {
  assertFrontendBrandsValid();
  const headerStore = await headers();
  return resolveBrandFromRequestHeaders({
    host: headerStore.get("host"),
    forwardedHost: headerStore.get("x-forwarded-host"),
    trustForwardedHost: trustForwardedHostEnabled(),
  });
}

export async function getRequestBrand(): Promise<BrandConfig> {
  const brand = await resolveRequestBrand();
  if (!brand) notFound();
  return brand;
}
