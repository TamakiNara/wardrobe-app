"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import GlobalBottomNav from "@/components/navigation/global-bottom-nav";
import { shouldShowGlobalNav } from "@/lib/navigation/global-nav-items";

type AppShellProps = {
  children: ReactNode;
  hasSession: boolean;
};

export default function AppShell({ children, hasSession }: AppShellProps) {
  const pathname = usePathname();
  const navEligible = shouldShowGlobalNav(pathname);
  const [isAuthenticated, setIsAuthenticated] = useState(hasSession);

  useEffect(() => {
    setIsAuthenticated(hasSession);
  }, [hasSession]);

  useEffect(() => {
    let active = true;

    if (!navEligible) {
      return () => {
        active = false;
      };
    }

    fetch("/api/auth/me", {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
    })
      .then((response) => {
        if (!active) return;
        setIsAuthenticated(response.ok);
      })
      .catch(() => {
        if (!active) return;
      });

    return () => {
      active = false;
    };
  }, [navEligible, pathname]);

  const showGlobalNav = navEligible && isAuthenticated;

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
