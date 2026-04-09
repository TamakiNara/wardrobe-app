import type { ReactNode } from "react";

type ItemClassificationGroupProps = {
  children: ReactNode;
  attributeSection?: ReactNode;
  attributePlaceholder?: ReactNode;
};

export default function ItemClassificationGroup({
  children,
  attributeSection,
  attributePlaceholder,
}: ItemClassificationGroupProps) {
  return (
    <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-start-1">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">分類</h2>
        <p className="mt-1 text-sm text-gray-500">
          カテゴリ・種類・形を決めると、現在の分類条件に応じた属性が続けて表示されます。
        </p>
      </div>

      <div className="space-y-4">{children}</div>

      <div className="space-y-4 pt-1">
        {attributeSection ?? attributePlaceholder ?? null}
      </div>
    </section>
  );
}
