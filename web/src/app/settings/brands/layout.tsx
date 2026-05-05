import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata("ブランド設定");

export default function BrandsSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
