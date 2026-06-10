"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveSettings, previewBrandImageAction } from "@/app/actions";
import { DEFAULT_BRAND, type BrandSettings, type ImageStyle } from "@/lib/types";

const D = DEFAULT_BRAND;
const DI = DEFAULT_BRAND.imageStyle!;

export function SettingsForm({ initial }: { initial: BrandSettings }) {
  const [b, setB] = useState<BrandSettings>({
    audience: initial.audience ?? "",
    toneNotes: initial.toneNotes ?? "",
    customRules: initial.customRules ?? "",
    signature: initial.signature ?? "",
    imageStyle: { ...(initial.imageStyle ?? {}) },
  });
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  function set<K extends keyof BrandSettings>(k: K, v: BrandSettings[K]) {
    setB((p) => ({ ...p, [k]: v }));
    setSaved(false);
  }
  function setImg(k: keyof ImageStyle, v: string) {
    setB((p) => ({ ...p, imageStyle: { ...p.imageStyle, [k]: v } }));
    setSaved(false);
  }

  function save() {
    start(async () => {
      await saveSettings(b);
      setSaved(true);
      toast.success("Brand settings saved");
    });
  }
  function doPreview() {
    setNote(null);
    start(async () => {
      const r = await previewBrandImageAction(b);
      setPreview(r.url);
      setNote(
        r.placeholder
          ? r.error
            ? `Placeholder (image provider failed: ${r.error})`
            : "Placeholder — configure an image provider"
          : r.kind === "diagram"
            ? "Auto-built a labeled diagram ✓"
            : "Generated an image with your style ✓"
      );
      setSaved(true);
    });
  }

  const img = b.imageStyle ?? {};

  return (
    <div className="flex flex-col gap-5">
      {/* Brand voice */}
      <section className="card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-medium text-zinc-300">Brand voice (text)</h2>
        <Field label="Audience" hint="Who you write for">
          <input className="input" value={b.audience ?? ""} placeholder={D.audience}
            onChange={(e) => set("audience", e.target.value)} />
        </Field>
        <Field label="Tone notes" hint="Extra voice guidance the AI should follow">
          <textarea className="input" rows={2} value={b.toneNotes ?? ""}
            placeholder="e.g. confident, a bit witty, use analogies from real projects"
            onChange={(e) => set("toneNotes", e.target.value)} />
        </Field>
        <Field label="Custom rules" hint="Hard musts / nevers">
          <textarea className="input" rows={2} value={b.customRules ?? ""}
            placeholder="e.g. always include one code example; never use the word 'leverage'"
            onChange={(e) => set("customRules", e.target.value)} />
        </Field>
        <Field label="Signature" hint="How posts sign off">
          <input className="input" value={b.signature ?? ""} placeholder={D.signature}
            onChange={(e) => set("signature", e.target.value)} />
        </Field>
      </section>

      {/* Image style */}
      <section className="card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-medium text-zinc-300">Image style (carousels &amp; covers)</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <ColorField label="Primary color" value={img.primaryColor ?? ""} placeholder={DI.primaryColor}
            onChange={(v) => setImg("primaryColor", v)} />
          <ColorField label="Accent color" value={img.accentColor ?? ""} placeholder={DI.accentColor}
            onChange={(v) => setImg("accentColor", v)} />
          <ColorField label="Background" value={img.background ?? ""} placeholder={DI.background}
            onChange={(v) => setImg("background", v)} />
          <Field label="Font style">
            <input className="input" value={img.fontStyle ?? ""} placeholder={DI.fontStyle}
              onChange={(e) => setImg("fontStyle", e.target.value)} />
          </Field>
        </div>
        <Field label="Aesthetic" hint="Overall look & feel">
          <input className="input" value={img.aesthetic ?? ""} placeholder={DI.aesthetic}
            onChange={(e) => setImg("aesthetic", e.target.value)} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Mood">
            <input className="input" value={img.mood ?? ""} placeholder={DI.mood}
              onChange={(e) => setImg("mood", e.target.value)} />
          </Field>
          <Field label="Avoid" hint="Things to keep out">
            <input className="input" value={img.avoid ?? ""} placeholder={DI.avoid}
              onChange={(e) => setImg("avoid", e.target.value)} />
          </Field>
        </div>
        <Field label="Extra instructions" hint="Anything else for the image model">
          <textarea className="input" rows={2} value={img.extra ?? ""}
            placeholder="e.g. include subtle grid lines; isometric 3D objects; flat illustration"
            onChange={(e) => setImg("extra", e.target.value)} />
        </Field>

        <div className="flex items-center gap-2">
          <button onClick={doPreview} disabled={pending} className="btn btn-ghost text-sm">
            {pending ? "Working…" : "Preview image"}
          </button>
          <span className="text-xs text-zinc-500">Renders a sample slide with your style.</span>
        </div>
        {preview && (
          <div className="flex flex-col gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="brand preview" className="rounded-lg border border-[var(--border)] max-w-xs" />
            {note && <p className="text-xs text-zinc-500">{note}</p>}
          </div>
        )}
      </section>

      {/* Save bar */}
      <div className="flex items-center gap-3 sticky bottom-4">
        <button onClick={save} disabled={pending} className="btn btn-primary">
          {pending ? "Saving…" : "Save settings"}
        </button>
        {saved && <span className="text-xs text-emerald-400">Saved ✓ — applies to all new AI generations</span>}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-zinc-400">
        {label}
        {hint && <span className="text-zinc-600"> · {hint}</span>}
      </span>
      {children}
    </label>
  );
}

function ColorField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  // If the value looks like a hex, sync the color picker to it.
  const hex = /^#([0-9a-f]{6})/i.exec(value)?.[0] ?? "#34d399";
  return (
    <Field label={label} hint="hex or name">
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 rounded-md bg-transparent border border-[var(--border)] cursor-pointer"
          title="Pick a color"
        />
        <input className="input flex-1" value={value} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)} />
      </div>
    </Field>
  );
}
