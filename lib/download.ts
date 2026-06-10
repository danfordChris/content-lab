// Client-side download helpers (call only from "use client" components).

export function triggerDownload(filename: string, url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function downloadText(filename: string, text: string, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  triggerDownload(filename, url);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Download a same-origin file (e.g. /generated/x.jpg) under a friendly name. */
export async function downloadFile(filename: string, srcUrl: string) {
  const res = await fetch(srcUrl);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  triggerDownload(filename, url);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Rasterize a (same-origin) SVG URL to a PNG Blob via canvas — so slides can be
 *  uploaded to LinkedIn/Instagram, which don't accept SVG. */
export async function svgUrlToPngBlob(url: string, size = 1080): Promise<Blob> {
  const svgText = await (await fetch(url)).text();
  const objUrl = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.width = size;
    img.height = size;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("svg load failed"));
      img.src = objUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, size, size);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png")
    );
  } finally {
    URL.revokeObjectURL(objUrl);
  }
}

/** Download an image URL as PNG (rasterizing SVGs); for raster URLs, download as-is. */
export async function downloadAsImage(url: string, baseName: string) {
  if (url.endsWith(".svg")) {
    const blob = await svgUrlToPngBlob(url);
    const u = URL.createObjectURL(blob);
    triggerDownload(`${baseName}.png`, u);
    setTimeout(() => URL.revokeObjectURL(u), 1500);
  } else {
    await downloadFile(`${baseName}.${url.split(".").pop() || "jpg"}`, url);
  }
}

export function slugify(s: string): string {
  const out = (s || "content")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return out || "content";
}

export function extFor(platform: string): string {
  return platform === "blog" ? "md" : "txt";
}
