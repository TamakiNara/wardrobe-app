import Link from "next/link";

type SettingsBreadcrumbsProps = {
  currentLabel: string;
};

export function SettingsBreadcrumbs({
  currentLabel,
}: SettingsBreadcrumbsProps) {
  return (
    <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
      <Link href="/" className="hover:underline">
        ホーム
      </Link>
      <span className="text-gray-300">/</span>
      {currentLabel === "設定" ? (
        <span className="text-gray-700">設定</span>
      ) : (
        <>
          <Link href="/settings" className="hover:underline">
            設定
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-700">{currentLabel}</span>
        </>
      )}
    </nav>
  );
}
