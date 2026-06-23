import { Film, ImageIcon } from "lucide-react";
import {
  FONT_SIZE_PX,
  PREVIEW_HEIGHT,
  PREVIEW_WIDTH,
  type TextOverlay,
} from "@/lib/builder-types";

interface PreviewPanelProps {
  topUrl: string | null;
  bottomUrl: string | null;
  bottomIsImage: boolean;
  splitRatio: number;
  text: TextOverlay;
}

const PREVIEW_SCALE = PREVIEW_WIDTH / 1080;

function overlayStyle(text: TextOverlay): React.CSSProperties {
  const fontSize = FONT_SIZE_PX[text.fontSize] * PREVIEW_SCALE;
  const base: React.CSSProperties = {
    color: text.color,
    fontSize: `${fontSize}px`,
    lineHeight: 1.05,
  };
  if (text.style === "outline") {
    base.WebkitTextStroke = `${Math.max(1, 8 * PREVIEW_SCALE)}px #000`;
    base.paintOrder = "stroke fill";
  } else if (text.style === "shadow") {
    base.textShadow = `${5 * PREVIEW_SCALE}px ${5 * PREVIEW_SCALE}px ${4 * PREVIEW_SCALE}px rgba(0,0,0,0.85)`;
  }
  return base;
}

function overlayPosition(text: TextOverlay): React.CSSProperties {
  if (text.position === "top") return { top: "7%" };
  if (text.position === "bottom") return { bottom: "7%" };
  return { top: "50%", transform: "translateY(-50%)" };
}

export function PreviewPanel({
  topUrl,
  bottomUrl,
  bottomIsImage,
  splitRatio,
  text,
}: PreviewPanelProps) {
  const showText = text.value.trim().length > 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative overflow-hidden rounded-xl border border-border shadow-2xl"
        style={{
          width: PREVIEW_WIDTH,
          height: PREVIEW_HEIGHT,
          backgroundColor: "#000",
        }}
      >
        {/* Top slot */}
        <div
          className="absolute inset-x-0 top-0 overflow-hidden"
          style={{ height: `${splitRatio * 100}%` }}
        >
          {topUrl ? (
            <video
              key={topUrl}
              src={topUrl}
              className="h-full w-full object-cover"
              muted
              loop
              autoPlay
              playsInline
            />
          ) : (
            <EmptySlot icon="video" label="Top video" />
          )}
        </div>

        {/* Bottom slot */}
        <div
          className="absolute inset-x-0 bottom-0 overflow-hidden"
          style={{ height: `${(1 - splitRatio) * 100}%` }}
        >
          {bottomUrl ? (
            bottomIsImage ? (
              <img src={bottomUrl} alt="Bottom media" className="h-full w-full object-cover" />
            ) : (
              <video
                key={bottomUrl}
                src={bottomUrl}
                className="h-full w-full object-cover"
                muted
                loop
                autoPlay
                playsInline
              />
            )
          ) : (
            <EmptySlot icon="image" label="Bottom video or image" />
          )}
        </div>

        {/* Divider */}
        <div
          className="absolute inset-x-0 z-10 bg-black"
          style={{ top: `${splitRatio * 100}%`, height: 2, transform: "translateY(-1px)" }}
        />

        {/* Text overlay */}
        {showText && (
          <div
            className="pointer-events-none absolute inset-x-0 z-20 px-2 text-center font-display font-bold uppercase"
            style={{ ...overlayPosition(text), ...overlayStyle(text) }}
          >
            {text.value}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        9:16 preview · exports at 1080×1920
      </p>
    </div>
  );
}

function EmptySlot({ icon, label }: { icon: "video" | "image"; label: string }) {
  const Icon = icon === "video" ? Film : ImageIcon;
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#0d0d0d] text-muted-foreground">
      <Icon className="h-8 w-8 opacity-60" />
      <span className="text-[10px] uppercase tracking-wider">{label}</span>
    </div>
  );
}
