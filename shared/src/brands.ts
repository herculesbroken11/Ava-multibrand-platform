export const BRAND_IDS = ["productreviews", "testbrand"] as const;

export type BrandId = (typeof BRAND_IDS)[number];

export type BrandKind = "production" | "test";

export interface SharedBrandRecord {
  id: BrandId;
  canonicalDomain: string;
  hostAliases: string[];
  kind: BrandKind;
}

export const SHARED_BRANDS: readonly SharedBrandRecord[] = [
  {
    id: "productreviews",
    canonicalDomain: "productreviews.com.au",
    hostAliases: ["www.productreviews.com.au"],
    kind: "production",
  },
  {
    id: "testbrand",
    canonicalDomain: "testbrand.local",
    hostAliases: [],
    kind: "test",
  },
];

export const DEVELOPMENT_HOSTS = ["localhost", "127.0.0.1", "::1"] as const;

export interface ResolveBrandHostOptions {
  nodeEnv: "development" | "test" | "production";
  defaultDevBrand?: string;
  allowTestBrands?: boolean;
}

export function isBrandId(value: string): value is BrandId {
  return (BRAND_IDS as readonly string[]).includes(value);
}

export function getSharedBrand(id: string): SharedBrandRecord | undefined {
  return SHARED_BRANDS.find((brand) => brand.id === id);
}

export function normalizeHostname(raw: string): string {
  let host = raw.trim().toLowerCase();
  if (!host) return "";

  if (host.startsWith("[")) {
    const closing = host.indexOf("]");
    if (closing !== -1) {
      return host.slice(1, closing);
    }
  }

  const colon = host.lastIndexOf(":");
  if (colon > -1 && /^\d+$/.test(host.slice(colon + 1))) {
    const before = host.slice(0, colon);
    const looksLikeNameOrIpv4 = before.includes(".") || !before.includes(":");
    if (looksLikeNameOrIpv4) {
      host = before;
    }
  }

  return host;
}

export function isDevelopmentHost(host: string): boolean {
  const normalized = normalizeHostname(host);
  return (DEVELOPMENT_HOSTS as readonly string[]).includes(normalized);
}

function hostsFor(record: SharedBrandRecord): string[] {
  return [record.canonicalDomain, ...record.hostAliases].map((value) =>
    normalizeHostname(value),
  );
}

export function resolveBrandByHost(
  rawHost: string | undefined,
  options: ResolveBrandHostOptions,
): SharedBrandRecord | undefined {
  const host = rawHost ? normalizeHostname(rawHost) : "";
  const allowTest =
    options.allowTestBrands !== undefined
      ? options.allowTestBrands
      : options.nodeEnv === "development" || options.nodeEnv === "test";

  const candidates = SHARED_BRANDS.filter(
    (brand) => brand.kind === "production" || allowTest,
  );

  if (host) {
    const matched = candidates.find((brand) => hostsFor(brand).includes(host));
    if (matched) return matched;
  }

  const canUseDevDefault =
    options.nodeEnv === "development" || options.nodeEnv === "test";

  if (canUseDevDefault && (!host || isDevelopmentHost(host))) {
    const fallbackId = options.defaultDevBrand?.trim() || "productreviews";
    const fallback = candidates.find((brand) => brand.id === fallbackId);
    if (fallback) return fallback;
  }

  return undefined;
}

export function selectRequestHost(input: {
  host?: string | null;
  forwardedHost?: string | null;
  trustForwardedHost: boolean;
}): string {
  if (input.trustForwardedHost) {
    const forwarded = input.forwardedHost?.split(",")[0]?.trim();
    if (forwarded) return forwarded;
  }
  return input.host?.trim() || "";
}

export function parseOriginAllowList(
  origins: string | undefined,
  fallback: string,
): string[] {
  const raw = origins?.trim() ? origins : fallback;
  const unique = new Set<string>();
  for (const part of raw.split(",")) {
    const origin = part.trim().replace(/\/$/, "");
    if (!origin) continue;
    unique.add(origin);
  }
  return [...unique];
}

export function originHostname(origin: string): string | undefined {
  try {
    return normalizeHostname(new URL(origin).host);
  } catch {
    return undefined;
  }
}

export function productionHttpsOrigins(): string[] {
  const origins: string[] = [];
  for (const brand of SHARED_BRANDS) {
    if (brand.kind !== "production") continue;
    for (const host of hostsFor(brand)) {
      origins.push(`https://${host}`);
    }
  }
  return origins;
}

export function findDuplicateHostnames(
  records: readonly SharedBrandRecord[] = SHARED_BRANDS,
): string[] {
  const seen = new Map<string, string>();
  const duplicates: string[] = [];
  for (const brand of records) {
    for (const host of hostsFor(brand)) {
      const owner = seen.get(host);
      if (owner && owner !== brand.id) {
        duplicates.push(`${host} (${owner} and ${brand.id})`);
      } else {
        seen.set(host, brand.id);
      }
    }
  }
  return duplicates;
}
