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
    <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-7">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
        <div className="max-w-2xl space-y-3">
          <p className="text-sm font-medium tracking-wide text-gray-500">
            設定
          </p>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {title}
            </h1>
            <div className="text-sm leading-6 text-gray-600">{description}</div>
          </div>
        </div>

        {backHref ? (
          <Link
            href={backHref}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            {backLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
