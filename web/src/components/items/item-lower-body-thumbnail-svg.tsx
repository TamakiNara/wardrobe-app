import { useId } from "react";

type LowerBodyPreviewSvgProps = {
  category: "bottoms" | "legwear";
  lengthType?: string | null;
  coverageType?: string | null;
  mainColor?: string;
  subColor?: string;
  skinToneColor?: string;
};

const DEFAULT_SKIN_TONE = "#F1C7A6";
const DEFAULT_GARMENT_COLOR = "#CBD5E1";
const FRAME_X = 18;
const FRAME_Y = 18;
const FRAME_WIDTH = 84;
const FRAME_HEIGHT = 84;
const FRAME_RX = 18;

const BOTTOMS_HEM_Y: Record<string, number> = {
  mini: 48,
  knee: 62,
  midi: 74,
  ankle: 88,
  full: 102,
};

const SOCKS_START_Y: Record<string, number> = {
  ankle_socks: 86,
  crew_socks: 76,
  knee_socks: 58,
  over_knee: 40,
};

const LEGGINGS_END_Y: Record<string, number> = {
  leggings_cropped: 74,
  leggings_full: 102,
};

function PreviewFrame({
  children,
  skinToneColor,
}: {
  children: React.ReactNode;
  skinToneColor?: string;
}) {
  const clipPathId = useId().replace(/:/g, "");

  return (
    <>
      <defs>
        <clipPath id={clipPathId}>
          <rect
            x={FRAME_X}
            y={FRAME_Y}
            width={FRAME_WIDTH}
            height={FRAME_HEIGHT}
            rx={FRAME_RX}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipPathId})`}>
        <rect
          data-testid="lower-body-skin-base"
          x={FRAME_X}
          y={FRAME_Y}
          width={FRAME_WIDTH}
          height={FRAME_HEIGHT}
          rx={FRAME_RX}
          fill={skinToneColor ?? DEFAULT_SKIN_TONE}
        />
        {children}
      </g>
      <rect
        x={FRAME_X}
        y={FRAME_Y}
        width={FRAME_WIDTH}
        height={FRAME_HEIGHT}
        rx={FRAME_RX}
        fill="none"
        stroke="#D1D5DB"
      />
    </>
  );
}

export default function LowerBodyPreviewSvg({
  category,
  lengthType,
  coverageType,
  mainColor,
  subColor,
  skinToneColor,
}: LowerBodyPreviewSvgProps) {
  const primaryColor = mainColor ?? DEFAULT_GARMENT_COLOR;
  const accentColor = subColor ?? null;

  if (category === "bottoms" && lengthType) {
    const hemY = BOTTOMS_HEM_Y[lengthType] ?? BOTTOMS_HEM_Y.midi;

    return (
      <svg
        viewBox="0 0 120 120"
        className="h-full w-full"
        data-testid="lower-body-preview-svg"
        aria-label="ボトムスプレビュー"
      >
        <PreviewFrame skinToneColor={skinToneColor}>
          <rect
            data-testid="bottoms-garment"
            x={FRAME_X}
            y={FRAME_Y}
            width={FRAME_WIDTH}
            height={hemY - FRAME_Y}
            fill={primaryColor}
          />
          {accentColor ? (
            <rect
              x={FRAME_X}
              y={FRAME_Y + 12}
              width={FRAME_WIDTH}
              height="5"
              fill={accentColor}
            />
          ) : null}
          <line
            data-testid="bottoms-hem-marker"
            x1={FRAME_X}
            y1={hemY}
            x2={FRAME_X + FRAME_WIDTH}
            y2={hemY}
            stroke="transparent"
            strokeWidth="1"
          />
        </PreviewFrame>
      </svg>
    );
  }

  if (category === "legwear" && coverageType) {
    if (coverageType in SOCKS_START_Y) {
      const startY = SOCKS_START_Y[coverageType] ?? SOCKS_START_Y.crew_socks;

      return (
        <svg
          viewBox="0 0 120 120"
          className="h-full w-full"
          data-testid="lower-body-preview-svg"
          aria-label="レッグウェアプレビュー"
        >
          <PreviewFrame skinToneColor={skinToneColor}>
            <rect
              data-testid="legwear-overlay"
              x={FRAME_X}
              y={startY}
              width={FRAME_WIDTH}
              height={FRAME_Y + FRAME_HEIGHT - startY}
              rx="0"
              fill={primaryColor}
            />
            {accentColor ? (
              <rect
                x={FRAME_X}
                y={startY}
                width={FRAME_WIDTH}
                height="4"
                fill={accentColor}
              />
            ) : null}
          </PreviewFrame>
        </svg>
      );
    }

    if (coverageType in LEGGINGS_END_Y) {
      const endY = LEGGINGS_END_Y[coverageType] ?? LEGGINGS_END_Y.leggings_full;

      return (
        <svg
          viewBox="0 0 120 120"
          className="h-full w-full"
          data-testid="lower-body-preview-svg"
          aria-label="レッグウェアプレビュー"
        >
          <PreviewFrame skinToneColor={skinToneColor}>
            <rect
              data-testid="legwear-overlay"
              x={FRAME_X}
              y={FRAME_Y}
              width={FRAME_WIDTH}
              height={endY - FRAME_Y}
              rx="0"
              fill={primaryColor}
            />
            {accentColor ? (
              <rect
                x={FRAME_X}
                y={FRAME_Y + 14}
                width={FRAME_WIDTH}
                height="4"
                fill={accentColor}
              />
            ) : null}
          </PreviewFrame>
        </svg>
      );
    }

    if (coverageType === "stockings" || coverageType === "tights") {
      const overlayOpacity = coverageType === "stockings" ? 0.38 : 0.92;

      return (
        <svg
          viewBox="0 0 120 120"
          className="h-full w-full"
          data-testid="lower-body-preview-svg"
          aria-label="レッグウェアプレビュー"
        >
          <PreviewFrame skinToneColor={skinToneColor}>
            <rect
              data-testid="legwear-overlay"
              x={FRAME_X}
              y={FRAME_Y}
              width={FRAME_WIDTH}
              height={FRAME_HEIGHT}
              rx={FRAME_RX}
              fill={primaryColor}
              fillOpacity={overlayOpacity}
            />
            {accentColor ? (
              <rect
                x={FRAME_X}
                y={FRAME_Y + 14}
                width={FRAME_WIDTH}
                height="4"
                fill={accentColor}
                fillOpacity={overlayOpacity}
              />
            ) : null}
          </PreviewFrame>
        </svg>
      );
    }
  }

  return null;
}
