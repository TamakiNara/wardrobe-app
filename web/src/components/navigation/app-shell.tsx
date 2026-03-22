"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import GlobalBottomNav from "@/components/navigation/global-bottom-nav";
import { shouldShowGlobalNav } from "@/lib/navigation/global-nav-items";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const showGlobalNav = shouldShowGlobalNav(pathname);

  return (
    <>
      <div
        className={
          showGlobalNav
            ? "min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))]"
            : undefined
        }
      >
        {children}
      </div>
      {showGlobalNav ? <GlobalBottomNav /> : null}
    </>
  );
}
