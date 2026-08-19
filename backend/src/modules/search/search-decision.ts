import type { ConversationMessage } from "@product-reviews/contracts";
import type { BackendBrand } from "../brands/registry";
import type { SearchDecision, SearchIntent, SearchUserLocation } from "./search-types";

const RECALL = /\b(recall(?:ed|s)?|safety notice|product safety warning)\b/i;
const PRICE = /\b(how much|price(?:s|d|ing)?|cost(?:s|ing)?|what(?:'s| is) it worth)\b/i;
const AVAIL_STRONG = /\b(in stock|out of stock|availability|stock(?:ed)?)\b/i;
const AVAILABLE = /\bavailable\b/i;
const PROMO = /\b(sale|discount|promotion|promo|deal|special offer|on offer)\b/i;
const NEW_RELEASE = /\b(newly released|newest model|latest model|just released|new model|just launched|just out)\b/i;
const CURRENT_SPEC = /\b(current (?:spec(?:s|ification)?s?|warranty)|has the (?:spec(?:s|ification)?s?|warranty) changed|updated spec(?:s|ification)?s?)\b/i;
const FRESHNESS = /\b(current|currently|today|right now|latest|recently|this week|now)\b/i;
const RECOMMEND = /\b(recommend|which (?:one|should|would)|what would you (?:recommend|buy|get)|which would you|what should i (?:buy|get))\b/i;
const BEST_OF = /\bwhat(?:'s| is) the best\b/i;
const BUDGET = /\$\s?\d|\baud\b|\bbudget\b|\bunder \$?\d+/i;
const PETS = /\b(pets?|dogs?|cats?|pet hair)\b/i;
const SIZE = /\b(\d+\s?(m2|m²|sqm|square metres?)|apartment|house size|small home|large home)\b/i;
const NAMED_PRODUCT =
  /\b(dyson|samsung|lg|bosch|miele|irobot|roomba|roborock|ecovacs|dreame|this model|this product|the \w+ model)\b/i;
const HISTORICAL = /\b(generally known|used to be known|was (?:this|it) known|historically)\b/i;

const LOCATION_OVERRIDES: Array<{
  pattern: RegExp;
  location: SearchUserLocation;
  label: string;
}> = [
  {
    pattern: /\b(new zealand|i(?:'m| am) in nz|\bin nz\b|we(?:'re| are) in nz)\b/i,
    location: { country: "NZ", timezone: "Pacific/Auckland", region: "New Zealand" },
    label: "New Zealand",
  },
  {
    pattern: /\b(united kingdom|\bin the uk\b|i(?:'m| am) in (?:the )?uk|britain)\b/i,
    location: { country: "GB", timezone: "Europe/London", region: "United Kingdom" },
    label: "United Kingdom",
  },
  {
    pattern: /\b(united states|\bin the usa\b|i(?:'m| am) in (?:the )?(?:us|usa|united states))\b/i,
    location: { country: "US", timezone: "America/New_York", region: "United States" },
    label: "United States",
  },
];

const AUSTRALIA: SearchUserLocation = {
  country: "AU",
  timezone: "Australia/Sydney",
  region: "Australia",
};

function userTexts(messages: ConversationMessage[]): string {
  return messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .join("\n");
}

function latestUserText(messages: ConversationMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "user" && message.content.trim()) {
      return message.content;
    }
  }
  return "";
}

export function conversationHasRequirements(text: string): boolean {
  return BUDGET.test(text) || PETS.test(text) || SIZE.test(text);
}

export function conversationHasNamedProduct(text: string): boolean {
  return NAMED_PRODUCT.test(text);
}

function isBroadUndiagnosedRecommend(latest: string, allUserText: string): boolean {
  const askingBestOrRecommend = BEST_OF.test(latest) || RECOMMEND.test(latest);
  if (!askingBestOrRecommend) return false;
  return !conversationHasRequirements(allUserText) && !conversationHasNamedProduct(latest);
}

function resolveLocation(
  allUserText: string,
  brand: BackendBrand,
): { location: SearchUserLocation; label: string } {
  for (const override of LOCATION_OVERRIDES) {
    if (override.pattern.test(allUserText)) {
      return { location: override.location, label: override.label };
    }
  }

  if (brand.market === "AU") {
    return { location: AUSTRALIA, label: "Australia" };
  }

  return { location: AUSTRALIA, label: "Australia" };
}

function classifyIntent(latest: string, allUserText: string): SearchIntent {
  if (RECALL.test(latest)) return "recall_or_safety";
  if (PRICE.test(latest)) return "current_price";
  if (AVAIL_STRONG.test(latest) || (AVAILABLE.test(latest) && FRESHNESS.test(latest))) {
    return "availability";
  }
  if (PROMO.test(latest)) return "promotion";
  if (NEW_RELEASE.test(latest)) return "new_release";
  if (CURRENT_SPEC.test(latest)) return "current_specification";

  if (isBroadUndiagnosedRecommend(latest, allUserText)) {
    return "none";
  }

  if (HISTORICAL.test(latest) && !FRESHNESS.test(latest) && !PRICE.test(latest)) {
    return "none";
  }

  if (FRESHNESS.test(latest) && conversationHasNamedProduct(latest)) {
    return "other_current_information";
  }

  if (FRESHNESS.test(latest) && !isBroadUndiagnosedRecommend(latest, allUserText)) {
    if (BEST_OF.test(latest) || RECOMMEND.test(latest)) {
      if (conversationHasRequirements(allUserText) || conversationHasNamedProduct(allUserText)) {
        return "current_product_recommendation";
      }
      return "none";
    }
    return "other_current_information";
  }

  if (
    (RECOMMEND.test(latest) || BEST_OF.test(latest)) &&
    (conversationHasRequirements(allUserText) || conversationHasNamedProduct(allUserText))
  ) {
    return "current_product_recommendation";
  }

  return "none";
}

function isEssential(intent: SearchIntent): boolean {
  return (
    intent === "current_price" ||
    intent === "availability" ||
    intent === "recall_or_safety" ||
    intent === "promotion"
  );
}

export function decideSearch(
  messages: ConversationMessage[],
  brand: BackendBrand,
): SearchDecision {
  const latest = latestUserText(messages);
  const allUserText = userTexts(messages);
  const { location, label } = resolveLocation(allUserText, brand);
  const intent = classifyIntent(latest, allUserText);

  return {
    intent,
    shouldSearch: intent !== "none",
    essential: isEssential(intent),
    location,
    locationLabel: label,
  };
}
