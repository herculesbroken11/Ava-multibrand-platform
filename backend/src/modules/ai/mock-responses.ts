import type {
  ConversationMessage,
  ConversationResponse,
  SourceReference,
  StructuredBlock,
} from "@product-reviews/contracts";
import { createId, nowIso } from "../../common/utils/ids";

const FOLLOW_UP_COMPARE = "Want me to compare those side-by-side?";
const FOLLOW_UP_BUDGET = "What budget are you working with?";
const FOLLOW_UP_VALUE = "Want the best value option?";
const FOLLOW_UP_SIZE = "Around 55 inches";
const FOLLOW_UP_PETS = "I have pets and carpet";
const FOLLOW_UP_DETAIL = "Can you go into a bit more detail?";

const DEMO_SOURCE_A: SourceReference = {
  title: "Sample round-up (demo)",
  domain: "example.com",
  url: "https://example.com/demo-product-roundup",
  date: "2026-01-15",
};

const DEMO_SOURCE_B: SourceReference = {
  title: "Sample spec sheet (demo)",
  domain: "example.org",
  url: "https://example.org/demo-spec-sheet",
};

const DEMO_COMPARISON_COLUMNS = [
  { key: "product", label: "Product" },
  { key: "bestFor", label: "Best for" },
  { key: "keyStrength", label: "Key strength" },
  { key: "limitation", label: "Limitation" },
  { key: "priceCategory", label: "Indicative price category" },
];

interface MockReply {
  content: string;
  structuredContent?: StructuredBlock[];
  sources?: SourceReference[];
  followUps: string[];
}

function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[—–]/g, "-")
    .replace(/\s+/g, " ");
}

