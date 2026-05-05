import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata("アイテム登録");

export default function NewItemLayout({ children }: { children: ReactNode }) {
  return children;
}
