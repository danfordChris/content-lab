"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  saveDraft,
  setDraftStatus,
  scheduleDraft,
  deleteDraft,
  generateSlideImageAction,
  generateAllSlidesAction,
  generatePostImageAction,
} from "@/app/actions";
import { PlatformBadge, StatusBadge } from "@/components/badges";
import { platformMeta, type Draft, type DraftStatus } from "@/lib/types";
import {
  downloadText,
  downloadAsImage,
  svgUrlToPngBlob,
  blobToDataUrl,
  slugify,
  extFor,
} from "@/lib/download";

export function DraftEditor({ draft }: { draft: Draft }) {
  const router = useRouter();
  const [title, setTitle] = useState(draft.title);
  const [pending, start] = useTransition();
  const isCarousel = draft.platform === "carousel" && draft.formatMeta?.slides?.length;

  function schedule() {
    const when = prompt("Schedule for (YYYY-MM-DD HH:MM)", defaultWhen());
    if (!when) return;
    const iso = new Date(when.replace(" ", "T")).toISOString();
    start(async () => {
      await scheduleDraft(draft.id, iso);
      toast.success("Scheduled");
      router.push("/calendar");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <PlatformBadge platform={draft.platform} />
        <StatusBadge status={draft.status} />
        <div className="ml-auto flex items-center gap-2">
          <select
            value={draft.status}
            onChange={(e) =>
              start(async () => {
                await setDraftStatus(draft.id, e.target.value as DraftStatus);
                router.refresh();
              })
            }
            className="input max-w-[140px] py-1.5 text-xs capitalize"
          >
            {(["draft", "ready", "scheduled", "posted", "archived"] as DraftStatus[]).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              navigator.clipboard.writeText(draft.content);
              toast.success("Copied to clipboard");
            }}
            className="btn btn-ghost text-xs py-1.5"
          >
            Copy
          </button>
          <button
            onClick={() =>
              downloadText(`${slugify(draft.title)}.${extFor(draft.platform)}`, draft.content)
            }
            className="btn btn-ghost text-xs py-1.5"
          >
            ↓ Text
          </button>
          <button onClick={schedule} disabled={pending} className="btn btn-primary text-xs py-1.5">
            Schedule
          </button>
        </div>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title !== draft.title && saveDraft(draft.id, { title })}
        className="bg-transparent text-lg font-medium outline-none"
      />

      {isCarousel ? (
        <CarouselEditor draft={draft} />
      ) : (
        <>
          <TextEditor draft={draft} />
          <CoverImage draft={draft} />
        </>
      )}

      <button
        onClick={() => {
          if (confirm("Delete this draft?")) {
            start(async () => {
              await deleteDraft(draft.id);
              router.push("/drafts");
            });
          }
        }}
        className="self-start text-xs text-red-500/70 hover:text-red-400"
      >
        Delete draft
      </button>
    </div>
  );
}

// ── Plain-text editor (LinkedIn, X, scripts, blog) ───────────────────────────
function TextEditor({ draft }: { draft: Draft }) {
  const [content, setContent] = useState(draft.content);
  const [saved, setSaved] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const limit = platformMeta(draft.platform).limit;
  const over = limit ? content.length > limit : false;

  useEffect(() => {
    if (content === draft.content) return;
    setSaved(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => saveDraft(draft.id, { content }).then(() => setSaved(true)), 1200);
    return () => clearTimeout(timer.current);
  }, [content, draft.id, draft.content]);

  return (
    <div className="card p-0 overflow-hidden">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={18}
        className="w-full resize-y bg-transparent p-4 text-sm leading-relaxed outline-none mono"
      />
      <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2 text-xs">
        <span className={over ? "text-red-400" : "text-zinc-500"}>
          {content.length}
          {limit ? ` / ${limit}` : ""} chars · {saved ? "saved" : "saving…"}
        </span>
        {over && <span className="text-red-400">Over the {platformMeta(draft.platform).label} limit</span>}
      </div>
    </div>
  );
}