const EXACT_REPLIES: Record<string, MockReply> = {
  "which robot vacuum is best for pet hair?": {
    content:
      "For pet hair, I’d start with suction, a sealed dust path, and a brush that doesn’t tangle as easily — then check how often you’ll empty it.",
    structuredContent: [
      {
        type: "recommendation",
        title: "How I’d narrow it",
        text: "This is a sample reply, not live research. In a real session I’d usually shortlist 2–3 models after asking about floor mix, home size, and whether you want a mop.",
      },
      {
        type: "advantages",
        heading: "What usually matters",
        items: [
          "Strong suction on carpet where hair embeds",
          "A brush designed to shed hair instead of wrapping",
          "A bin or dock you won’t mind emptying weekly",
        ],
      },
      {
        type: "limitations",
        heading: "Trade-offs to expect",
        items: [
          "Mopping models add cost if you mainly need vacuuming",
          "Self-empty docks are convenient but bulkier",
        ],
      },
      {
        type: "followUpPrompt",
        text: "If you tell me about floors and budget, I can show how a shortlist would look in this preview.",
      },
    ],
    followUps: [FOLLOW_UP_PETS, FOLLOW_UP_COMPARE, FOLLOW_UP_BUDGET],
  },
  "what's the best coffee machine under $500?": {
    content:
      "Under $500, the useful split is usually espresso-with-a-wand versus a bean-to-cup that trades control for convenience.",
    structuredContent: [
      {
        type: "heading",
        text: "A simple way to choose",
      },
      {
        type: "paragraph",
        text: "This preview can’t rank current machines. When Ava is connected, she’d check what you drink most, how much bench space you have, and whether you want to learn milk texture.",
      },
      {
        type: "bullets",
        items: [
          "**Best for control:** a compact espresso machine with a steam wand",
          "**Best for ease:** an automatic that grinds and brews at a button",
          "**Best value:** often the simpler espresso setup if you’re happy to practise",
        ],
      },
      {
        type: "considerations",
        heading: "Worth deciding first",
        items: [
          "Mostly espresso and milk drinks, or mostly long black / pour-over style?",
          "Are you willing to grind separately to stay under budget?",
        ],
      },
    ],
    followUps: [FOLLOW_UP_VALUE, FOLLOW_UP_COMPARE, FOLLOW_UP_DETAIL],
  },
  "dyson or shark - which should i buy?": {
    content:
      "I’d treat Dyson vs Shark as a fit question, not a brand winner. This sample comparison uses demo rows only.",
    structuredContent: [
      {
        type: "paragraph",
        text: "In a live session Ava would compare the actual models you’re looking at, including weight, attachments, and what you vacuum most.",
      },
      {
        type: "comparison",
        table: {
          caption: "Demo comparison — placeholder data only",
          columns: DEMO_COMPARISON_COLUMNS,
          rows: [
            {
              product: "Demo stick A",
              bestFor: "Lighter daily pickup",
              keyStrength: "Easier to carry up stairs",
              limitation: "Smaller bin in this sample",
              priceCategory: "Higher",
            },
            {
              product: "Demo stick B",
              bestFor: "Value and attachments",
              keyStrength: "More tools in the box (demo)",
              limitation: "Heavier in this sample",
              priceCategory: "Mid",
            },
          ],
        },
      },
      {
        type: "sources",
        sources: [DEMO_SOURCE_A, DEMO_SOURCE_B],
      },
    ],
    sources: [DEMO_SOURCE_A, DEMO_SOURCE_B],
    followUps: [FOLLOW_UP_VALUE, FOLLOW_UP_BUDGET, FOLLOW_UP_PETS],
  },
  "which tv is best in a bright room?": {
    content:
      "Bright rooms are less about a single “best TV” and more about size, how much daylight you get, and how far you sit.",
    structuredContent: [
      {
        type: "heading",
        text: "Two things that change the answer",
      },
      {
        type: "numbered",
        items: [
          "What size are you considering, and how far do you sit?",
          "Roughly what budget are you working with?",
        ],
      },
      {
        type: "paragraph",
        text: "This is a sample first reply. Ava’s usual pattern is to ask 1–2 questions like these, then recommend a short list rather than a long article.",
      },
    ],
    followUps: [FOLLOW_UP_SIZE, FOLLOW_UP_BUDGET, FOLLOW_UP_VALUE],
  },
  "what's the quietest dishwasher?": {
    content:
      "Quiet dishwashers are usually about measured noise, a solid door, and whether you need a super-quiet night cycle.",
    structuredContent: [
      {
        type: "considerations",
        heading: "What I’d check next",
        items: [
          "Open-plan kitchen vs a closed-off one",
          "Full-size vs compact",
          "Whether a delay-start or night mode matters more than the headline dB figure",
        ],
      },
      {
        type: "followUpPrompt",
        text: "Tell me the kitchen layout and I can show the shape of a short shortlist in this preview.",
      },
    ],
    followUps: [FOLLOW_UP_BUDGET, FOLLOW_UP_COMPARE, FOLLOW_UP_DETAIL],
  },
  "which air fryer is easiest to clean?": {
    content:
      "Easy-clean usually means a basket and tray that come apart, a non-stick you can actually wipe, and not too many greasy nooks.",
    structuredContent: [
      {
        type: "recommendation",
        title: "Best for easy clean (demo framing)",
        text: "I’d look first at a single-basket model with a removable, dishwasher-safe pan. Dual baskets add flexibility and more parts to wash.",
      },
      {
        type: "advantages",
        items: [
          "Removable crisper plate",
          "Smooth basket walls",
          "A window only if you’ll actually use it — it can be another surface to wipe",
        ],
      },
      {
        type: "limitations",
        items: [
          "Ceramic coatings can be gentler to clean but easier to scratch",
          "XL capacities take more sink space",
        ],
      },
    ],
    followUps: [FOLLOW_UP_VALUE, FOLLOW_UP_COMPARE, FOLLOW_UP_BUDGET],
  },
  "what's the best laptop for a university student?": {
    content:
      "For uni, I’d split the shortlist into **best overall**, **best value**, and **best for** the course — rather than one generic winner.",
    structuredContent: [
      {
        type: "recommendation",
        title: "Best overall (demo framing)",
        text: "A mid-weight Windows or Mac laptop with strong battery life and a comfortable keyboard. Exact models would come from live research later.",
      },
      {
        type: "recommendation",
        title: "Best value (demo framing)",
        text: "A well-reviewed last-year model, 16GB RAM, and enough storage for notes and browsers — not the newest chip if it blows the budget.",
      },
      {
        type: "recommendation",
        title: "Best for design / video courses (demo framing)",
        text: "More RAM and a better screen, even if you drop a little portability. STEM with specialised software may need a different path.",
      },
      {
        type: "considerations",
        heading: "Useful to know",
        items: [
          "Mostly notes and research, or heavy software?",
          "Do you already prefer Mac or Windows?",
        ],
      },
    ],
    followUps: [FOLLOW_UP_BUDGET, FOLLOW_UP_VALUE, FOLLOW_UP_DETAIL],
  },
  "which cordless stick vacuum is best value?": {
    content:
      "Best value on a stick vac is usually “cleans your floors well enough, with a battery that lasts a weekday tidy, without paying for extras you won’t use.”",
    structuredContent: [
      {
        type: "paragraph",
        text: "This preview won’t name a current winner. A live Ava reply would weigh hard floors vs carpet, replacement-battery cost, and whether a docking station is included.",
      },
      {
        type: "bullets",
        items: [
          "Skip premium laser-detect features if you mostly do quick pickups",
          "Check how the main brush handles hair if you have pets",
          "A spare battery can matter more than a slightly stronger motor",
        ],
      },
    ],
    followUps: [FOLLOW_UP_COMPARE, FOLLOW_UP_PETS, FOLLOW_UP_BUDGET],
  },
  [normalize(FOLLOW_UP_COMPARE)]: {
    content:
      "Here’s how a side-by-side would look in this preview — demo rows only, not current product facts.",
    structuredContent: [
      {
        type: "comparison",
        table: {
          caption: "Demo comparison — placeholder data only",
          columns: DEMO_COMPARISON_COLUMNS,
          rows: [
            {
              product: "Demo option A",
              bestFor: "Everyday convenience",
              keyStrength: "Simpler to live with in this sample",
              limitation: "Fewer extras",
              priceCategory: "Mid",
            },
            {
              product: "Demo option B",
              bestFor: "People who want more control",
              keyStrength: "More adjustable in this sample",
              limitation: "Steeper learning curve",
              priceCategory: "Higher",
            },
            {
              product: "Demo option C",
              bestFor: "Tighter budgets",
              keyStrength: "Covers the basics",
              limitation: "Fewer premium features",
              priceCategory: "Lower",
            },
          ],
        },
      },
    ],
    followUps: [FOLLOW_UP_VALUE, FOLLOW_UP_BUDGET],
  },
  [normalize(FOLLOW_UP_BUDGET)]: {
    content:
      "Budget is one of the fastest ways to cut a long list down. I don’t have live prices in this preview, but this is how I’d use it.",
    structuredContent: [
      {
        type: "numbered",
        items: [
          "Set a ceiling, not a target — leave a little room for a better-fitting option.",
          "Say what you refuse to compromise on (noise, size, pet hair, warranty).",
          "I’d then show a **best overall**, **best value**, and maybe a **best for** your constraint.",
        ],
      },
      {
        type: "followUpPrompt",
        text: "If you drop a number and the product type, a later live Ava could work with that immediately.",
      },
    ],
    followUps: [FOLLOW_UP_VALUE, FOLLOW_UP_COMPARE],
  },
  [normalize(FOLLOW_UP_VALUE)]: {
    content:
      "Best value, in Ava’s terms, is the option that covers your real needs without paying for a feature you won’t use.",
    structuredContent: [
      {
        type: "recommendation",
        title: "Best value (demo framing)",
        text: "I’d usually pick a well-reviewed mid-tier demo option: enough performance for the job, simpler extras, and cheaper consumables where that matters.",
      },
      {
        type: "paragraph",
        text: "I’m not ranking live products here. When research is connected, this is the slot where a specific model would appear — with uncertainty if the data is thin.",
      },
    ],
    followUps: [FOLLOW_UP_COMPARE, FOLLOW_UP_DETAIL],
  },
  [normalize(FOLLOW_UP_SIZE)]: {
    content:
      "Around 55 inches is a common bright-room size if you sit about two to three metres away. I’d still want budget and how harsh the daylight is before naming a shortlist.",
    structuredContent: [
      {
        type: "bullets",
        items: [
          "Prioritise peak brightness over extra smart-TV features",
          "A matte or anti-reflect treatment helps more than a slightly larger panel",
          "This remains a sample reply, not a current TV recommendation",
        ],
      },
    ],
    followUps: [FOLLOW_UP_BUDGET, FOLLOW_UP_VALUE],
  },
  [normalize(FOLLOW_UP_PETS)]: {
    content:
      "Pets plus carpet usually means hair pickup and emptying hassle beat extra mopping features.",
    structuredContent: [
      {
        type: "advantages",
        heading: "I’d lean toward",
        items: [
          "A tangle-resistant brush",
          "Stronger suction on carpet",
          "A bin or dock you can empty without a cloud of dust",
        ],
      },
      {
        type: "limitations",
        heading: "I’d be cautious about",
        items: [
          "Very small bins if you have more than one shedding pet",
          "Paying up for mopping if the floors are mostly carpet",
        ],
      },
    ],
    followUps: [FOLLOW_UP_COMPARE, FOLLOW_UP_BUDGET, FOLLOW_UP_VALUE],
  },
  [normalize(FOLLOW_UP_DETAIL)]: {
    content:
      "Happy to go a layer deeper — still as a UI preview, not live research.",
    structuredContent: [
      {
        type: "heading",
        text: "What a fuller Ava answer would add",
      },
      {
        type: "paragraph",
        text: "A later connected Ava would keep the first reply short, then add detail on request: a few named options, why they fit, and what she’s unsure about.",
      },
      {
        type: "bullets",
        items: [
          "A **best overall** pick for most people in your situation",
          "A **best value** pick if the premium extras aren’t worth it",
          "A **best for…** pick if you have a specific constraint",
          "A comparison table if you’re down to two or three",
        ],
      },
      {
        type: "sources",
        sources: [DEMO_SOURCE_A],
      },
    ],
    sources: [DEMO_SOURCE_A],
    followUps: [FOLLOW_UP_COMPARE, FOLLOW_UP_VALUE],
  },
};

