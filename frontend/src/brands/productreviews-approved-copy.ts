/**
 * Client-approved ProductReviews.com.au marketing copy (Step 2).
 * Tests assert BrandConfig still matches these strings exactly.
 */
export const PRODUCTREVIEWS_APPROVED_COPY = {
  hero: {
    heading: "Find the right products.",
    headingAccent: "Every time.",
    trustItems: [
      "No fake reviews. No paid placements.",
      "Just real research by real people using real products.",
    ] as const,
    handwrittenNote: "We’ve done the hard yards so you don’t have to!",
    avaIntro: "Hi, I’m Ava.",
    avaRole: "Your independent product research assistant.",
  },
  askAva: {
    headlinePrefix: "Ask Ava before you buy",
    headlineAccent: "ANYTHING!",
    placeholder: "Ask Ava anything about a product…",
    cta: "ASK AVA",
  },
  suggestedQuestions: {
    heading: "Not sure where to start?",
    subheading: "Try asking Ava one of these…",
    questions: [
      "Which robot vacuum is best for pet hair?",
      "What’s the best coffee machine under $500?",
      "Dyson or Shark — which should I buy?",
      "Which TV is best in a bright room?",
      "What’s the quietest dishwasher?",
      "Which air fryer is easiest to clean?",
      "What’s the best laptop for a university student?",
      "Which cordless stick vacuum is best value?",
    ] as const,
  },
  independence: {
    headline: "Independent advice.",
    subtitle: "That’s our promise.",
    paragraphs: [
      "ProductReviews.com.au exists to help you make better buying decisions.",
      "Ava’s recommendations are based on what’s right for you — not on which retailer, manufacturer or brand pays the most.",
      "Where we have a commercial relationship that may earn us a commission, we’ll make that clear.",
      "Commercial relationships must never determine Ava’s recommendations.",
    ] as const,
  },
  learning: {
    heading: "Ava is always learning.",
    body: "We’re continually improving Ava and expanding the products she can help you research. If there’s something you’d like her to know more about, we’d love to hear from you.",
    cta: "Help make Ava smarter",
  },
  footer: {
    tagline:
      "Independent product research to help Australians make better buying decisions.",
    copyright: "© 2026 Next Marketing Pty Ltd. All rights reserved.",
  },
  legalLabels: [
    "Privacy Policy",
    "Terms & Conditions",
    "Disclaimer",
    "Contact",
  ] as const,
} as const;
