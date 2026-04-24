import { useId } from "react";
import {
  ITEM_THUMBNAIL_FRAME_HEIGHT,
  ITEM_THUMBNAIL_FRAME_RX,
  ITEM_THUMBNAIL_FRAME_WIDTH,
  ITEM_THUMBNAIL_FRAME_X,
  ITEM_THUMBNAIL_FRAME_Y,
  ITEM_THUMBNAIL_VIEWPORT_SIZE,
} from "@/components/items/item-thumbnail-frame";

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
const FRAME_X = ITEM_THUMBNAIL_FRAME_X;
const FRAME_Y = ITEM_THUMBNAIL_FRAME_Y;
const FRAME_WIDTH = ITEM_THUMBNAIL_FRAME_WIDTH;
const FRAME_HEIGHT = ITEM_THUMBNAIL_FRAME_HEIGHT;
const FRAME_RX = ITEM_THUMBNAIL_FRAME_RX;
const VIEWPORT_SIZE = ITEM_THUMBNAIL_VIEWPORT_SIZE;
const LEGACY_FRAME_Y = 18;
const LEGACY_FRAME_HEIGHT = 84;

const BOTTOMS_HEM_Y: Record<string, number> = {
  mini: 48,
  short: 56,
  half: 64,
  knee: 64,
  cropped: 78,
  midi: 78,
  mid_calf: 90,
  long: 96,
  full: 102,
  maxi: 102,
};

const SOCKS_START_Y: Record<string, number> = {
  foot_cover: 94,
  ankle_sneaker: 86,
  crew: 76,
  three_quarter: 58,
  high_socks: 40,
  loose_socks: 40,
  thigh_high_socks: 32,
  ankle_socks: 86,
  crew_socks: 76,
  knee_socks: 58,
  over_knee: 40,
};

const LEGGINGS_END_Y: Record<string, number> = {
  one_tenth: 42,
  three_tenths: 54,
  five_tenths: 66,
  seven_tenths: 74,
  seven_eighths: 88,
  ten_tenths: 102,
  twelve_tenths: 110,
  leggings_cropped: 74,
  leggings_full: 102,
};

function remapViewportY(
  value: number,
  frameMode: "standalone" | "viewport",
): number {
  if (frameMode === "standalone") {
    return (
      FRAME_Y +
      Math.round(
        ((value - LEGACY_FRAME_Y) / LEGACY_FRAME_HEIGHT) * FRAME_HEIGHT,
      )
    );
  }

  return ((value - LEGACY_FRAME_Y) / LEGACY_FRAME_HEIGHT) * VIEWPORT_SIZE;
}

function remapViewportOffset(
  value: number,
  frameMode: "standalone" | "viewport",
): number {
  if (frameMode === "standalone") {
    return Math.max(
      1,
      Math.round((value / LEGACY_FRAME_HEIGHT) * FRAME_HEIGHT),
    );
  }

  return (value / LEGACY_FRAME_HEIGHT) * VIEWPORT_SIZE;
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
      BOTTOMS_HEM_Y[lengthType] ?? BOTTOMS_HEM_Y.cropped,
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
          {hasLegwear ? (
            <LegwearOverlay
              coverageType={coverageType}
              mainColor={legwearColor}
              subColor={legwearSubColor}
              frameMode={frameMode}
              visibleFromY={hemY}
            />
          ) : null}
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

  if (coverageType === "full_length_fallback") {
    return (
      <rect
        data-testid="legwear-overlay"
        x={frameX}
        y={frameY}
        width={frameWidth}
        height={frameHeight}
        rx="0"
        fill={mainColor}
      />
    );
  }

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