const FALLBACK_REPLY: MockReply = {
  content:
    "I can take that question in this preview, but I don’t have live product research connected yet.",
  structuredContent: [
    {
      type: "paragraph",
      text: "This screen is the conversational interface. Sample replies here are placeholders so the real assistant can be wired in later without rebuilding the UI.",
    },
    {
      type: "followUpPrompt",
      text: "If you want to see more of the layout, try a comparison, a budget question, or a best-value follow-up.",
    },
  ],
  followUps: [FOLLOW_UP_COMPARE, FOLLOW_UP_BUDGET, FOLLOW_UP_VALUE],
};

function latestUserText(messages: ConversationMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === "user") {
      return messages[index].content;
    }
  }
  return "";
}

export function buildMockReply(messages: ConversationMessage[]): MockReply {
  const last = normalize(latestUserText(messages));
  return EXACT_REPLIES[last] ?? FALLBACK_REPLY;
}

export function toSendMessageResult(reply: MockReply): ConversationResponse {
  const followUps = reply.followUps.slice(0, 3);
  const message: ConversationMessage = {
    id: createId("msg"),
    role: "ava",
    content: reply.content,
    createdAt: nowIso(),
    status: "complete",
    structuredContent: reply.structuredContent,
    sources: reply.sources,
    followUps,
  };

  return { message, followUps };
}
