import type { ReactNode } from "react";

type ItemClassificationGroupProps = {
  children: ReactNode;
  attributeSection?: ReactNode;
};

export default function ItemClassificationGroup({
  children,
  attributeSection,
}: ItemClassificationGroupProps) {
  return (
    <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-start-1">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">分類</h2>
      </div>

      <div className="space-y-4">{children}</div>

      {attributeSection ? (
        <div className="space-y-4 pt-1">{attributeSection}</div>
      ) : null}
    </section>
  );
}
