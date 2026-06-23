export type FontSize = "small" | "medium" | "large" | "xl";
export type TextPosition = "top" | "middle" | "bottom";
export type TextStyle = "outline" | "shadow" | "plain";

export interface TextOverlay {
  value: string;
  color: string;
  fontSize: FontSize;
  position: TextPosition;
  style: TextStyle;
}

export const EXPORT_WIDTH = 1080;
export const EXPORT_HEIGHT = 1920;
export const PREVIEW_WIDTH = 270;
export const PREVIEW_HEIGHT = 480;
export const MAX_DURATION = 60;

/** Export font sizes in px relative to the 1080px-wide canvas. */
export const FONT_SIZE_PX: Record<FontSize, number> = {
  small: 48,
  medium: 72,
  large: 104,
  xl: 152,
};

export const FONT_SIZE_LABELS: { value: FontSize; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "xl", label: "XL" },
];

export const POSITION_LABELS: { value: TextPosition; label: string }[] = [
  { value: "top", label: "Top" },
  { value: "middle", label: "Middle" },
  { value: "bottom", label: "Bottom" },
];

export const STYLE_LABELS: { value: TextStyle; label: string }[] = [
  { value: "outline", label: "Bold + Outline" },
  { value: "shadow", label: "Bold + Shadow" },
  { value: "plain", label: "Plain" },
];
