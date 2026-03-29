import { useId } from "react";

type LowerBodyPreviewSvgProps = {
  lengthType?: string | null;
  coverageType?: string | null;
  bottomsMainColor?: string | null;
  bottomsSubColor?: string | null;
  legwearMainColor?: string | null;
  legwearSubColor?: string | null;
  skinToneColor?: string;
  ariaLabel?: string;
  frameMode?: "standalone" | "viewport";
  preserveAspectRatio?: string;
};

const DEFAULT_SKIN_TONE = "#F1C7A6";
const DEFAULT_GARMENT_COLOR = "#CBD5E1";
const FRAME_X = 18;
const FRAME_Y = 18;
const FRAME_WIDTH = 84;
const FRAME_HEIGHT = 84;
const FRAME_RX = 18;
const VIEWPORT_SIZE = 120;

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

function remapViewportY(
  value: number,
  frameMode: "standalone" | "viewport",
): number {
  if (frameMode === "standalone") {
    return value;
  }

  return ((value - FRAME_Y) / FRAME_HEIGHT) * VIEWPORT_SIZE;
}

function remapViewportOffset(
  value: number,
  frameMode: "standalone" | "viewport",
): number {
  if (frameMode === "standalone") {
    return value;
  }

  return (value / FRAME_HEIGHT) * VIEWPORT_SIZE;
}

