type TshirtPreviewSvgProps = {
  mainColor: string;
  subColor?: string;
  sleeve?: string;
  design?: string;
  fit?: string;
};

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
  const sleeveColor = isRaglan ? subColor ?? "#CBD5E1" : mainColor;

  const scale = isOversized ? 1.06 : 1;
  const translateX = isOversized ? -9 : 0;
  const translateY = isOversized ? -2 : 0;

  const showDotChip = Boolean(subColor) && !isRaglan;

  const isSleevelessLike =
    sleeve === "sleeveless" || sleeve === "camisole" || sleeve === "french";

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
            <g fill={bodyColor}>
              {/* torso */}
              <path
                d="
                  M 82 78
                  Q 82 69 89 63
                  Q 98 56 112 54
                  L 188 54
                  Q 202 56 211 63
                  Q 218 69 218 78
                  L 218 266
                  Q 218 270 214 270
                  L 86 270
                  Q 82 270 82 266
                  Z"
              />

              {/* left sleeve */}
              {!isSleevelessLike && (
                <path
                  d="
                    M 112 54
                    Q 90 57 72 72
                    L 30 124
                    Q 25 130 31 135
                    L 83 160
                    Q 89 163 93 157
                    L 114 119
                    Q 119 110 127 104
                    L 138 96
                    L 138 58
                    Z"
                />
              )}

              {/* right sleeve */}
              {!isSleevelessLike && (
                <path
                  d="
                    M 188 54
                    Q 210 57 228 72
                    L 270 124
                    Q 275 130 269 135
                    L 217 160
                    Q 211 163 207 157
                    L 186 119
                    Q 181 110 173 104
                    L 162 96
                    L 162 58
                    Z"
                />
              )}
            </g>
          </>
        ) : (
          <>
            {/* raglan: torso */}
            <path
              fill={bodyColor}
              d="
                M 82 78
                Q 82 69 89 63
                Q 98 56 112 54
                L 188 54
                Q 202 56 211 63
                Q 218 69 218 78
                L 218 266
                Q 218 270 214 270
                L 86 270
                Q 82 270 82 266
                Z"
            />

            {/* raglan sleeves */}
            {!isSleevelessLike && (
              <>
                <path
                  fill={sleeveColor}
                  d="
                    M 112 54
                    Q 90 57 72 72
                    L 30 124
                    Q 25 130 31 135
                    L 83 160
                    Q 89 163 93 157
                    L 114 119
                    Q 119 110 127 104
                    L 138 96
                    L 138 58
                    Z"
                />
                <path
                  fill={sleeveColor}
                  d="
                    M 188 54
                    Q 210 57 228 72
                    L 270 124
                    Q 275 130 269 135
                    L 217 160
                    Q 211 163 207 157
                    L 186 119
                    Q 181 110 173 104
                    L 162 96
                    L 162 58
                    Z"
                />
              </>
            )}
          </>
        )}

        {/* neckline band */}
        <path
          fill="#F8FAFC"
          d="
            M 116 63
            Q 132 74 150 74
            Q 168 74 184 63
            Q 181 66 176 69
            Q 165 76 150 76
            Q 135 76 124 69
            Q 119 66 116 63
            Z"
        />

        {/* sub color chip when not used in the body */}
        {showDotChip && (
          <circle
            cx="236"
            cy="238"
            r="14"
            fill={subColor}
            stroke="#334155"
            strokeWidth="6"
          />
        )}
      </g>
    </svg>
  );
}
