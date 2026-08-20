import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  BRAND_IDS,
  findDuplicateHostnames,
  getSharedBrand,
  isGa4MeasurementId,
  isGtmContainerId,
  SHARED_BRANDS,
} from "@product-reviews/contracts";
import type { BrandConfig, ContactPage, InformationPage } from "./types";

const HEX_COLOR = /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const HOSTNAME =
  /^(?:localhost|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}|127\.0\.0\.1)$/i;

const COLOR_KEYS = [
  "primary",
  "primaryHover",
  "primarySoft",
  "heading",
  "body",
  "muted",
  "background",
  "surface",
  "card",
  "accent",
  "footer",
  "onPrimary",
  "onAccent",
  "border",
] as const;

function issue(id: string, path: string, message: string): string {
  return `${id}.${path}: ${message}`;
}

function localAssetPath(src: string | undefined): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return undefined;
  if (!src.startsWith("/")) return src;
  return src.replace(/^\//, "");
}

export function resolveFrontendPublicDir(cwd = process.cwd()): string {
  const candidates = [
    resolve(cwd, "public"),
    resolve(cwd, "frontend", "public"),
    resolve(cwd, "..", "frontend", "public"),
  ];
  for (const dir of candidates) {
    if (existsSync(/* turbopackIgnore: true */ resolve(dir, "brands"))) return dir;
  }
  return candidates[0];
}

export type AssetReadinessKind = "required" | "optional" | "development";

export interface BrandAssetReadiness {
  key: string;
  src?: string;
  kind: AssetReadinessKind;
  exists: boolean;
}

export function classifyBrandAssets(
  brand: BrandConfig,
  publicDir = resolveFrontendPublicDir(),
): BrandAssetReadiness[] {
  const items: Array<{ key: string; src?: string; kind: AssetReadinessKind }> = [
    {
      key: "hero",
      src: brand.images.heroScene?.src ?? brand.images.ava.src,
      kind: brand.kind === "production" ? "required" : "development",
    },
    {
      key: "avaFallback",
      src: brand.images.heroScene ? brand.images.ava.src : undefined,
      kind: "optional",
    },
    { key: "logoImage", src: brand.logo.imageSrc, kind: "optional" },
    { key: "favicon", src: brand.favicon, kind: "optional" },
    { key: "ogImage", src: brand.seo.ogImage, kind: "optional" },
  ];

  return items
    .filter((item) => item.src)
    .map((item) => {
      const relative = localAssetPath(item.src);
      const exists = relative
        ? existsSync(/* turbopackIgnore: true */ resolve(publicDir, relative))
        : true;
      return { ...item, exists };
    });
}

function validateInformationPage(
  brandId: string,
  path: string,
  page: InformationPage | undefined,
): string[] {
  if (!page) return [issue(brandId, path, "required")];
  const issues: string[] = [];
  if (!page.title?.trim()) issues.push(issue(brandId, `${path}.title`, "required"));
  if (page.status !== "final" && page.status !== "placeholder") {
    issues.push(issue(brandId, `${path}.status`, "must be final or placeholder"));
  }
  if (page.status === "final" && !page.blocks?.length && !page.intro?.trim()) {
    issues.push(issue(brandId, path, "final pages need intro or content blocks"));
  }
  return issues;
}

function validateContactPage(brandId: string, page: ContactPage | undefined): string[] {
  if (!page) return [issue(brandId, "pages.contact", "required")];
  const issues: string[] = [];
  if (!page.title?.trim() || !page.heading?.trim()) {
    issues.push(issue(brandId, "pages.contact", "title and heading are required"));
  }
  if (page.status !== "final" && page.status !== "placeholder") {
    issues.push(issue(brandId, "pages.contact.status", "must be final or placeholder"));
  }
  if (page.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(page.email)) {
    issues.push(issue(brandId, "pages.contact.email", "must be a valid email when supplied"));
  }
  if (page.status === "final" && !page.email?.trim()) {
    issues.push(issue(brandId, "pages.contact.email", "required when contact content is final"));
  }
  return issues;
}

