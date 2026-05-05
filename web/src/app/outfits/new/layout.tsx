import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata("コーディネート登録");

export default function NewOutfitLayout({ children }: { children: ReactNode }) {
  return children;
}
