import { useRef } from "react";
import { Check, Download, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AUDIO_SOURCE_LABELS,
  FONT_SIZE_LABELS,
  POSITION_LABELS,
  STYLE_LABELS,
  type AudioSource,
  type FontSize,
  type TextOverlay,
  type TextPosition,
  type TextStyle,
} from "@/lib/builder-types";
import { cn } from "@/lib/utils";

interface ControlsPanelProps {
  topLoaded: boolean;
  bottomLoaded: boolean;
  onTopUpload: (file: File) => void;
  onBottomUpload: (file: File) => void;
  splitRatio: number;
  onSplitRatioChange: (value: number) => void;
  audioSource: AudioSource;
  onAudioSourceChange: (value: AudioSource) => void;
  bottomIsImage: boolean;
  text: TextOverlay;
  onTextChange: (text: TextOverlay) => void;
  canExport: boolean;
  isExporting: boolean;
  progress: number;
  onExport: () => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="section-label text-sm">{children}</h2>;
}

function UploadButton({
  loaded,
  label,
  accept,
  onUpload,
}: {
  loaded: boolean;
  label: string;
  accept: string;
  onUpload: (file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-semibold transition-colors",
          loaded
            ? "border-success bg-success text-success-foreground hover:bg-success/90"
            : "border-border bg-secondary text-secondary-foreground hover:border-primary hover:text-primary",
        )}
      >
        {loaded ? <Check className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
        {loaded ? `${label} loaded` : label}
      </button>
    </>
  );
}

export function ControlsPanel({
  topLoaded,
  bottomLoaded,
  onTopUpload,
  onBottomUpload,
  splitRatio,
  onSplitRatioChange,
  audioSource,
  onAudioSourceChange,
  bottomIsImage,
  text,
  onTextChange,
  canExport,
  isExporting,
  progress,
  onExport,
}: ControlsPanelProps) {
  const update = (patch: Partial<TextOverlay>) => onTextChange({ ...text, ...patch });

  return (
    <div className="flex w-full flex-col gap-8">
      {/* Media */}
      <section className="flex flex-col gap-4">
        <SectionLabel>Media</SectionLabel>
        <div className="flex flex-col gap-3">
          <UploadButton
            loaded={topLoaded}
            label="Top video"
            accept="video/*"
            onUpload={onTopUpload}
          />
          <UploadButton
            loaded={bottomLoaded}
            label="Bottom media"
            accept="video/*,image/*"
            onUpload={onBottomUpload}
          />
        </div>
      </section>

      {/* Split */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <SectionLabel>Split Position</SectionLabel>
          <span className="font-display text-sm font-semibold text-primary">
            {Math.round(splitRatio * 100)}% / {Math.round((1 - splitRatio) * 100)}%
          </span>
        </div>
        <Slider
          value={[splitRatio * 100]}
          min={20}
          max={80}
          step={1}
          onValueChange={(v) => onSplitRatioChange(v[0] / 100)}
        />
      </section>

      {/* Text overlay */}
      <section className="flex flex-col gap-4">
        <SectionLabel>Text Overlay</SectionLabel>

        <div className="flex flex-col gap-2">
          <Label htmlFor="overlay-text" className="text-xs text-muted-foreground">
            Text
          </Label>
          <Input
            id="overlay-text"
            value={text.value}
            placeholder="Add a caption…"
            onChange={(e) => update({ value: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Color</Label>
            <div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-2 py-1.5">
              <input
                type="color"
                value={text.color}
                onChange={(e) => update({ color: e.target.value })}
                className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
                aria-label="Text color"
              />
              <span className="font-mono text-xs uppercase text-muted-foreground">
                {text.color}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Font size</Label>
            <Select
              value={text.fontSize}
              onValueChange={(v) => update({ fontSize: v as FontSize })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_SIZE_LABELS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Position</Label>
            <Select
              value={text.position}
              onValueChange={(v) => update({ position: v as TextPosition })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POSITION_LABELS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Style</Label>
            <Select value={text.style} onValueChange={(v) => update({ style: v as TextStyle })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLE_LABELS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-md border border-border bg-secondary/40 p-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="bg-toggle" className="text-xs text-muted-foreground">
              Solid background
            </Label>
            <Switch
              id="bg-toggle"
              checked={text.background}
              onCheckedChange={(v) => update({ background: v })}
            />
          </div>
          {text.background && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-2 py-1.5">
              <input
                type="color"
                value={text.backgroundColor}
                onChange={(e) => update({ backgroundColor: e.target.value })}
                className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
                aria-label="Background color"
              />
              <span className="font-mono text-xs uppercase text-muted-foreground">
                {text.backgroundColor}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Export */}
      <section className="flex flex-col gap-3">
        <SectionLabel>Export</SectionLabel>
        {isExporting && (
          <div className="flex flex-col gap-2">
            <Progress value={progress * 100} />
            <span className="text-center text-xs text-muted-foreground">
              Rendering… {Math.round(progress * 100)}%
            </span>
          </div>
        )}
        <Button
          variant="export"
          size="lg"
          disabled={!canExport || isExporting}
          onClick={onExport}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Rendering MP4
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export 1080×1920 MP4
            </>
          )}
        </Button>
        {!canExport && !isExporting && (
          <p className="text-center text-xs text-muted-foreground">
            Load both slots to enable export
          </p>
        )}
      </section>
    </div>
  );
}
