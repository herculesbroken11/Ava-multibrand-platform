import type { ConversationMessage } from "@product-reviews/contracts";
import type { BackendBrand } from "../brands/registry";
import { SEARCH_QUERY_MAX_CHARS } from "./search-limits";
import type { SearchDecision, SearchIntent } from "./search-types";

function latestUserText(messages: ConversationMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "user" && message.content.trim()) {
      return message.content.trim();
    }
  }
  return "";
}

function clip(text: string, max: number): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return cleaned.slice(0, max - 1).trimEnd();
}

function extractBudget(text: string): string | undefined {
  const aud = text.match(/\bAUD\s*\$?\s*(\d[\d,]*)\b/i);
  if (aud?.[1]) return `AUD ${aud[1].replace(/,/g, "")}`;
  const dollars = text.match(/\$\s*(\d[\d,]*)/);
  if (dollars?.[1]) return `AUD ${dollars[1].replace(/,/g, "")}`;
  const under = text.match(/\bunder\s+\$?\s*(\d[\d,]*)\b/i);
  if (under?.[1]) return `under AUD ${under[1].replace(/,/g, "")}`;
  return undefined;
}

function extractPets(text: string): string | undefined {
  if (/\bdogs?\b/i.test(text)) return "pet hair dogs";
  if (/\bcats?\b/i.test(text)) return "pet hair cats";
  if (/\bpet(?:s| hair)?\b/i.test(text)) return "pet hair";
  return undefined;
}

function extractTopic(text: string): string | undefined {
  const named = text.match(
    /\b(dyson(?:\s+\w+)?|samsung(?:\s+\w+)?|lg(?:\s+\w+)?|bosch(?:\s+\w+)?|miele(?:\s+\w+)?|irobot(?:\s+\w+)?|roomba(?:\s+\w+)?|roborock(?:\s+\w+)?|ecovacs(?:\s+\w+)?|dreame(?:\s+\w+)?)\b/i,
  );
  if (named?.[1]) return named[1];

  const category = text.match(
    /\b((?:robot |stick |cordless )?(?:vacuum|dishwasher|washing machine|fridge|air(?: |-)purifier|heater|fan|tv|television|laptop|phone)s?)\b/i,
  );
  if (category?.[1]) return category[1].toLowerCase();

  const thisModel = text.match(/\bthis (?:model|product|one)\b/i);
  if (thisModel) return "this product";

  return undefined;
}

function intentHint(intent: SearchIntent): string {
  switch (intent) {
    case "current_price":
      return "current price";
    case "availability":
      return "current stock availability retailers";
    case "new_release":
      return "newest current models";
    case "current_specification":
      return "current official specifications warranty";
    case "recall_or_safety":
      return "product recall official safety notice";
    case "promotion":
      return "current sale promotion";
    case "current_product_recommendation":
      return "current models";
    case "other_current_information":
      return "current information";
    default:
      return "";
  }
}

export function buildSearchQuery(args: {
  messages: ConversationMessage[];
  brand: BackendBrand;
  decision: SearchDecision;
}): string {
  const allUserText = args.messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .join(" ");
  const latest = latestUserText(args.messages);

  const parts: string[] = [args.decision.locationLabel];

  const topic = extractTopic(`${latest} ${allUserText}`);
  if (topic) parts.push(topic);

  const budget = extractBudget(allUserText);
  if (budget) parts.push(budget);

  const pets = extractPets(allUserText);
  if (pets) parts.push(pets);

  const hint = intentHint(args.decision.intent);
  if (hint) parts.push(hint);

  if (args.decision.intent === "recall_or_safety") {
    parts.push("official government manufacturer");
  }

  const query = clip(parts.filter(Boolean).join(" "), SEARCH_QUERY_MAX_CHARS);
  return query || clip(latest, SEARCH_QUERY_MAX_CHARS);
}
