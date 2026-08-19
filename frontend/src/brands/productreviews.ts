import type { BrandConfig } from "@/brands/types";

const asset = (path: string) => `/brands/productreviews/${path}`;

export const productReviewsBrand: BrandConfig = {
  id: "productreviews",
  domain: "productreviews.com.au",
  name: "ProductReviews.com.au",
  colors: {
    primary: "#2E7D32",
    primaryHover: "#256628",
    primarySoft: "#E8F3E9",
    heading: "#111111",
    body: "#3A3A3A",
    muted: "#6F6B66",
    background: "#FFFFFF",
    surface: "#F5F4F2",
    card: "#FFFFFF",
    accent: "#FFC107",
    footer: "#2A2A2A",
    onPrimary: "#FFFFFF",
    onAccent: "#111111",
    border: "#E6E2DC",
    questionBubbles: [
      "#3D7A3C",
      "#1D4ED8",
      "#EA580C",
      "#6D28D9",
      "#D4A017",
      "#0F766E",
      "#C81E1E",
      "#1E3A5F",
    ],
  },
  typography: {
    sans: "plus-jakarta",
    script: "caveat",
  },
  logo: {
    parts: [
      { text: "Product", color: "heading" },
      { text: "Reviews", color: "primary" },
    ],
    suffix: ".com.au",
    alt: "ProductReviews.com.au",
  },
  images: {
    heroScene: {
      src: asset("hero.png"),
      alt: "Ava, independent product research assistant",
    },
    ava: {
      src: asset("ava.jpg"),
      alt: "Ava, independent product research assistant",
    },
  },
  header: {
    nav: [],
    ctaLabel: "Ask Ava",
    ctaHref: "/#ask-ava",
  },
  hero: {
    heading: "Smart choices",
    headingAccent: "made",
    headingEnd: "simple.",
    trustItems: [
      "No fake reviews. No paid placements.",
      "Just real research by real people using real products.",
    ],
    handwrittenNote: "We’ve done the hard yards so you don’t have to!",
    avaIntro: "Hi, I’m Ava",
    avaRole: "your AI product\nexpert",
  },
  askAva: {
    headlinePrefix: "Ask Ava before you buy",
    headlineAccent: "ANYTHING!",
    placeholder: "Ask Ava anything about a product…",
    cta: "ASK AVA",
    statusText: "Ava is online and ready to help",
  },
  suggestedQuestions: {
    heading: "Not sure where to start?",
    subheading: "Try asking Ava one of these…",
    footerNote: "Ask your question or try one above!",
    questions: [
      {
        id: "robot-vacuum-pet-hair",
        text: "Which robot vacuum is best for pet hair?",
        icon: "robot-vacuum",
      },
      {
        id: "coffee-under-500",
        text: "What’s the best coffee machine under $500?",
        icon: "coffee",
      },
      {
        id: "dyson-or-shark",
        text: "Dyson or Shark — which should I buy?",
        icon: "compare",
      },
      {
        id: "tv-bright-room",
        text: "Which TV is best in a bright room?",
        icon: "tv",
      },
      {
        id: "quietest-dishwasher",
        text: "What’s the quietest dishwasher?",
        icon: "dishwasher",
      },
      {
        id: "air-fryer-easy-clean",
        text: "Which air fryer is easiest to clean?",
        icon: "air-fryer",
      },
      {
        id: "laptop-university",
        text: "What’s the best laptop for a university student?",
        icon: "laptop",
      },
      {
        id: "stick-vacuum-value",
        text: "Which cordless stick vacuum is best value?",
        icon: "stick-vacuum",
      },
    ],
  },
  independence: {
    badge: "Our promise",
    headline: "Independent advice.",
    subtitle: "That’s our promise.",
    paragraphs: [
      "ProductReviews.com.au exists to help you make better buying decisions.",
      "Ava’s recommendations are based on what’s right for you — not on which retailer, manufacturer or brand pays the most.",
      "Where we have a commercial relationship that may earn us a commission, we’ll make that clear.",
      "Commercial relationships must never determine Ava’s recommendations.",
    ],
  },
  trustPrinciples: [
    {
      id: "independent",
      icon: "independent",
      title: "Independent",
      description: "Unbiased advice. No paid placement.",
    },
    {
      id: "researched",
      icon: "researched",
      title: "Researched & compared",
      description: "We analyse so you don’t have to.",
    },
    {
      id: "trusted",
      icon: "trusted",
      title: "Trusted advice",
      description: "Clear answers you can rely on.",
    },
    {
      id: "australian",
      icon: "australian",
      title: "Made for Australians",
      description: "Local context. Real relevance.",
    },
  ],
  learning: {
    heading: "Ava is always learning.",
    body: "We’re continually improving Ava and expanding the products she can help you research. If there’s something you’d like her to know more about, we’d love to hear from you.",
    cta: "Help make Ava smarter",
    ctaHref: "/contact",
  },
  footer: {
    tagline:
      "Independent product research to help Australians make better buying decisions.",
    copyright: "© 2026 Next Marketing Pty Ltd. All rights reserved.",
  },
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Disclaimer", href: "/disclaimer" },
    { label: "Contact", href: "/contact" },
  ],
  seo: {
    title: "ProductReviews.com.au — Find the right products. Every time.",
    description:
      "Independent product research to help Australians make better buying decisions. Ask Ava before you buy.",
  },
  analytics: {
    gtmId: undefined,
    gaMeasurementId: undefined,
    plausibleDomain: undefined,
  },
  ava: {
    name: "Ava",
    introText: "Hi, I’m Ava your AI product expert",
    role: "Independent product research assistant",
    instructions:
      "You are Ava, an independent product research assistant for ProductReviews.com.au. Help Australians choose the right consumer products. Base recommendations on fit for the person’s needs, not on which retailer, manufacturer or brand pays the most. If a commercial relationship may earn a commission, say so clearly. Never let commercial relationships determine recommendations. Be warm, plain-spoken, and specific. Do not invent reviews or claim products were tested if they were not.",
  },
  conversation: {
    backLabel: "Back to home",
    backShortLabel: "Back",
    composerLabel: "Message Ava",
    sendLabel: "Send",
    emptyHeading: "Ask Ava a product question",
    emptyBody:
      "Start with what you’re trying to buy, or the problem you need solved. Ava will keep the first reply short and may ask a couple of useful questions before recommending.",
    errorMessage:
      "Ava couldn’t reply just then. You can try sending that again.",
    retryLabel: "Try again",
    loadingLabel: "Ava is thinking",
    followUpsLabel: "Suggested next questions",
    previewNotice:
      "Development preview — replies here are sample interface responses, not live product research.",
  },
};
