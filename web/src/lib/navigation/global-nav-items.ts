export type GlobalNavItem = {
  key: "home" | "items" | "outfits" | "purchase-candidates" | "settings";
  label: string;
  href: string;
  matches: (pathname: string) => boolean;
};

function isExactPath(pathname: string, expected: string): boolean {
  return pathname === expected;
}

function isNestedPath(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export const globalNavItems: GlobalNavItem[] = [
  {
    key: "home",
    label: "ホーム",
    href: "/",
    matches: (pathname) => isExactPath(pathname, "/"),
  },
  {
    key: "items",
    label: "アイテム",
    href: "/items",
    matches: (pathname) => isNestedPath(pathname, "/items"),
  },
  {
    key: "outfits",
    label: "コーディネート",
    href: "/outfits",
    matches: (pathname) => isNestedPath(pathname, "/outfits"),
  },
  {
    key: "purchase-candidates",
    label: "購入候補",
    href: "/purchase-candidates",
    matches: (pathname) => isNestedPath(pathname, "/purchase-candidates"),
  },
  {
    key: "settings",
    label: "設定",
    href: "/settings",
    matches: (pathname) => isNestedPath(pathname, "/settings"),
  },
];

export function shouldShowGlobalNav(pathname: string): boolean {
  return (
    globalNavItems.some((item) => item.matches(pathname)) ||
    isNestedPath(pathname, "/wear-logs")
  );
}

export function findActiveGlobalNavItem(pathname: string): GlobalNavItem | null {
  return globalNavItems.find((item) => item.matches(pathname)) ?? null;
}
