import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata("TPO設定");

export default function TpoSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
