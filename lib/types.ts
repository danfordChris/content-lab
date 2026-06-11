export type Pillar =
  | "code_craft"
  | "ai_practice"
  | "code_x_ai"
  | "simulations"
  | "build_in_public"
  | "dev_education"
  | "social_education";

export type IdeaStatus = "spark" | "developing" | "ready" | "used" | "archived";
export type Platform =
  | "linkedin"
  | "instagram_reel"
  | "tiktok"
  | "x"
  | "youtube_short"
  | "video_script"
  | "blog"
  | "carousel";
export type DraftStatus = "draft" | "ready" | "scheduled" | "posted" | "archived";

export type SlideLayout = "cover" | "text" | "statement" | "stat" | "outro";

export interface CarouselSlide {
  text: string;
  imagePrompt?: string;
  imageUrl?: string;
  isOutro?: boolean; // the final branded follow-me slide
  layout?: SlideLayout; // editorial page type (mixed carousels)
}

export interface DraftFormatMeta {
  slides?: CarouselSlide[];
  [key: string]: unknown;
}

export interface GeneratedIdea {
  title: string;
  angle: string;
  pillar: Pillar;
  format: string;
}

export interface ExpandedBrief {
  angle: string;
  audience: string;
  whyNow: string;
  outline: string[];
  hooks: string[];
  suggestedPillar: Pillar;
  suggestedFormats: Platform[];
  examples: string[];
}

export interface Idea {
  id: string;
  title: string;
  body?: string;
  pillar?: Pillar;
  status: IdeaStatus;
  sourceUrl?: string;
  sourceComment?: string;
  brief?: ExpandedBrief;
  createdAt: string;
  updatedAt: string;
}

export interface Draft {
  id: string;
  ideaId?: string;
  platform: Platform;
  title: string;
  content: string;
  status: DraftStatus;
  imageUrl?: string;
  formatMeta?: DraftFormatMeta;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarSlot {
  id: string;
  draftId: string;
  platform: Platform;
  scheduledAt: string; // ISO
  status: "scheduled" | "posted" | "skipped";
  postedAt?: string;
  pillar?: Pillar; // which content pillar this slot serves (weekly planner)
  note?: string; // how-to-post tip shown in calendar + reminder emails
  ideaId?: string; // source idea, for traceability
}

export interface ImageStyle {
  primaryColor?: string; // e.g. "#34d399" or "emerald green"
  accentColor?: string; // e.g. "cyan"
  background?: string; // e.g. "dark #09090b" or "white"
  aesthetic?: string; // e.g. "clean, minimal, modern developer"
  fontStyle?: string; // e.g. "bold sans-serif"
  mood?: string; // e.g. "high contrast, tech/code motif"
  extra?: string; // freeform additions
  avoid?: string; // things to avoid (e.g. "no text, no people")
}

export interface BrandSettings {
  // text voice
  audience?: string; // who you write for
  toneNotes?: string; // extra voice guidance
  customRules?: string; // freeform must/never rules
  signature?: string; // how to sign posts
  // image style
  imageStyle?: ImageStyle;
  // social handles (used on the carousel outro slide)
  socials?: { instagram?: string; tiktok?: string; x?: string };
  // where reminder emails go (defaults to the login email)
  notifyEmail?: string;
  // identity shown in the carousel page header + outro
  displayName?: string;
  role?: string;
  avatarUrl?: string; // photo for the footer circle; blank = monogram
  logoUrl?: string; // top-left brand logo image; blank = <DanfordChris/> wordmark
}

export const DEFAULT_BRAND: BrandSettings = {
  audience: "developers AND curious non-technical readers (East Africa + global)",
  toneNotes:
    "Explain so a smart non-technical person also understands — define jargon simply, use real-world analogies.",
  customRules:
    "You may write bilingually: English first, with a short Swahili summary or Swahili labels where it helps the audience. Keep it practical and concrete.",
  signature: "<DanfordChris/>",
  imageStyle: {
    background: "deep near-black background (#0A0A0A) with a subtle noise/grain texture",
    primaryColor: "white (#FFFFFF)",
    accentColor: "vivid blue (#2563EB)",
    aesthetic:
      "minimal, high-contrast developer / terminal aesthetic with a code-tag <…/> motif; clear labeled diagram that even a non-technical person understands at a glance",
    fontStyle:
      "blocky monospace / pixel-style technical code font with angular, chamfered letterforms",
    mood: "sleek, cinematic, techy, focused",
    extra:
      "Diagram-heavy: boxes, arrows, simple icons explaining the concept step by step. Use WHITE text and shapes on the dark background, GRAY (#8A8A8A) angle brackets, and exactly ONE vivid blue (#2563EB) accent per visual. Wrap the main title in code brackets like <Title/>. Label key parts in BOTH English and Swahili, e.g. 'Input (Ingizo)'. Lots of whitespace, beginner-friendly. Optionally a small <DanfordChris/> wordmark in a corner.",
    avoid: "clutter, tiny unreadable text, gibberish text, watermarks, low contrast",
  },
  socials: {
    instagram: "codewithdanfordchris",
    tiktok: "codewithdanfordchris",
    x: "codewithdanfordchris",
  },
  displayName: "Danford Chris",
  role: "Software Developer · AI Educator",
};

/** Merge saved settings over the brand defaults (so your brand applies even
 *  before anything is saved, and partial overrides keep the rest). */
export function effectiveBrand(saved?: BrandSettings): BrandSettings {
  return {
    ...DEFAULT_BRAND,
    ...(saved ?? {}),
    imageStyle: { ...DEFAULT_BRAND.imageStyle, ...(saved?.imageStyle ?? {}) },
    socials: { ...DEFAULT_BRAND.socials, ...(saved?.socials ?? {}) },
  };
}

export interface DB {
  ideas: Idea[];
  drafts: Draft[];
  calendar: CalendarSlot[];
  settings?: BrandSettings;
}

export const PILLARS: { value: Pillar; label: string; color: string }[] = [
  { value: "code_craft", label: "Code Craft", color: "#38bdf8" },
  { value: "ai_practice", label: "AI in Practice", color: "#a78bfa" },
  { value: "code_x_ai", label: "Code × AI", color: "#f472b6" },
  { value: "simulations", label: "Simulations", color: "#fbbf24" },
  { value: "build_in_public", label: "Build in Public", color: "#34d399" },
  { value: "dev_education", label: "Dev Education", color: "#fb923c" },
  { value: "social_education", label: "Social Education", color: "#2dd4bf" },
];

export const PLATFORMS: { value: Platform; label: string; color: string; limit?: number }[] = [
  { value: "linkedin", label: "LinkedIn", color: "#0A66C2", limit: 3000 },
  { value: "instagram_reel", label: "Instagram Reel", color: "#E1306C" },
  { value: "tiktok", label: "TikTok", color: "#25F4EE" },
  { value: "x", label: "X / Twitter", color: "#e7e9ea", limit: 280 },
  { value: "youtube_short", label: "YouTube Short", color: "#FF0000" },
  { value: "video_script", label: "Video Script", color: "#f43f5e" },
  { value: "blog", label: "Blog", color: "#10B981" },
  { value: "carousel", label: "Carousel", color: "#8B5CF6" },
];

export function pillarMeta(p?: Pillar) {
  return PILLARS.find((x) => x.value === p);
}
export function platformMeta(p: Platform) {
  return PLATFORMS.find((x) => x.value === p)!;
}
