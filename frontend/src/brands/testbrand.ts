import type { BrandConfig } from "./types";

/**
 * Non-production fixture used to prove hostname → brand switching.
 * Not a public brand. Do not deploy this as a live site.
 */
export const testBrand: BrandConfig = {
  id: "testbrand",
  kind: "test",
  domain: "testbrand.local",
  name: "Test Brand (fixture)",
  locale: "en-NZ",
  categoryContext:
    "TEST FIXTURE ONLY — not a public brand. Category: fixture products.",
  colors: {
    primary: "#0F172A",
    primaryHover: "#020617",
    primarySoft: "#E2E8F0",
    heading: "#0F172A",
    body: "#334155",
    muted: "#64748B",
    background: "#FFFFFF",
    surface: "#F8FAFC",
    card: "#FFFFFF",
    accent: "#0369A1",
    footer: "#0F172A",
    onPrimary: "#FFFFFF",
    onAccent: "#FFFFFF",
    border: "#E2E8F0",
    questionBubbles: [
      "#0F172A",
      "#0369A1",
      "#0F766E",
      "#7C3AED",
      "#B45309",
      "#BE123C",
      "#1D4ED8",
      "#365314",
    ],
  },
  typography: {
    sans: "plus-jakarta",
    script: "caveat",
  },
  logo: {
    parts: [
      { text: "Test", color: "heading" },
      { text: "Brand", color: "primary" },
    ],
    suffix: " (fixture)",
    alt: "Test Brand fixture — not a public brand",
  },
  images: {
    ava: {
      src: "/brands/testbrand/fixture.png",
      alt: "Test Brand fixture image — not a public brand",
    },
  },
  header: {
    nav: [],
    ctaLabel: "Ask Ava",
    ctaHref: "/#ask-ava",
  },
  hero: {
    heading: "TEST FIXTURE",
    headingAccent: "only",
    headingEnd: ".",
    trustItems: [
      "Not a public brand.",
      "Used only to prove hostname-based brand resolution.",
    ],
    handwrittenNote: "Fixture copy — not for production.",
    avaIntro: "Hi, I’m Ava",
    avaRole: "test-only fixture assistant",
  },
  askAva: {
    headlinePrefix: "Ask Ava (test fixture)",
    headlineAccent: "NOT LIVE",
    placeholder: "Fixture placeholder — not a public brand",
    cta: "ASK AVA",
    statusText: "Test fixture only — not a public brand",
  },
  suggestedQuestions: {
    heading: "Fixture questions",
    subheading: "These exist only to prove shared components still render.",
    footerNote: "TEST FIXTURE ONLY — not a public brand.",
    questions: [
      {
        id: "fixture-question",
        text: "Fixture question — not a public brand",
        icon: "compare",
      },
    ],
  },
  independence: {
    badge: "Fixture",
    headline: "Test-only independence copy.",
    subtitle: "Not a public brand.",
    paragraphs: [
      "TEST FIXTURE ONLY — not a public brand.",
      "This configuration exists to prove multi-brand hostname resolution.",
    ],
  },
  trustPrinciples: [
    {
      id: "independent",
      icon: "independent",
      title: "Fixture",
      description: "Not a public brand.",
    },
    {
      id: "researched",
      icon: "researched",
      title: "Fixture",
      description: "Not a public brand.",
    },
    {
      id: "trusted",
      icon: "trusted",
      title: "Fixture",
      description: "Not a public brand.",
    },
    {
      id: "australian",
      icon: "australian",
      title: "Fixture market",
      description: "Configured as New Zealand for tests only.",
    },
  ],
  learning: {
    heading: "Fixture learning block.",
    body: "TEST FIXTURE ONLY — not a public brand.",
    cta: "Fixture contact",
    ctaHref: "/contact",
    ctaDestinationStatus: "pending",
  },
  footer: {
    tagline: "TEST FIXTURE ONLY — not a public brand.",
    copyright: "© Test fixture. Not for production.",
  },
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Disclaimer", href: "/disclaimer" },
    { label: "Contact", href: "/contact" },
  ],
  seo: {
    title: "Test Brand (fixture) — not a public brand",
    description:
      "TEST FIXTURE ONLY. Used to prove hostname-based brand resolution. Not a public brand.",
  },
  analytics: {
    gtmId: undefined,
    gaMeasurementId: undefined,
    plausibleDomain: undefined,
  },
  ava: {
    name: "Ava",
    introText: "Hi, I’m Ava — test fixture only",
    role: "Test-only research assistant",
    instructions:
      "TEST FIXTURE ONLY — not a public brand. Do not treat this as a live site.",
  },
  conversation: {
    backLabel: "Back to home",
    backShortLabel: "Back",
    composerLabel: "Message Ava",
    sendLabel: "Send",
    emptyHeading: "Fixture conversation",
    emptyBody: "TEST FIXTURE ONLY — not a public brand.",
    errorMessage: "Fixture error copy — not a public brand.",
    retryLabel: "Try again",
    loadingLabel: "Ava is thinking",
    followUpsLabel: "Suggested next questions",
    previewNotice: "TEST FIXTURE ONLY — not a public brand.",
    rateLimitMessage:
      "Fixture rate-limit copy. TEST FIXTURE ONLY — not a public brand.",
  },
  pages: {
    privacy: {
      title: "Privacy Policy",
      status: "placeholder",
      intro: "TEST FIXTURE ONLY — not a public brand.",
      blocks: [{ type: "paragraph", text: "Fixture privacy placeholder." }],
    },
    terms: {
      title: "Terms & Conditions",
      status: "placeholder",
      intro: "TEST FIXTURE ONLY — not a public brand.",
      blocks: [{ type: "paragraph", text: "Fixture terms placeholder." }],
    },
    disclaimer: {
      title: "Disclaimer",
      status: "placeholder",
      intro: "TEST FIXTURE ONLY — not a public brand.",
      blocks: [{ type: "paragraph", text: "Fixture disclaimer placeholder." }],
    },
    contact: {
      title: "Contact",
      heading: "Contact",
      status: "placeholder",
      intro: "TEST FIXTURE ONLY — not a public brand.",
    },
  },
};
