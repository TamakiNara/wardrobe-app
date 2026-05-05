import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata("天気登録");

export default function WearLogWeatherLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
