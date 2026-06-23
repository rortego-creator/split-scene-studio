import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { ControlsPanel } from "@/components/builder/ControlsPanel";
import { PreviewPanel } from "@/components/builder/PreviewPanel";
import { type TextOverlay } from "@/lib/builder-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SplitCut — 9:16 Split-Screen Clip Builder" },
      {
        name: "description",
        content:
          "Stack two videos, add broadcast-style text overlays, and export a 1080×1920 MP4 entirely in your browser. No upload, no server.",
      },
    ],
  }),
  component: Index,
});

const DEFAULT_TEXT: TextOverlay = {
  value: "",
  color: "#FFE000",
  fontSize: "large",
  position: "bottom",
  style: "outline",
  background: false,
  backgroundColor: "#000000",
};

function Index() {
  const [topFile, setTopFile] = useState<File | null>(null);
  const [bottomFile, setBottomFile] = useState<File | null>(null);
  const [topUrl, setTopUrl] = useState<string | null>(null);
  const [bottomUrl, setBottomUrl] = useState<string | null>(null);
  const [bottomIsImage, setBottomIsImage] = useState(false);

  const [splitRatio, setSplitRatio] = useState(0.5);
  const [text, setText] = useState<TextOverlay>(DEFAULT_TEXT);

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Manage object URL lifecycles.
  useEffect(() => {
    if (!topFile) return;
    const url = URL.createObjectURL(topFile);
    setTopUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [topFile]);

  useEffect(() => {
    if (!bottomFile) return;
    const url = URL.createObjectURL(bottomFile);
    setBottomUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [bottomFile]);

  const handleTopUpload = useCallback((file: File) => {
    if (!file.type.startsWith("video/")) {
      toast.error("Top slot needs a video file.");
      return;
    }
    setTopFile(file);
  }, []);

  const handleBottomUpload = useCallback((file: File) => {
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      toast.error("Bottom slot needs a video or image file.");
      return;
    }
    setBottomIsImage(isImage);
    setBottomFile(file);
  }, []);

  const canExport = !!topFile && !!bottomFile;

  const handleExport = useCallback(async () => {
    if (!topFile || !bottomFile) return;
    setIsExporting(true);
    setProgress(0);
    try {
      const { exportSplitClip } = await import("@/lib/ffmpeg-export");
      const blob = await exportSplitClip({
        topVideo: topFile,
        bottomMedia: bottomFile,
        bottomIsImage,
        splitRatio,
        text: text.value.trim() ? text : null,
        onProgress: (r) => setProgress(r),
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `splitcut-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Export complete — check your downloads.");
    } catch (err) {
      console.error(err);
      toast.error("Export failed. Try a shorter or smaller clip.");
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, [topFile, bottomFile, bottomIsImage, splitRatio, text]);

  return (
    <main className="min-h-screen bg-background">
      <Toaster theme="dark" position="top-center" />

      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary font-display text-lg font-bold text-primary-foreground">
            SC
          </div>
          <div>
            <h1 className="font-display text-xl font-bold uppercase tracking-wide">
              Split<span className="text-primary">Cut</span>
            </h1>
            <p className="text-xs text-muted-foreground">9:16 split-screen clip builder</p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[auto_1fr] lg:items-start">
        <div className="flex justify-center lg:sticky lg:top-10">
          <PreviewPanel
            topUrl={topUrl}
            bottomUrl={bottomUrl}
            bottomIsImage={bottomIsImage}
            splitRatio={splitRatio}
            text={text}
          />
        </div>

        <div className="rounded-xl border border-border bg-panel p-6">
          <ControlsPanel
            topLoaded={!!topFile}
            bottomLoaded={!!bottomFile}
            onTopUpload={handleTopUpload}
            onBottomUpload={handleBottomUpload}
            splitRatio={splitRatio}
            onSplitRatioChange={setSplitRatio}
            text={text}
            onTextChange={setText}
            canExport={canExport}
            isExporting={isExporting}
            progress={progress}
            onExport={handleExport}
          />
        </div>
      </div>
    </main>
  );
}
