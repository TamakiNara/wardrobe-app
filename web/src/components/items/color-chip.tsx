type ColorChipProps = {
  label: string;
  hex: string;
  tone?: "main" | "sub";
  supportingLabel?: string;
  showSupportingLabel?: boolean;
  showHex?: boolean;
};

export default function ColorChip({
  label,
  hex,
  tone = "main",
  supportingLabel,
  showSupportingLabel = true,
  showHex = true,
}: ColorChipProps) {
  return (
    <div
      className={`inline-flex min-w-0 items-center gap-3 rounded-2xl border px-3 py-2 ${
        tone === "main"
          ? "border-gray-300 bg-white text-gray-800"
          : "border-gray-200 bg-gray-50 text-gray-700"
      }`}
    >
      <span
        className="h-4 w-4 shrink-0 rounded-full border border-gray-300"
        style={{ backgroundColor: hex }}
      />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-gray-800">
          {label}
        </span>
        {showSupportingLabel || showHex ? (
          <span className="block text-xs text-gray-500">
            {showSupportingLabel
              ? (supportingLabel ??
                (tone === "main" ? "メインカラー" : "サブカラー"))
              : null}
            {showHex ? (
              <span
                className={`${showSupportingLabel ? "ml-2 " : ""}font-mono text-gray-400`}
              >
                {hex.toUpperCase()}
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
    </div>
  );
}