function PreviewFrame({
  children,
  skinToneColor,
  frameMode,
}: {
  children: React.ReactNode;
  skinToneColor?: string;
  frameMode: "standalone" | "viewport";
}) {
  const clipPathId = useId().replace(/:/g, "");
  const frameX = frameMode === "viewport" ? 0 : FRAME_X;
  const frameY = frameMode === "viewport" ? 0 : FRAME_Y;
  const frameWidth = frameMode === "viewport" ? 120 : FRAME_WIDTH;
  const frameHeight = frameMode === "viewport" ? 120 : FRAME_HEIGHT;
  const frameRx = frameMode === "viewport" ? 0 : FRAME_RX;

  return (
    <>
      <defs>
        <clipPath id={clipPathId}>
          <rect
            x={frameX}
            y={frameY}
            width={frameWidth}
            height={frameHeight}
            rx={frameRx}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipPathId})`}>
        <rect
          data-testid="lower-body-skin-base"
          x={frameX}
          y={frameY}
          width={frameWidth}
          height={frameHeight}
          rx={frameRx}
          fill={skinToneColor ?? DEFAULT_SKIN_TONE}
        />
        {children}
      </g>
      {frameMode === "standalone" ? (
        <rect
          x={FRAME_X}
          y={FRAME_Y}
          width={FRAME_WIDTH}
          height={FRAME_HEIGHT}
          rx={FRAME_RX}
          fill="none"
          stroke="#D1D5DB"
        />
      ) : null}
    </>
  );
}

export default function LowerBodyPreviewSvg({
  lengthType,
  coverageType,
  bottomsMainColor,
  bottomsSubColor,
  legwearMainColor,
  legwearSubColor,
  skinToneColor,
  ariaLabel = "下半身プレビュー",
  frameMode = "standalone",
  preserveAspectRatio = "xMidYMid meet",
}: LowerBodyPreviewSvgProps) {
  const bottomsColor = bottomsMainColor ?? DEFAULT_GARMENT_COLOR;
  const legwearColor = legwearMainColor ?? DEFAULT_GARMENT_COLOR;
  const hasBottoms = Boolean(lengthType);
  const hasLegwear = Boolean(coverageType);
  const frameX = frameMode === "viewport" ? 0 : FRAME_X;
  const frameY = frameMode === "viewport" ? 0 : FRAME_Y;
  const frameWidth = frameMode === "viewport" ? 120 : FRAME_WIDTH;

  if (hasBottoms && lengthType) {
    const hemY = remapViewportY(
      BOTTOMS_HEM_Y[lengthType] ?? BOTTOMS_HEM_Y.midi,
      frameMode,
    );

    return (
      <svg
        viewBox="0 0 120 120"
        className="h-full w-full"
        data-testid="lower-body-preview-svg"
        aria-label={ariaLabel}
        preserveAspectRatio={preserveAspectRatio}
      >
        <PreviewFrame skinToneColor={skinToneColor} frameMode={frameMode}>
          <rect
            data-testid="bottoms-garment"
            x={frameX}
            y={frameY}
            width={frameWidth}
            height={hemY - frameY}
            fill={bottomsColor}
          />
          {bottomsSubColor && !hasLegwear ? (
            <rect
              x={frameX}
              y={frameY + remapViewportOffset(12, frameMode)}
              width={frameWidth}
              height={remapViewportOffset(5, frameMode)}
              fill={bottomsSubColor}
            />
          ) : null}
          {hasLegwear ? null : (
            <line
              data-testid="bottoms-hem-marker"
              x1={frameX}
              y1={hemY}
              x2={frameX + frameWidth}
              y2={hemY}
              stroke="transparent"
              strokeWidth="1"
            />
          )}
          {hasLegwear ? (
            <LegwearOverlay
              coverageType={coverageType}
              mainColor={legwearColor}
              subColor={legwearSubColor}
              frameMode={frameMode}
              visibleFromY={hemY}
            />
          ) : null}
        </PreviewFrame>
      </svg>
    );
  }

  if (hasLegwear && coverageType) {
    return (
      <svg
        viewBox="0 0 120 120"
        className="h-full w-full"
        data-testid="lower-body-preview-svg"
        aria-label={ariaLabel}
        preserveAspectRatio={preserveAspectRatio}
      >
        <PreviewFrame skinToneColor={skinToneColor} frameMode={frameMode}>
          <LegwearOverlay
            coverageType={coverageType}
            mainColor={legwearColor}
            subColor={legwearSubColor}
            frameMode={frameMode}
            visibleFromY={null}
          />
        </PreviewFrame>
      </svg>
    );
  }

  return null;
}

function LegwearOverlay({
  coverageType,
  mainColor,
  subColor,
  frameMode,
  visibleFromY,
}: {
  coverageType?: string | null;
  mainColor: string;
  subColor?: string | null;
  frameMode: "standalone" | "viewport";
  visibleFromY?: number | null;
}) {
  if (!coverageType) {
    return null;
  }

  const accentColor = subColor ?? mainColor;
  const frameX = frameMode === "viewport" ? 0 : FRAME_X;
  const frameY = frameMode === "viewport" ? 0 : FRAME_Y;
  const frameWidth = frameMode === "viewport" ? 120 : FRAME_WIDTH;
  const frameHeight = frameMode === "viewport" ? 120 : FRAME_HEIGHT;
  const frameRx = frameMode === "viewport" ? 0 : FRAME_RX;
  const boundaryInset =
    visibleFromY === null || visibleFromY === undefined
      ? 0
      : Math.max(remapViewportOffset(1, frameMode), 1);

  if (coverageType in SOCKS_START_Y) {
    const startY = remapViewportY(
      SOCKS_START_Y[coverageType] ?? SOCKS_START_Y.crew_socks,
      frameMode,
    );
    const overlayStartY =
      visibleFromY === null || visibleFromY === undefined
        ? startY
        : Math.max(startY, visibleFromY + boundaryInset);

    return (
      <>
        <rect
          data-testid="legwear-overlay"
          x={frameX}
          y={overlayStartY}
          width={frameWidth}
          height={frameY + frameHeight - overlayStartY}
          rx="0"
          fill={mainColor}
        />
        <rect
          x={frameX}
          y={overlayStartY}
          width={frameWidth}
          height={remapViewportOffset(4, frameMode)}
          fill={accentColor}
        />
      </>
    );
  }

  if (coverageType in LEGGINGS_END_Y) {
    const endY = remapViewportY(
      LEGGINGS_END_Y[coverageType] ?? LEGGINGS_END_Y.leggings_full,
      frameMode,
    );
    const overlayStartY =
      visibleFromY === null || visibleFromY === undefined
        ? frameY
        : visibleFromY + boundaryInset;
    const overlayHeight = Math.max(endY - overlayStartY, 0);

    return (
      <>
        <rect
          data-testid="legwear-overlay"
          x={frameX}
          y={overlayStartY}
          width={frameWidth}
          height={overlayHeight}
          rx="0"
          fill={mainColor}
        />
        <rect
          x={frameX}
          y={overlayStartY + remapViewportOffset(14, frameMode)}
          width={frameWidth}
          height={remapViewportOffset(4, frameMode)}
          fill={accentColor}
        />
      </>
    );
  }

  if (coverageType === "stockings" || coverageType === "tights") {
    const overlayOpacity = coverageType === "stockings" ? 0.38 : 0.92;
    const overlayStartY =
      visibleFromY === null || visibleFromY === undefined
        ? frameY
        : visibleFromY + boundaryInset;
    const overlayHeight = Math.max(frameY + frameHeight - overlayStartY, 0);

    return (
      <>
        <rect
          data-testid="legwear-overlay"
          x={frameX}
          y={overlayStartY}
          width={frameWidth}
          height={overlayHeight}
          rx={frameRx}
          fill={mainColor}
          fillOpacity={overlayOpacity}
        />
        {subColor ? (
          <rect
            x={frameX}
            y={overlayStartY + remapViewportOffset(14, frameMode)}
            width={frameWidth}
            height={remapViewportOffset(4, frameMode)}
            fill={subColor}
            fillOpacity={overlayOpacity}
          />
        ) : null}
      </>
    );
  }

  return null;
}
