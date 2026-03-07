type ColorChipProps = {
  label: string;
  hex: string;
  tone?: "main" | "sub";
};

export default function ColorChip({
  label,
  hex,
  tone = "main",
}: ColorChipProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
        tone === "main"
          ? "border-gray-300 bg-white text-gray-800"
          : "border-gray-200 bg-gray-50 text-gray-700"
      }`}
    >
      <span
        className="h-4 w-4 rounded-full border border-gray-300"
        style={{ backgroundColor: hex }}
      />
      <span>{label}</span>
      <span className="text-xs text-gray-500">
        {tone === "main" ? "メイン" : "サブ"}
      </span>
      <span className="text-xs text-gray-400">{hex.toUpperCase()}</span>
    </div>
  );
}
