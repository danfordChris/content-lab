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
    socials: { ...(initial.socials ?? {}) },
    notifyEmail: initial.notifyEmail ?? "",
    displayName: initial.displayName ?? "",
    role: initial.role ?? "",
    avatarUrl: initial.avatarUrl ?? "",
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
  function setSocial(k: "instagram" | "tiktok" | "x", v: string) {
    setB((p) => ({ ...p, socials: { ...p.socials, [k]: v.replace(/^@/, "") } }));
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

      {/* Carousel identity */}
      <section className="card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-medium text-zinc-300">Carousel identity</h2>
        <p className="text-xs text-zinc-500 -mt-2">
          Shown in the header of every carousel slide and on the closing page.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Display name">
            <input className="input" value={b.displayName ?? ""} placeholder={D.displayName}
              onChange={(e) => set("displayName", e.target.value)} />
          </Field>
          <Field label="Role / tagline">
            <input className="input" value={b.role ?? ""} placeholder={D.role}
              onChange={(e) => set("role", e.target.value)} />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Logo image URL" hint="top-left brand mark; blank = <DanfordChris/> wordmark">
            <input className="input" value={b.logoUrl ?? ""} placeholder="https://…/logo.png"
              onChange={(e) => set("logoUrl", e.target.value)} />
          </Field>
          <Field label="Avatar image URL" hint="square photo; blank = monogram circle">
            <input className="input" value={b.avatarUrl ?? ""} placeholder="https://…/me.jpg"
              onChange={(e) => set("avatarUrl", e.target.value)} />
          </Field>
        </div>
      </section>

      {/* Socials + notifications */}
      <section className="card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-medium text-zinc-300">Social handles &amp; notifications</h2>
        <p className="text-xs text-zinc-500 -mt-2">
          The handles appear on every carousel's closing slide. The email receives your posting reminders.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Instagram">
            <HandleInput value={b.socials?.instagram ?? ""} onChange={(v) => setSocial("instagram", v)} />
          </Field>
          <Field label="TikTok">
            <HandleInput value={b.socials?.tiktok ?? ""} onChange={(v) => setSocial("tiktok", v)} />
          </Field>
          <Field label="X / Twitter">
            <HandleInput value={b.socials?.x ?? ""} onChange={(v) => setSocial("x", v)} />
          </Field>
        </div>
        <Field label="Notification email" hint="defaults to your login email">
          <input
            className="input"
            type="email"
            value={b.notifyEmail ?? ""}
            placeholder="you@example.com"
            onChange={(e) => set("notifyEmail", e.target.value)}
          />
        </Field>
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

function HandleInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-zinc-500 mono">@</span>
      <input
        className="input flex-1"
        value={value}
        placeholder="codewithdanfordchris"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
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
