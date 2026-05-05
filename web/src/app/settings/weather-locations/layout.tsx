import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata("天気の地域設定");

export default function WeatherLocationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
