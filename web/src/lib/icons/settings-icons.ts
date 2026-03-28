import type { LucideIcon } from "lucide-react";
import { ChevronDown, ChevronUp, SquarePen } from "lucide-react";

// settings 配下で使う操作系アイコンをまとめる。
// settings 外でも同じ組み合わせを使う画面が増えたら、共有置き場へ切り出す。
export const settingsActionIcons = {
  moveUp: ChevronUp,
  moveDown: ChevronDown,
  edit: SquarePen,
} satisfies Record<"moveUp" | "moveDown" | "edit", LucideIcon>;
