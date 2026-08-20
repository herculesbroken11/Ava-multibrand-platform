import type { BrandId, BrandKind } from "@product-reviews/contracts";

export type LogoColorToken = "heading" | "primary" | "muted" | "onPrimary";

export type TrustIconId =
  | "independent"
  | "researched"
  | "trusted"
  | "australian";

export type QuestionIconId =
  | "robot-vacuum"
  | "coffee"
  | "compare"
  | "tv"
  | "dishwasher"
  | "air-fryer"
  | "laptop"
  | "stick-vacuum";

export type ProductSlot =
  | "top-left"
  | "mid-left"
  | "bottom-left"
  | "top-right"
  | "mid-right"
  | "bottom-right";

export interface BrandColors {
  primary: string;
  primaryHover: string;
  primarySoft: string;
  heading: string;
  body: string;
  muted: string;
  background: string;
  surface: string;
  card: string;
  accent: string;
  footer: string;
  onPrimary: string;
  onAccent: string;
  border: string;
  questionBubbles: string[];
}

export interface BrandTypography {
  sans: "plus-jakarta" | "inter" | "source-sans";
  script: "caveat" | "kalam";
}

export interface BrandLogoPart {
  text: string;
  color: LogoColorToken;
}

export interface BrandLogo {
  parts: BrandLogoPart[];
  suffix?: string;
  imageSrc?: string;
  alt: string;
}

export interface AvaImage {
  src: string;
  alt: string;
}

export interface ProductImage {
  id: string;
  src: string;
  alt: string;
  slot: ProductSlot;
}

export interface BrandImages {
  /** Full lifestyle scene used in the landing hero when provided. */
  heroScene?: AvaImage;
  ava: AvaImage;
  products?: ProductImage[];
}

export interface NavItem {
  label: string;
  href: string;
}

export interface HeaderContent {
  nav: NavItem[];
  ctaLabel: string;
  ctaHref: string;
  previewBadge?: string;
}

export interface HeroContent {
  heading: string;
  headingAccent: string;
  headingEnd?: string;
  trustItems: string[];
  handwrittenNote: string;
  avaIntro: string;
  avaRole?: string;
}

export interface AskAvaContent {
  headlinePrefix: string;
  headlineAccent: string;
  placeholder: string;
  cta: string;
  statusText: string;
}

export interface SuggestedQuestion {
  id: string;
  text: string;
  icon: QuestionIconId;
}

export interface SuggestedQuestionsContent {
  heading: string;
  subheading: string;
  footerNote?: string;
  questions: SuggestedQuestion[];
}

export interface IndependenceContent {
  badge: string;
  headline: string;
  subtitle?: string;
  paragraphs: string[];
}

export interface TrustPrinciple {
  id: string;
  icon: TrustIconId;
  title: string;
  description: string;
}

export interface LearningContent {
  heading: string;
  body: string;
  cta: string;
  ctaHref: string;
  /** `pending` means the CTA exists but the client has not confirmed the final destination. */
  ctaDestinationStatus: "final" | "pending";
}

export interface FooterContent {
  tagline: string;
  copyright: string;
}

export interface LegalLink {
  label: string;
  href: string;
}

export interface BrandSeo {
  title: string;
  description: string;
  ogImage?: string;
}

export interface BrandAnalytics {
  gtmId?: string;
  gaMeasurementId?: string;
  plausibleDomain?: string;
}

export interface AvaConfig {
  name: string;
  introText: string;
  role: string;
  instructions: string;
}

export interface ConversationContent {
  backLabel: string;
  backShortLabel: string;
  composerLabel: string;
  sendLabel: string;
  emptyHeading: string;
  emptyBody: string;
  errorMessage: string;
  retryLabel: string;
  loadingLabel: string;
  followUpsLabel: string;
  previewNotice: string;
  rateLimitMessage: string;
}

export type ContentStatus = "final" | "placeholder";

export type InformationBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] };

export interface InformationPage {
  title: string;
  intro?: string;
  lastUpdated?: string;
  status: ContentStatus;
  blocks: InformationBlock[];
}

export interface ContactPage {
  title: string;
  heading: string;
  intro?: string;
  email?: string;
  businessName?: string;
  instructions?: string;
  lastUpdated?: string;
  status: ContentStatus;
}

export interface BrandPages {
  privacy: InformationPage;
  terms: InformationPage;
  disclaimer: InformationPage;
  contact: ContactPage;
  about?: InformationPage;
}

export interface BrandConfig {
  id: BrandId;
  kind: BrandKind;
  domain: string;
  name: string;
  locale?: string;
  favicon?: string;
  categoryContext?: string;
  featureFlags?: Record<string, boolean>;
  colors: BrandColors;
  typography: BrandTypography;
  logo: BrandLogo;
  images: BrandImages;
  header: HeaderContent;
  hero: HeroContent;
  askAva: AskAvaContent;
  suggestedQuestions: SuggestedQuestionsContent;
  independence: IndependenceContent;
  trustPrinciples: TrustPrinciple[];
  learning: LearningContent;
  footer: FooterContent;
  legal: LegalLink[];
  seo: BrandSeo;
  analytics: BrandAnalytics;
  ava: AvaConfig;
  conversation: ConversationContent;
  pages: BrandPages;
}
