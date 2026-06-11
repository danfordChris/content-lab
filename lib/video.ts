import { svgUrlToPngBlob } from "./download";
import type { CarouselSlide } from "./types";

/**
 * Export the carousel slides as a vertical MP4 slideshow (H.264) with a slow
 * Ken-Burns zoom — shareable as a Reel / TikTok. Built fully client-side with
 * ffmpeg.wasm (single-threaded core, so no cross-origin-isolation headers needed).
 */
export async function exportCarouselMp4(
  slides: CarouselSlide[],
  filename: string,
  onProgress?: (msg: string) => void
): Promise<void> {
  const withImg = slides.filter((s) => s.imageUrl);
  if (!withImg.length) throw new Error("Generate the slides first");

  onProgress?.("Loading video engine (one-time, ~30MB)…");
  const [{ FFmpeg }, { fetchFile, toBlobURL }] = await Promise.all([
    import("@ffmpeg/ffmpeg"),
    import("@ffmpeg/util"),
  ]);
  const ffmpeg = new FFmpeg();
  const base = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
  });

  onProgress?.("Rendering slides…");
  let n = 0;
  for (const s of withImg) {
    const blob = s.imageUrl!.endsWith(".svg")
      ? (await svgUrlToPngBlob(s.imageUrl!)).blob
      : await (await fetch(s.imageUrl!)).blob();
    await ffmpeg.writeFile(`img${String(n + 1).padStart(3, "0")}.png`, await fetchFile(blob));
    n++;
  }

  onProgress?.("Encoding video…");
  const SECS = 2.6;
  const fps = 30;
  const frames = Math.round(SECS * fps);
  const input = ["-framerate", `1/${SECS}`, "-i", "img%03d.png"];
  const kenBurns =
    `zoompan=z='min(zoom+0.0006,1.09)':d=${frames}:` +
    `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1350:fps=${fps},format=yuv420p`;
  const enc = ["-r", String(fps), "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "out.mp4"];

  try {
    await ffmpeg.exec([...input, "-vf", kenBurns, ...enc]);
  } catch {
    // Fallback: plain slideshow if the zoom filter isn't available.
    await ffmpeg.exec([...input, "-vf", `scale=1080:1350,format=yuv420p`, ...enc]);
  }

  const data = (await ffmpeg.readFile("out.mp4")) as Uint8Array;
  const url = URL.createObjectURL(new Blob([data as unknown as BlobPart], { type: "video/mp4" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.mp4`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
