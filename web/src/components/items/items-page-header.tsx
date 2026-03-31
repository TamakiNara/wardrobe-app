import type { ReactNode } from "react";
import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type ItemsPageHeaderProps = {
  breadcrumbs: BreadcrumbItem[];
  eyebrow: string;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
};

export function ItemsPageBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center gap-2">
          {index > 0 ? <span className="text-gray-300">/</span> : null}
          {item.href ? (
            <Link href={item.href} className="hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-700">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

export function ItemsPageHeader({
  breadcrumbs,
  eyebrow,
  title,
  description,
  actions,
}: ItemsPageHeaderProps) {
  return (
    <>
      <ItemsPageBreadcrumbs items={breadcrumbs} />
      <header className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-medium tracking-wide text-gray-500">
              {eyebrow}
            </p>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                {title}
              </h1>
              <div className="text-sm leading-6 text-gray-600">
                {description}
              </div>
            </div>
          </div>

          {actions ? (
            <div className="flex w-full flex-wrap items-center gap-3 md:w-auto md:justify-end md:self-center">
              {actions}
            </div>
          ) : null}
        </div>
      </header>
    </>
  );
}
