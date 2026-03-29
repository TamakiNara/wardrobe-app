import type { ReactNode } from "react";

type ItemFormPreviewPanelProps = {
  summary?: ReactNode;
  preview: ReactNode;
  imagesOverview?: ReactNode;
  className?: string;
  compact?: boolean;
  showHeader?: boolean;
};

export default function ItemFormPreviewPanel({
  summary,
  preview,
  imagesOverview,
  className = "",
  compact = false,
  showHeader = true,
}: ItemFormPreviewPanelProps) {
  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${compact ? "space-y-3 p-4" : "space-y-4 p-6"} ${className}`.trim()}
    >
      {showHeader && !compact ? (
        <div>
          <p className="text-sm font-medium text-gray-700">確認</p>
          <p className="mt-1 text-sm text-gray-500">
            選択中の色、SVG プレビュー、現在の画像をまとめて確認できます。
          </p>
        </div>
      ) : null}

      {summary}
      {preview}
      {imagesOverview}
    </section>
  );
}
