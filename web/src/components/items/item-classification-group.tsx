import type { ReactNode } from "react";

type ItemClassificationGroupProps = {
  children: ReactNode;
  attributeSection?: ReactNode;
  className?: string;
};

export default function ItemClassificationGroup({
  children,
  attributeSection,
  className = "",
}: ItemClassificationGroupProps) {
  return (
    <section
      className={`space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${className}`.trim()}
    >
      <div>
        <h2 className="text-lg font-semibold text-gray-900">分類</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:items-start">{children}</div>

      {attributeSection ? (
        <div className="space-y-4 pt-1">{attributeSection}</div>
      ) : null}
    </section>
  );
}