export function criticalLocalAssets(brand: BrandConfig): string[] {
  const assets: string[] = [];
  const hero = brand.images.heroScene?.src ?? brand.images.ava.src;
  const heroPath = localAssetPath(hero);
  if (heroPath) assets.push(heroPath);
  const logoPath = localAssetPath(brand.logo.imageSrc);
  if (logoPath) assets.push(logoPath);
  const faviconPath = localAssetPath(brand.favicon);
  if (faviconPath) assets.push(faviconPath);
  const ogPath = localAssetPath(brand.seo.ogImage);
  if (ogPath) assets.push(ogPath);
  return [...new Set(assets)];
}

export function validateFrontendBrand(
  brand: BrandConfig,
  options: { publicDir?: string; checkAssets?: boolean } = {},
): string[] {
  const issues: string[] = [];
  const checkAssets =
    options.checkAssets !== undefined
      ? options.checkAssets
      : brand.kind === "production";
  const publicDir = options.publicDir ?? resolveFrontendPublicDir();

  if (!BRAND_IDS.includes(brand.id)) {
    issues.push(issue(brand.id, "id", "must be a registered shared brand id"));
  }
  if (!brand.name?.trim()) issues.push(issue(brand.id, "name", "required"));
  if (!HOSTNAME.test(brand.domain)) {
    issues.push(issue(brand.id, "domain", "must be a hostname without protocol"));
  }

  const shared = getSharedBrand(brand.id);
  if (!shared) {
    issues.push(issue(brand.id, "id", "missing shared brand record"));
  } else {
    if (brand.domain !== shared.canonicalDomain) {
      issues.push(
        issue(
          brand.id,
          "domain",
          `must match shared canonicalDomain (${shared.canonicalDomain})`,
        ),
      );
    }
    if (brand.kind !== shared.kind) {
      issues.push(issue(brand.id, "kind", `must match shared kind (${shared.kind})`));
    }
  }

  for (const key of COLOR_KEYS) {
    const value = brand.colors[key];
    if (!HEX_COLOR.test(value)) {
      issues.push(issue(brand.id, `colors.${key}`, "must be a #RGB or #RRGGBB colour"));
    }
  }
  if (!brand.colors.questionBubbles?.length) {
    issues.push(issue(brand.id, "colors.questionBubbles", "required"));
  } else {
    brand.colors.questionBubbles.forEach((value, index) => {
      if (!HEX_COLOR.test(value)) {
        issues.push(
          issue(brand.id, `colors.questionBubbles.${index}`, "must be a hex colour"),
        );
      }
    });
  }

  if (!brand.typography.sans || !brand.typography.script) {
    issues.push(issue(brand.id, "typography", "sans and script tokens are required"));
  }
  if (!brand.logo.parts?.length) {
    issues.push(issue(brand.id, "logo.parts", "required"));
  }
  if (!brand.logo.alt?.trim()) issues.push(issue(brand.id, "logo.alt", "required"));

  if (!brand.hero.heading?.trim()) issues.push(issue(brand.id, "hero.heading", "required"));
  if (!brand.hero.headingAccent?.trim()) {
    issues.push(issue(brand.id, "hero.headingAccent", "required"));
  }
  if (!brand.images.ava?.src || !brand.images.ava.alt) {
    issues.push(issue(brand.id, "images.ava", "src and alt are required"));
  }

  if (!brand.askAva.headlinePrefix?.trim() || !brand.askAva.cta?.trim()) {
    issues.push(issue(brand.id, "askAva", "headline and CTA are required"));
  }
  if (!brand.askAva.placeholder?.trim()) {
    issues.push(issue(brand.id, "askAva.placeholder", "required"));
  }
  if (!brand.suggestedQuestions.questions?.length) {
    issues.push(issue(brand.id, "suggestedQuestions.questions", "required"));
  }
  if (!brand.independence.headline?.trim() || !brand.independence.paragraphs?.length) {
    issues.push(issue(brand.id, "independence", "headline and paragraphs are required"));
  }
  if (!brand.trustPrinciples?.length) {
    issues.push(issue(brand.id, "trustPrinciples", "required"));
  }
  if (!brand.learning.heading?.trim() || !brand.learning.ctaHref?.trim()) {
    issues.push(issue(brand.id, "learning", "heading and ctaHref are required"));
  }
  if (brand.learning.ctaDestinationStatus !== "final" && brand.learning.ctaDestinationStatus !== "pending") {
    issues.push(issue(brand.id, "learning.ctaDestinationStatus", "must be final or pending"));
  }
  if (brand.learning.ctaHref && !brand.learning.ctaHref.startsWith("/") && !/^https?:\/\//i.test(brand.learning.ctaHref)) {
    issues.push(issue(brand.id, "learning.ctaHref", "must be a site-relative path or http(s) URL"));
  }
  if (!brand.legal?.length) {
    issues.push(issue(brand.id, "legal", "at least one legal link is required"));
  } else {
    brand.legal.forEach((link, index) => {
      if (!link.href.startsWith("/")) {
        issues.push(issue(brand.id, `legal.${index}.href`, "must be a site-relative path"));
      }
    });
  }
  if (!brand.seo.title?.trim() || !brand.seo.description?.trim()) {
    issues.push(issue(brand.id, "seo", "title and description are required"));
  }
  if (!brand.ava.name?.trim() || !brand.ava.role?.trim() || !brand.ava.instructions?.trim()) {
    issues.push(issue(brand.id, "ava", "name, role, and instructions are required"));
  }
  if (!brand.footer.tagline?.trim() || !brand.footer.copyright?.trim()) {
    issues.push(issue(brand.id, "footer", "tagline and copyright are required"));
  }

  issues.push(...validateInformationPage(brand.id, "pages.privacy", brand.pages?.privacy));
  issues.push(...validateInformationPage(brand.id, "pages.terms", brand.pages?.terms));
  issues.push(...validateInformationPage(brand.id, "pages.disclaimer", brand.pages?.disclaimer));
  issues.push(...validateContactPage(brand.id, brand.pages?.contact));
  if (brand.pages?.about) {
    issues.push(...validateInformationPage(brand.id, "pages.about", brand.pages.about));
  }

  if (brand.analytics.gtmId && !isGtmContainerId(brand.analytics.gtmId)) {
    issues.push(issue(brand.id, "analytics.gtmId", "must match GTM-… when supplied"));
  }
  if (brand.analytics.gaMeasurementId && !isGa4MeasurementId(brand.analytics.gaMeasurementId)) {
    issues.push(
      issue(brand.id, "analytics.gaMeasurementId", "must match G-… when supplied"),
    );
  }

  if (checkAssets) {
    for (const asset of classifyBrandAssets(brand, publicDir)) {
      if (asset.kind === "required" && !asset.exists) {
        issues.push(
          issue(brand.id, "assets", `missing required production asset ${asset.src ?? asset.key}`),
        );
      }
    }
  }

  return issues;
}

export function validateFrontendBrandRegistry(
  brands: BrandConfig[],
  options: { publicDir?: string; checkAssets?: boolean } = {},
): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();

  for (const brand of brands) {
    if (seen.has(brand.id)) {
      issues.push(`duplicate frontend brand id: ${brand.id}`);
    }
    seen.add(brand.id);
    issues.push(...validateFrontendBrand(brand, options));
  }

  for (const id of BRAND_IDS) {
    if (!brands.some((brand) => brand.id === id)) {
      issues.push(`missing frontend brand: ${id}`);
    }
  }

  if (!brands.some((brand) => brand.id === "productreviews")) {
    issues.push("production brand productreviews must be registered");
  }

  issues.push(
    ...findDuplicateHostnames(SHARED_BRANDS).map(
      (item) => `duplicate hostname alias: ${item}`,
    ),
  );

  return issues;
}
