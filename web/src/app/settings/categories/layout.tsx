import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata("カテゴリ表示設定");

export default function CategorySettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
