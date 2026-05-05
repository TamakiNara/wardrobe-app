import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata("アイテム編集");

export default function EditItemLayout({ children }: { children: ReactNode }) {
  return children;
}
