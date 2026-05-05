import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata("設定");

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return children;
}
