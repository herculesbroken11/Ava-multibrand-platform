import { MAX_MESSAGE_LENGTH } from "@product-reviews/contracts";

export const ASK_AVA_PATH = "/ask-ava" as const;
export const ASK_AVA_QUERY_PARAM = "q";
export const MAX_QUESTION_LENGTH = MAX_MESSAGE_LENGTH;

export function clampQuestion(value: string): string {
  return value.trim().slice(0, MAX_QUESTION_LENGTH);
}

export function parseInitialQuestion(
  value: string | string[] | undefined,
): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  const question = clampQuestion(raw);
  return question || undefined;
}

export function buildAskAvaHref(question: string): string {
  const params = new URLSearchParams();
  params.set(ASK_AVA_QUERY_PARAM, clampQuestion(question));
  return `${ASK_AVA_PATH}?${params.toString()}`;
}

export function stripAskAvaQuestionParam(): void {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  if (!url.searchParams.has(ASK_AVA_QUERY_PARAM)) return;

  url.searchParams.delete(ASK_AVA_QUERY_PARAM);
  const search = url.searchParams.toString();
  const next = search ? `${url.pathname}?${search}${url.hash}` : `${url.pathname}${url.hash}`;
  window.history.replaceState(window.history.state, "", next);
}
