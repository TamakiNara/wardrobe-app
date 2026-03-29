type TshirtPreviewSvgProps = {
  mainColor: string;
  subColor?: string;
  sleeve?: string;
  design?: string;
  fit?: string;
};

type SleeveSide = {
  left: string;
  right: string;
};

const TSHIRT_BODY_PATH = `
  M 92 78
  Q 104 66 122 57
  L 178 57
  Q 196 66 208 78
  L 218 266
  Q 218 270 214 270
  L 86 270
  Q 82 270 82 266
  Z`;

const TSHIRT_NECK_BAND_PATH = `
  M 116 63
  Q 132 74 150 74
  Q 168 74 184 63
  Q 181 66 176 69
  Q 165 76 150 76
  Q 135 76 124 69
  Q 119 66 116 63
  Z`;

const STANDARD_SLEEVE_PATHS: Record<string, SleeveSide> = {
  short: {
    left: "M 112 54 Q 90 57 72 72 L 30 124 Q 25 130 31 135 L 83 160 Q 89 163 93 157 L 114 119 Q 119 110 127 104 L 138 96 L 138 58 Z",
    right:
      "M 188 54 Q 210 57 228 72 L 270 124 Q 275 130 269 135 L 217 160 Q 211 163 207 157 L 186 119 Q 181 110 173 104 L 162 96 L 162 58 Z",
  },
  french: {
    left: "M118 58 L78 84 L102 116 L130 98 Z",
    right: "M182 58 L222 84 L198 116 L170 98 Z",
  },
  five: {
    left: "M100 72 Q78 86 62 196 L96 196 L102 158 L138 84 Z",
    right: "M200 72 Q222 86 238 196 L204 196 L198 158 L162 84 Z",
  },
  seven: {
    left: "M96 72 Q74 88 58 228 L90 228 L98 184 L140 82 Z",
    right: "M204 72 Q226 88 242 228 L210 228 L202 184 L160 82 Z",
  },
  long: {
    left: "M90 76 Q64 92 50 265 L80 265 L87 206 L144 66 Z",
    right: "M210 76 Q236 92 250 265 L220 265 L213 206 L156 66 Z",
  },
};

const RAGLAN_SLEEVE_PATHS: Record<string, SleeveSide> = {
  short: {
    left: "M122 57 Q100 62 82 76 L44 126 L78 154 L102 144 L122 88 Z",
    right: "M178 57 Q200 62 218 76 L256 126 L222 154 L198 144 L178 88 Z",
  },
  french: {
    left: "M122 57 Q102 62 90 76 L98 108 L126 92 Z",
    right: "M178 57 Q198 62 210 76 L202 108 L174 92 Z",
  },
  five: {
    left: "M122 57 Q96 66 76 84 L60 196 L92 196 L102 150 L126 88 Z",
    right: "M178 57 Q204 66 224 84 L240 196 L208 196 L198 150 L174 88 Z",
  },
  seven: {
    left: "M122 57 Q96 66 72 86 L56 228 L88 228 L98 178 L128 88 Z",
    right: "M178 57 Q204 66 228 86 L244 228 L212 228 L202 178 L172 88 Z",
  },
  long: {
    left: "M112 60 Q92 68 64 86 L40 265 L70 265 L85 166 L112 72 Z",
    right: "M188 60 Q208 68 236 86 L260 265 L230 265 L215 166 L188 72 Z",
  },
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

function TshirtBody({ fill }: { fill: string }) {
  return <path fill={fill} d={TSHIRT_BODY_PATH} />;
}

function TshirtNeckBand() {
  return <path fill="#F8FAFC" d={TSHIRT_NECK_BAND_PATH} />;
}

function SleevePair({ paths, fill }: { paths: SleeveSide; fill: string }) {
  return (
    <>
      <path fill={fill} d={paths.left} />
      <path fill={fill} d={paths.right} />
    </>
  );
}

function SubColorChip({ subColor }: { subColor: string }) {
  return (
    <circle
      cx="244"
      cy="54"
      r="16"
      fill={subColor}
      stroke="#334155"
      strokeWidth="6"
    />
  );
}

export default function TshirtPreviewSvg({
  mainColor,
  subColor,
  sleeve,
  design,
  fit,
}: TshirtPreviewSvgProps) {
  const isRaglan = design === "raglan";
  const isOversized = fit === "oversized";

  const bodyColor = mainColor;
  const sleeveColor = isRaglan ? (subColor ?? "#CBD5E1") : mainColor;

  const scale = isOversized ? 1.06 : 1;
  const translateX = isOversized ? -9 : 0;
  const translateY = isOversized ? -2 : 0;

  const showDotChip = Boolean(subColor) && !isRaglan;
  const isSleevelessLike = sleeve === "sleeveless" || sleeve === "camisole";
  const sleeveKey = resolveSleeveKey(sleeve);
  const standardSleeve = STANDARD_SLEEVE_PATHS[sleeveKey];
  const raglanSleeve = RAGLAN_SLEEVE_PATHS[sleeveKey];

  return (
    <svg
      viewBox="0 0 300 300"
      className="h-24 w-24"
      aria-label="crew neck short sleeve t-shirt silhouette"
      role="img"
    >
      <g transform={`translate(${translateX} ${translateY}) scale(${scale})`}>
        {!isRaglan ? (
          <>
            {/* 胴体 */}
            <TshirtBody fill={bodyColor} />

            {/* 袖 */}
            {!isSleevelessLike && (
              <SleevePair paths={standardSleeve} fill={bodyColor} />
            )}
          </>
        ) : (
          <>
            {/* ラグラン胴体 */}
            <TshirtBody fill={bodyColor} />

            {/* ラグラン袖 */}
            {!isSleevelessLike && (
              <SleevePair paths={raglanSleeve} fill={sleeveColor} />
            )}
          </>
        )}

        {/* ネックライン */}
        <TshirtNeckBand />

        {/* 本体で使わないときのサブカラーチップ */}
        {showDotChip && subColor && <SubColorChip subColor={subColor} />}
      </g>
    </svg>
  );
}
