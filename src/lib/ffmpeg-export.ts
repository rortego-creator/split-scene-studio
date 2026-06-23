// Browser-only module. Lazy-imported from a client effect/handler — never at SSR module scope.
import {
  EXPORT_HEIGHT,
  EXPORT_WIDTH,
  FONT_SIZE_PX,
  MAX_DURATION,
  type AudioSource,
  type TextOverlay,
} from "./builder-types";

const CORE_BASE = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm";
const FONT_URL =
  "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/barlowcondensed/BarlowCondensed-Bold.ttf";
const FONT_FILE = "overlay.ttf";

let ffmpegPromise: Promise<import("@ffmpeg/ffmpeg").FFmpeg> | null = null;

async function getFFmpeg() {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const ffmpeg = new FFmpeg();
      // Vite bundles the FFmpeg worker as a module worker, so the core must be
      // an ESM module. Pass the URL directly (jsdelivr serves it with CORS) so
      // the worker resolves it via dynamic import().
      await ffmpeg.load({
        coreURL: `${CORE_BASE}/ffmpeg-core.js`,
        wasmURL: `${CORE_BASE}/ffmpeg-core.wasm`,
      });
      return ffmpeg;
    })();
  }
  return ffmpegPromise;
}

/** Escape a string for safe use inside a drawtext text='...' value. */
function escapeDrawText(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\u2019")
    .replace(/:/g, "\\:")
    .replace(/%/g, "\\%")
    .replace(/[\r\n]+/g, " ");
}

function buildDrawText(text: TextOverlay): string {
  const size = FONT_SIZE_PX[text.fontSize];
  const escaped = escapeDrawText(text.value.trim());

  let yExpr: string;
  if (text.position === "top") yExpr = "h*0.07";
  else if (text.position === "middle") yExpr = "(h-text_h)/2";
  else yExpr = "h*0.93-text_h";

  const parts = [
    `fontfile=${FONT_FILE}`,
    `text='${escaped}'`,
    `fontcolor=${text.color}`,
    `fontsize=${size}`,
    "x=(w-text_w)/2",
    `y=${yExpr}`,
  ];

  if (text.style === "outline") {
    parts.push("borderw=8", "bordercolor=black@1");
  } else if (text.style === "shadow") {
    parts.push("shadowcolor=black@0.85", "shadowx=5", "shadowy=5");
  }

  if (text.background) {
    parts.push("box=1", `boxcolor=${text.backgroundColor}`, "boxborderw=18");
  }

  return parts.join(":");
}

export interface ExportParams {
  topVideo: File;
  bottomMedia: File;
  bottomIsImage: boolean;
  /** Fraction (0.2 - 0.8) of the canvas occupied by the top video. */
  splitRatio: number;
  text: TextOverlay | null;
  /** Which input provides the audio track. */
  audioSource: AudioSource;
  onProgress?: (ratio: number) => void;
}

export async function exportSplitClip({
  topVideo,
  bottomMedia,
  bottomIsImage,
  splitRatio,
  text,
  audioSource,
  onProgress,
}: ExportParams): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import("@ffmpeg/util");

  const W = EXPORT_WIDTH;
  // Keep both halves even-numbered for h264.
  let topH = Math.round((EXPORT_HEIGHT * splitRatio) / 2) * 2;
  topH = Math.max(2, Math.min(EXPORT_HEIGHT - 2, topH));
  const bottomH = EXPORT_HEIGHT - topH;

  const progressHandler = ({ progress }: { progress: number }) => {
    if (onProgress) onProgress(Math.max(0, Math.min(1, progress)));
  };
  ffmpeg.on("progress", progressHandler);

  const topName = "top.mp4";
  const bottomName = bottomIsImage ? "bottom.img" : "bottom.mp4";
  const outName = "output.mp4";

  try {
    await ffmpeg.writeFile(topName, await fetchFile(topVideo));
    await ffmpeg.writeFile(bottomName, await fetchFile(bottomMedia));
    await ffmpeg.writeFile(FONT_FILE, await fetchFile(FONT_URL));

    const base =
      `[0:v]scale=${W}:${topH}:force_original_aspect_ratio=increase,` +
      `crop=${W}:${topH},setsar=1[top];` +
      `[1:v]scale=${W}:${bottomH}:force_original_aspect_ratio=increase,` +
      `crop=${W}:${bottomH},setsar=1[bot];` +
      `[top][bot]vstack=inputs=2`;

    const hasText = !!text && text.value.trim().length > 0;
    const filter = hasText
      ? `${base}[stk];[stk]drawtext=${buildDrawText(text!)}[outv]`
      : `${base}[outv]`;

    const args: string[] = ["-i", topName];
    if (bottomIsImage) args.push("-loop", "1");
    args.push("-i", bottomName);

    args.push("-filter_complex", filter, "-map", "[outv]");

    // Audio: "top" -> input 0, "bottom" -> input 1 (only if it's a video).
    // "none" or an image bottom results in a muted clip.
    const wantBottomAudio = audioSource === "bottom" && !bottomIsImage;
    if (audioSource === "top") {
      args.push("-map", "0:a?");
    } else if (wantBottomAudio) {
      args.push("-map", "1:a?");
    }

    args.push(
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-r",
      "30",
      "-t",
      String(MAX_DURATION),
      "-shortest",
      "-movflags",
      "+faststart",
      outName,
    );

    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(outName);
    const buffer = data instanceof Uint8Array ? data : new TextEncoder().encode(data as string);
    const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    return new Blob([ab], { type: "video/mp4" });
  } finally {
    ffmpeg.off("progress", progressHandler);
    await ffmpeg.deleteFile(topName).catch(() => {});
    await ffmpeg.deleteFile(bottomName).catch(() => {});
    await ffmpeg.deleteFile(outName).catch(() => {});
  }
}
