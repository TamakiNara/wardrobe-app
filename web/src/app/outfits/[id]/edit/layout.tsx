import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata("コーディネート編集");

export default function EditOutfitLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
