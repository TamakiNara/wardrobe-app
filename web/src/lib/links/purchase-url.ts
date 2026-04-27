export type PurchaseUrlLabelOptions = {
  fallbackLabel?: string;
};

const PURCHASE_URL_SITE_LABELS: Array<{
  hosts: string[];
  label: string;
}> = [
  {
    hosts: ["rakuten.co.jp", "item.rakuten.co.jp"],
    label: "楽天市場",
  },
  {
    hosts: ["zozo.jp"],
    label: "ZOZOTOWN",
  },
  {
    hosts: ["uniqlo.com"],
    label: "UNIQLO",
  },
  {
    hosts: ["gu-global.com"],
    label: "GU",
  },
];

function normalizeUrlHost(hostname: string): string {
  return hostname
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
}

function tryParsePurchaseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

export function resolvePurchaseUrlDisplayLabel(
  url: string,
  options: PurchaseUrlLabelOptions = {},
): string {
  const parsedUrl = tryParsePurchaseUrl(url);
  const fallbackLabel = options.fallbackLabel ?? "商品ページ";

  if (!parsedUrl) {
    return fallbackLabel;
  }

  const normalizedHost = normalizeUrlHost(parsedUrl.hostname);

  const matchedSite = PURCHASE_URL_SITE_LABELS.find((site) =>
    site.hosts.some(
      (host) => normalizedHost === host || normalizedHost.endsWith(`.${host}`),
    ),
  );

  if (matchedSite) {
    return matchedSite.label;
  }

  return normalizedHost || fallbackLabel;
}
