import { clampQuestion } from "@/lib/ask-ava";
import type { ConversationSession } from "@/conversation/types";

const SESSION_PREFIX = "ask-ava:session:";
const PENDING_PREFIX = "ask-ava:pending:";

type Listener = () => void;

const listeners = new Set<Listener>();

function sessionKey(brandId: string): string {
  return `${SESSION_PREFIX}${brandId}`;
}

function pendingKey(brandId: string): string {
  return `${PENDING_PREFIX}${brandId}`;
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeConversationStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getConversationSnapshot(brandId: string): string | null {
  if (!canUseStorage()) return null;

  try {
    return sessionStorage.getItem(sessionKey(brandId));
  } catch {
    return null;
  }
}

export function parseConversationSession(
  raw: string | null,
): ConversationSession | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as ConversationSession;
    if (!parsed || !Array.isArray(parsed.messages) || typeof parsed.id !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function stashPendingQuestion(brandId: string, question: string): void {
  if (!canUseStorage()) return;
  const value = clampQuestion(question);
  if (!value) return;
  sessionStorage.setItem(pendingKey(brandId), value);
}

export function consumePendingQuestion(brandId: string): string | undefined {
  if (!canUseStorage()) return undefined;

  const value = sessionStorage.getItem(pendingKey(brandId));
  sessionStorage.removeItem(pendingKey(brandId));
  const question = value ? clampQuestion(value) : "";
  return question || undefined;
}

export function persistConversationSession(
  brandId: string,
  session: ConversationSession,
): void {
  if (!canUseStorage()) return;
  sessionStorage.setItem(sessionKey(brandId), JSON.stringify(session));
  notify();
}

export function clearConversationSession(brandId: string): void {
  if (!canUseStorage()) return;
  sessionStorage.removeItem(sessionKey(brandId));
  notify();
}
