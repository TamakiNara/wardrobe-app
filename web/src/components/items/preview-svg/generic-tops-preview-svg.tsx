type GenericTopsPreviewSvgProps = {
  shape: string;
  sleeve?: string;
  neck?: string;
  fit?: string;
  mainColor: string;
  subColor?: string;
};

type SleeveSide = {
  left: string;
  right: string;
};

const GENERIC_SLEEVE_PATHS: Record<string, SleeveSide> = {
  short: {
    left: "M106 74 L45 105 L74 148 L116 120 Z",
    right: "M194 74 L255 105 L226 148 L184 120 Z",
  },
  french: {
    left: "M100 76 L72 102 L96 142 L122 108 Z",
    right: "M200 76 L228 102 L204 142 L178 108 Z",
  },
  five: {
    left: "M94 76 Q70 92 58 196 L92 196 L98 160 L142 72 Z",
    right: "M206 76 Q230 92 242 196 L208 196 L202 160 L158 72 Z",
  },
  seven: {
    left: "M92 76 Q66 92 52 228 L84 228 L90 188 L144 68 Z",
    right: "M208 76 Q234 92 248 228 L216 228 L210 188 L156 68 Z",
  },
  long: {
    left: "M90 76 Q64 92 50 265 L80 265 L87 206 L144 66 Z",
    right: "M210 76 Q236 92 250 265 L220 265 L213 206 L156 66 Z",
  },
};

const GENERIC_TORSO_PATHS: Record<string, string> = {
  shirt: "M90 82 L118 70 L182 70 L210 82 L220 264 L210 270 H90 L80 264 Z",
  blouse: "M90 82 L118 70 L182 70 L210 82 L220 264 L210 270 H90 L80 264 Z",
  knit: "M104 74 Q120 60 150 60 Q180 60 196 74 L206 262 Q206 270 198 270 H102 Q94 270 94 262 Z",
  cardigan:
    "M110 74 Q126 60 150 60 Q174 60 190 74 L202 264 Q202 270 194 270 H106 Q98 270 98 264 Z",
  camisole:
    "M118 88 Q128 78 150 78 Q172 78 182 88 L190 262 Q190 270 184 270 H116 Q110 270 110 262 Z",
  tanktop:
    "M114 82 Q128 68 150 68 Q172 68 186 82 L196 262 Q196 270 188 270 H112 Q104 270 104 262 Z",
};

function resolveSleeveKey(sleeve?: string) {
  if (
    sleeve === "french" ||
    sleeve === "five" ||
    sleeve === "seven" ||
    sleeve === "long"
  ) {
    return sleeve;
  }

  return "short";
}

function SleevePair({ paths, fill }: { paths: SleeveSide; fill: string }) {
  return (
    <>
      <path fill={fill} d={paths.left} />
      <path fill={fill} d={paths.right} />
    </>
  );
}

function GenericSleeves({ sleeve, fill }: { sleeve?: string; fill: string }) {
  if (sleeve === "camisole" || sleeve === "sleeveless") {
    return null;
  }

  const sleeveKey = resolveSleeveKey(sleeve);

  return <SleevePair paths={GENERIC_SLEEVE_PATHS[sleeveKey]} fill={fill} />;
}

function GenericBody({ bodyPath, fill }: { bodyPath: string; fill: string }) {
  return <path fill={fill} d={bodyPath} />;
}

