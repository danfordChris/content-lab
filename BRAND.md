# &lt;DanfordChris/&gt; — Brand Guide

The visual + voice identity for the personal brand, extracted from the official
wordmark. These are the exact instructions the Content Lab AI uses when it
writes posts and generates images/diagrams (see `lib/types.ts` → `DEFAULT_BRAND`,
editable in the app under **Settings**).

---

## Signature / wordmark

```
<DanfordChris/>
```

- Wrapped in code-tag angle brackets `< … />`.
- **"Danford"** in white, **"Chris"** in blue, the **brackets + slash** in gray.
- Monospace, blocky, technical — reads like code.

## Color palette

| Role | Color | Hex |
|------|-------|-----|
| **Background** | Near-black (subtle grain) | `#0A0A0A` |
| **Primary** | White | `#FFFFFF` |
| **Accent** | Vivid blue | `#2563EB` |
| **Brackets / muted** | Gray | `#8A8A8A` |

> Rule of thumb: white text/shapes on the dark background, gray angle brackets,
> and **exactly one** blue accent per visual.

## Typography

- **Font style:** blocky **monospace / pixel-style** code font with angular,
  chamfered letterforms.
- Closest free web fonts: **Departure Mono**, **Monocraft**, or a clean fallback
  like **JetBrains Mono** / **IBM Plex Mono**.

## Aesthetic

Minimal, **high-contrast**, cinematic dark **developer / terminal** look, built
around the `<…/>` code-tag motif. Sleek, techy, focused.

## Image & diagram instructions (AI generation)

- **Diagram-heavy**: boxes, arrows, simple icons that explain a concept step by step.
- White text and shapes on the dark background; **gray (`#8A8A8A`) angle brackets**;
  **one** vivid blue (`#2563EB`) accent per visual.
- Wrap the main title in code brackets, e.g. `<How RAG Works/>`.
- **Bilingual labels** — English first, then Swahili in parentheses, e.g.
  `Input (Ingizo)`, `Vector Database (Hifadhidata ya Veta)`.
- Lots of whitespace, **beginner-friendly**, no clutter.
- Optionally a small `<DanfordChris/>` wordmark in a corner.
- **Avoid:** clutter, tiny/gibberish text, watermarks, low contrast.

## Voice (text)

- **Audience:** developers **and** curious non-technical readers (East Africa + global).
- **Tone:** practical, developer-friendly, clear, curious, slightly playful;
  explain jargon simply with real-world analogies.
- **Bilingual:** English first, with a short Swahili summary or Swahili labels where it helps.
- **Never:** hype words, emoji spam, corporate fluff, fake metrics, clickbait.
- **Sign-off:** `<DanfordChris/>`.

---

## How the app uses this

- Text generation injects the voice into every system prompt (`lib/ai.ts` → `buildSystem`).
- Image generation auto-decides **diagram (SVG, real bilingual labels)** vs
  **decorative image (FLUX)** and applies this palette (`lib/ai.ts` → `generateVisual`).
- All of the above are the defaults in `DEFAULT_BRAND` and can be overridden per
  field in **Settings** (they merge over these defaults).