// ── Cover image for any non-carousel draft ───────────────────────────────────
function CoverImage({ draft }: { draft: Draft }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [note, setNote] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");

  function gen() {
    setNote(null);
    start(async () => {
      const r = await generatePostImageAction(draft.id, prompt || undefined);
      setNote(
        r.placeholder
          ? r.error
            ? `Placeholder (AI failed: ${r.error})`
            : "Placeholder — configure an image provider"
          : r.kind === "diagram"
            ? "Diagram generated ✓"
            : r.kind === "card"
              ? "Branded card generated ✓"
              : "Image generated ✓"
      );
      router.refresh();
    });
  }

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-300">Visual / cover image</h3>
        <div className="flex items-center gap-2">
          {draft.imageUrl && (
            <button
              onClick={() => downloadAsImage(draft.imageUrl!, `${slugify(draft.title)}-cover`)}
              className="btn btn-ghost text-xs py-1.5"
            >
              ↓ Image
            </button>
          )}
          <button onClick={gen} disabled={pending} className="btn btn-ghost text-xs py-1.5">
            {pending ? "Generating…" : draft.imageUrl ? "Regenerate" : "Generate image"}
          </button>
        </div>
      </div>
      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Optional image prompt (defaults to the post title)…"
        className="input text-xs py-2"
      />
      {draft.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={draft.imageUrl} alt="cover" className="rounded-lg border border-[var(--border)] max-w-sm" />
      )}
      {note && <p className="text-xs text-zinc-500">{note}</p>}
    </div>
  );
}