function ShirtCollar({
  mainColor,
  detailLineColor,
}: {
  mainColor: string;
  detailLineColor: string;
}) {
  return (
    <>
      <path
        d="M121 58 L179 58 L210 98 L90 98 Z"
        fill={mainColor}
        opacity="0.9"
      />
      <path
        d="M122 58 L150 74 L138 94 L110 75 Z"
        fill="none"
        stroke={detailLineColor}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M178 58 L150 74 L162 94 L190 75 Z"
        fill="none"
        stroke={detailLineColor}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

function CardiganDetails({ softHighlight }: { softHighlight: string }) {
  return (
    <>
      <path fill={softHighlight} d="M138 70 H162 V270 H138 Z" opacity="0.95" />
      <path
        fill={softHighlight}
        d="M118 72 Q134 88 138 118 V262 H110 Z"
        opacity="0.9"
      />
      <path
        fill={softHighlight}
        d="M182 72 Q166 88 162 118 V262 H190 Z"
        opacity="0.9"
      />
    </>
  );
}

function KnitDetails({ softHighlight }: { softHighlight: string }) {
  return (
    <>
      <path
        fill={softHighlight}
        d="M118 70 Q132 82 150 82 Q168 82 182 70 Q176 96 150 100 Q124 96 118 70 Z"
        opacity="0.95"
      />
      <path fill={softHighlight} d="M102 254 H198 V270 H102 Z" opacity="0.9" />
    </>
  );
}

function HemBand({ softHighlight }: { softHighlight: string }) {
  return (
    <path fill={softHighlight} d="M104 248 H196 V262 H104 Z" opacity="0.55" />
  );
}

function SoftBlouseNeck({
  softHighlight,
  softNeckPath,
}: {
  softHighlight: string;
  softNeckPath: string;
}) {
  return <path fill={softHighlight} d={softNeckPath} opacity="0.8" />;
}

function CamisoleStraps({
  mainColor,
  softHighlight,
}: {
  mainColor: string;
  softHighlight: string;
}) {
  return (
    <>
      <path
        fill={mainColor}
        d="M128 52 Q132 46 138 46 Q142 46 144 52 L140 88 H130 Z"
      />
      <path
        fill={mainColor}
        d="M172 52 Q168 46 162 46 Q158 46 156 52 L160 88 H170 Z"
      />
      <path
        fill={softHighlight}
        d="M126 88 Q136 100 150 100 Q164 100 174 88 Q168 118 150 122 Q132 118 126 88 Z"
        opacity="0.95"
      />
    </>
  );
}

function TanktopBinding({
  mainColor,
  softHighlight,
}: {
  mainColor: string;
  softHighlight: string;
}) {
  return (
    <>
      <path
        fill={softHighlight}
        d="M118 74 Q132 88 150 88 Q168 88 182 74 Q176 98 150 102 Q124 98 118 74 Z"
        opacity="0.95"
      />
      <path
        fill={mainColor}
        d="M114 82 Q124 92 132 114 L122 120 Q116 102 104 92 Z"
        opacity="0.25"
      />
      <path
        fill={mainColor}
        d="M186 82 Q176 92 168 114 L178 120 Q184 102 196 92 Z"
        opacity="0.25"
      />
    </>
  );
}

function ButtonColumn({
  mainColor,
  detailLineColor,
}: {
  mainColor: string;
  detailLineColor: string;
}) {
  return (
    <>
      <circle
        cx="150"
        cy="116"
        r="3.5"
        fill={mainColor}
        opacity="0.92"
        stroke={detailLineColor}
        strokeWidth="1.2"
      />
      <circle
        cx="150"
        cy="146"
        r="3.5"
        fill={mainColor}
        opacity="0.92"
        stroke={detailLineColor}
        strokeWidth="1.2"
      />
      <circle
        cx="150"
        cy="176"
        r="3.5"
        fill={mainColor}
        opacity="0.92"
        stroke={detailLineColor}
        strokeWidth="1.2"
      />
      <circle
        cx="150"
        cy="206"
        r="3.5"
        fill={mainColor}
        opacity="0.92"
        stroke={detailLineColor}
        strokeWidth="1.2"
      />
      <circle
        cx="150"
        cy="236"
        r="3.5"
        fill={mainColor}
        opacity="0.92"
        stroke={detailLineColor}
        strokeWidth="1.2"
      />
    </>
  );
}

function SubColorChip({ subColor }: { subColor: string }) {
  return (
    <circle
      cx="244"
      cy="56"
      r="14"
      fill={subColor}
      filter="url(#sub-color-chip-shadow)"
    />
  );
}

export default function GenericTopsPreviewSvg({
  shape,
  sleeve,
  neck,
  fit,
  mainColor,
  subColor,
}: GenericTopsPreviewSvgProps) {
  const isOversized = fit === "oversized";
  const scale = isOversized ? 1.06 : 1;
  const translateX = isOversized ? -9 : 0;
  const translateY = isOversized ? -2 : 0;

  const detailLineColor = "rgba(255,255,255,0.88)";
  const softHighlight = "#F8FAFC";
  const isCollaredBlouse = shape === "blouse" && neck === "collar";
  const visualShape = isCollaredBlouse ? "shirt" : shape;

  // 胴体のベース形状は shape ごとの外形パスから選ぶ
  const bodyPath =
    GENERIC_TORSO_PATHS[visualShape] ?? GENERIC_TORSO_PATHS.blouse;
  const showSleeves =
    visualShape === "shirt" ||
    visualShape === "blouse" ||
    visualShape === "knit" ||
    visualShape === "cardigan";
  const showButtons = visualShape === "shirt" || visualShape === "cardigan";
  const showHem = visualShape === "knit" || visualShape === "cardigan";
  const showShirtCollar = visualShape === "shirt";
  const showSoftNeck = shape === "blouse" && !isCollaredBlouse;
  const softNeckPath =
    neck === "v"
      ? "M126 78 Q136 84 150 84 Q164 84 174 78 Q166 92 150 98 Q134 92 126 78 Z"
      : "M126 78 Q136 84 150 84 Q164 84 174 78 Q168 90 150 92 Q132 90 126 78 Z";
  const showStraps = visualShape === "camisole";
  const showTankBinding = visualShape === "tanktop";

  return (
    <svg
      viewBox="0 0 300 300"
      className="h-24 w-24"
      aria-label={`${shape} silhouette`}
      role="img"
    >
      <defs>
        <filter
          id="sub-color-chip-shadow"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feDropShadow
            dx="0"
            dy="1.5"
            stdDeviation="1.5"
            floodColor="rgba(15,23,42,0.28)"
          />
        </filter>
      </defs>

      <g transform={`translate(${translateX} ${translateY}) scale(${scale})`}>
        {/* 袖 */}
        {showSleeves && <GenericSleeves sleeve={sleeve} fill={mainColor} />}

        {/* 胴体のベース */}
        <GenericBody bodyPath={bodyPath} fill={mainColor} />

        {/* 形状ごとの首元や前立て */}
        {showShirtCollar && (
          <ShirtCollar
            mainColor={mainColor}
            detailLineColor={detailLineColor}
          />
        )}
        {shape === "cardigan" && (
          <CardiganDetails softHighlight={softHighlight} />
        )}
        {shape === "knit" && <KnitDetails softHighlight={softHighlight} />}
        {showSoftNeck && (
          <SoftBlouseNeck
            softHighlight={softHighlight}
            softNeckPath={softNeckPath}
          />
        )}
        {showStraps && (
          <CamisoleStraps mainColor={mainColor} softHighlight={softHighlight} />
        )}
        {showTankBinding && (
          <TanktopBinding mainColor={mainColor} softHighlight={softHighlight} />
        )}

        {/* 共通の補足装飾 */}
        {showHem && <HemBand softHighlight={softHighlight} />}
        {showButtons && (
          <ButtonColumn
            mainColor={mainColor}
            detailLineColor={detailLineColor}
          />
        )}
        {subColor && <SubColorChip subColor={subColor} />}
      </g>
    </svg>
  );
}
