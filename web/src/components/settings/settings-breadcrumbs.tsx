import Link from "next/link";

type SettingsBreadcrumbsProps = {
  currentLabel: string;
};

export function SettingsBreadcrumbs({
  currentLabel,
}: SettingsBreadcrumbsProps) {
  return (
    <nav className="text-sm text-gray-500">
      <Link href="/" className="hover:underline">
        ホーム
      </Link>
      {" / "}
      {currentLabel === "設定" ? (
        <span className="text-gray-700">設定</span>
      ) : (
        <>
          <Link href="/settings" className="hover:underline">
            設定
          </Link>
          {" / "}
          <span className="text-gray-700">{currentLabel}</span>
        </>
      )}
    </nav>
  );
}
