import type { ReactNode } from "react";
import Link from "next/link";

type SettingsPageHeaderProps = {
  title: string;
  description: ReactNode;
  backHref?: string;
  backLabel?: string;
};

export function SettingsPageHeader({
  title,
  description,
  backHref,
  backLabel = "設定へ戻る",
}: SettingsPageHeaderProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-gray-500">設定</p>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 text-sm text-gray-600">{description}</p>
        </div>

        {backHref ? (
          <Link
            href={backHref}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            {backLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
