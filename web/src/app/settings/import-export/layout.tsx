import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata("インポート・エクスポート");

export default function ImportExportSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
