import type { ReactNode } from "react";

type ItemFormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export default function ItemFormSection({
  title,
  description,
  children,
  className = "",
}: ItemFormSectionProps) {
  return (
    <section
      className={`space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-start-1 ${className}`.trim()}
    >
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
