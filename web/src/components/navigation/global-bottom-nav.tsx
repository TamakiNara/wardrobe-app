"use client";

import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  House,
  Settings,
  Shirt,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  findActiveGlobalNavItem,
  globalNavItems,
} from "@/lib/navigation/global-nav-items";

const navIcons: Record<string, LucideIcon> = {
  home: House,
  items: Shirt,
  outfits: Sparkles,
  "purchase-candidates": ShoppingBag,
  "wear-logs": CalendarDays,
  settings: Settings,
};

function iconClassName(active: boolean): string {
  return active ? "text-blue-600" : "text-gray-400";
}

export default function GlobalBottomNav() {
  const pathname = usePathname();
  const activeItem = findActiveGlobalNavItem(pathname);

  return (
    <nav
      aria-label="グローバルナビゲーション"
      className="fixed right-0 bottom-0 left-0 z-50"
    >
      <div className="mx-auto max-w-screen-sm px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className="grid h-16 grid-cols-6 rounded-2xl border border-gray-200 bg-white/95 p-1 shadow-lg shadow-gray-200/70 backdrop-blur">
          {globalNavItems.map((item) => {
            const isActive = activeItem?.key === item.key;
            const Icon = navIcons[item.key];

            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[11px] font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <Icon aria-hidden="true" className={`h-5 w-5 ${iconClassName(isActive)}`} strokeWidth={1.8} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
