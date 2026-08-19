import { SEARCH_CONTEXT_MAX_CHARS, SEARCH_SNIPPET_MAX_CHARS } from "./search-limits";
import type { SearchResult } from "./search-types";

export interface RawSearchHit {
  title?: string;
  url: string;
  snippet?: string;
  publishedAt?: string;
  retrievedAt?: string;
}

const SOURCE_ID = /^S\d+$/;

export function isBackendSourceId(value: string): boolean {
  return SOURCE_ID.test(value);
}

export function sourceIdAt(index: number): string {
  return `S${index + 1}`;
}

export function domainFromUrl(url: string): string | undefined {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function clipSnippet(text: string, max = SEARCH_SNIPPET_MAX_CHARS): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

function looksLikeDate(value: string): boolean {
  return /^\d{4}(-\d{2}(-\d{2})?)?/.test(value.trim());
}

/**
 * Assign backend-controlled S1, S2, … IDs.
 * Drop invalid URLs. Never trust caller-supplied IDs.
 */
export function normalizeSearchResults(
  hits: RawSearchHit[],
  maxResults: number,
  retrievedAt = new Date().toISOString(),
): SearchResult[] {
  const seen = new Set<string>();
  const normalized: SearchResult[] = [];

  for (const hit of hits) {
    if (normalized.length >= maxResults) break;
    const url = hit.url?.trim();
    if (!url || !isHttpUrl(url)) continue;

    const domain = domainFromUrl(url);
    if (!domain) continue;

    const key = url.replace(/\/$/, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const publishedAt =
      hit.publishedAt && looksLikeDate(hit.publishedAt) ? hit.publishedAt.trim() : undefined;

    normalized.push({
      id: sourceIdAt(normalized.length),
      title: (hit.title?.trim() || domain).slice(0, 200),
      url,
      domain,
      snippet: clipSnippet(hit.snippet ?? ""),
      publishedAt,
      retrievedAt: hit.retrievedAt ?? retrievedAt,
    });
  }

  return boundRetrievalBudget(normalized);
}

export function boundRetrievalBudget(
  results: SearchResult[],
  maxChars = SEARCH_CONTEXT_MAX_CHARS,
): SearchResult[] {
  const kept: SearchResult[] = [];
  let used = 0;

  for (const result of results) {
    const cost = result.title.length + result.snippet.length + result.url.length;
    if (kept.length > 0 && used + cost > maxChars) break;
    kept.push(result);
    used += cost;
  }

  return kept;
}
