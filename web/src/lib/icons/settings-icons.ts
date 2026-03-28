import type { LucideIcon } from "lucide-react";
import { ChevronDown, ChevronUp, SquarePen } from "lucide-react";

export const settingsActionIcons = {
  moveUp: ChevronUp,
  moveDown: ChevronDown,
  edit: SquarePen,
} satisfies Record<"moveUp" | "moveDown" | "edit", LucideIcon>;