// ── Carousel editor: per-slide text + AI image ───────────────────────────────
function CarouselEditor({ draft }: { draft: Draft }) {
  const router = useRouter();
  const slides = draft.formatMeta?.slides ?? [];
  const [zipping, setZipping] = useState(false);
  const [genning, startGen] = useTransition();
  const [includeImages, setIncludeImages] = useState(false);
  const withImages = slides.filter((s) => s.imageUrl).length;

  function generateAll() {
    startGen(async () => {
      try {
        const r = await generateAllSlidesAction(draft.id, includeImages);
        toast.success(
          `Designed ${r.count} slide${r.count === 1 ? "" : "s"}` +
            (r.images ? ` · ${r.images} with AI backgrounds` : "")
        );
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't design slides");
      }
      router.refresh();
    });
  }

  async function downloadAll() {
    setZipping(true);
    try {
      const [{ default: JSZip }, { jsPDF }] = await Promise.all([import("jszip"), import("jspdf")]);
      const zip = new JSZip();
      let captions = `${draft.title}\n\n`;
      const pages: { dataUrl: string; type: "PNG" | "JPEG"; w: number; h: number }[] = [];
      for (let i = 0; i < slides.length; i++) {
        const s = slides[i];
        captions += `Slide ${i + 1}: ${s.text}\n\n`;
        if (s.imageUrl) {
          // Rasterize SVG slides to PNG so they're upload-ready; pass raster as-is.
          let blob: Blob;
          let w = 1080;
          let h = 1350;
          if (s.imageUrl.endsWith(".svg")) {
            const r = await svgUrlToPngBlob(s.imageUrl);
            blob = r.blob;
            w = r.w;
            h = r.h;
          } else {
            blob = await (await fetch(s.imageUrl)).blob();
          }
          const ext = s.imageUrl.endsWith(".svg") ? "png" : s.imageUrl.split(".").pop() || "jpg";
          zip.file(`slide-${String(i + 1).padStart(2, "0")}.${ext}`, blob);
          pages.push({ dataUrl: await blobToDataUrl(blob), type: ext === "png" ? "PNG" : "JPEG", w, h });
        }
      }
      // Bundle the slides as a single in-order PDF — the exact file LinkedIn
      // document-post carousels accept. Page size matches the slide aspect.
      if (pages.length) {
        const first = pages[0];
        const pdf = new jsPDF({
          orientation: first.h >= first.w ? "portrait" : "landscape",
          unit: "px",
          format: [first.w, first.h],
          hotfixes: ["px_scaling"],
        });
        pages.forEach((p, i) => {
          if (i > 0) pdf.addPage([p.w, p.h], p.h >= p.w ? "portrait" : "landscape");
          pdf.addImage(p.dataUrl, p.type, 0, 0, p.w, p.h);
        });
        zip.file(`${slugify(draft.title)}-carousel.pdf`, pdf.output("blob"));
      }
      zip.file("captions.txt", captions);
      const out = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(out);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slugify(draft.title)}-carousel.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } finally {
      setZipping(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-zinc-500">
          {slides.length} slides · {withImages} with images
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={generateAll} disabled={genning} className="btn btn-primary text-xs py-1.5">
            {genning ? "Designing…" : "Generate all slides"}
          </button>
          <button onClick={downloadAll} disabled={zipping} className="btn btn-ghost text-xs py-1.5">
            {zipping ? "Zipping…" : "↓ Download all (zip)"}
          </button>
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={includeImages}
          onChange={(e) => setIncludeImages(e.target.checked)}
          className="accent-[var(--accent)] w-4 h-4"
        />
        Include AI background images on the cover &amp; statement slides
        <span className="text-zinc-600">(Apple-style; slower)</span>
      </label>
      {slides.map((s, i) => (
        <SlideCard
          key={i}
          draft={draft}
          index={i}
          text={s.text}
          imageUrl={s.imageUrl}
          imagePrompt={s.imagePrompt}
          includeImages={includeImages}
        />
      ))}
    </div>
  );
}

function SlideCard({
  draft,
  index,
  text,
  imageUrl,
  imagePrompt,
  includeImages,
}: {
  draft: Draft;
  index: number;
  text: string;
  imageUrl?: string;
  imagePrompt?: string;
  includeImages?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [val, setVal] = useState(text);
  const [note, setNote] = useState<string | null>(null);

  function genImage() {
    setNote(null);
    start(async () => {
      const r = await generateSlideImageAction(draft.id, index, includeImages);
      setNote(
        r.placeholder
          ? r.error
            ? `placeholder (${r.error})`
            : "placeholder"
          : r.kind === "slide"
            ? "slide ✓"
            : r.kind === "diagram"
              ? "diagram ✓"
              : "image ✓"
      );
      router.refresh();
    });
  }

  return (
    <div className="card p-4 flex flex-col sm:flex-row gap-4">
      <div className="shrink-0 w-36">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={`slide ${index + 1}`} className="w-36 h-36 object-cover rounded-lg border border-[var(--border)]" />
        ) : (
          <div className="w-36 h-36 rounded-lg border border-dashed border-[var(--border)] grid place-items-center text-xs text-zinc-600">
            no image
          </div>
        )}
        <button onClick={genImage} disabled={pending} className="btn btn-ghost text-[11px] py-1 px-2 mt-2 w-36">
          {pending ? "…" : imageUrl ? "Regenerate" : "Generate image"}
        </button>
        {imageUrl && (
          <button
            onClick={() =>
              downloadAsImage(imageUrl, `${slugify(draft.title)}-slide-${String(index + 1).padStart(2, "0")}`)
            }
            className="btn btn-ghost text-[11px] py-1 px-2 mt-1 w-36"
          >
            ↓ PNG
          </button>
        )}
        {note && <p className="text-[10px] text-zinc-600 mt-1">{note}</p>}
      </div>
      <div className="flex-1 flex flex-col gap-2">
        <div className="text-[11px] uppercase tracking-wide text-zinc-500">Slide {index + 1}</div>
        <textarea
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={() => val !== text && saveDraft(draft.id, { slideText: { index, text: val } })}
          rows={3}
          className="resize-none bg-transparent text-sm outline-none"
        />
        {imagePrompt && <p className="text-[11px] text-zinc-600 italic">img: {imagePrompt}</p>}
      </div>
    </div>
  );
}

function defaultWhen(): string {
  const d = new Date(Date.now() + 864e5);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 09:00`;
}
