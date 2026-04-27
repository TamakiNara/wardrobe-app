import { ExternalLink } from "lucide-react";
import { resolvePurchaseUrlDisplayLabel } from "@/lib/links/purchase-url";

type PurchaseUrlLinkProps = {
  url: string;
  variant?: "detail" | "list";
  className?: string;
};

export function PurchaseUrlLink({
  url,
  variant = "detail",
  className = "",
}: PurchaseUrlLinkProps) {
  const label =
    variant === "list"
      ? "商品ページ"
      : resolvePurchaseUrlDisplayLabel(url, {
          fallbackLabel: "商品ページ",
        });

  const iconClassName = variant === "list" ? "h-3.5 w-3.5" : "h-4 w-4";
  const baseClassName =
    variant === "list"
      ? "inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-blue-600 hover:underline"
      : "inline-flex items-center gap-1.5 text-blue-600 hover:underline";

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={[baseClassName, className].filter(Boolean).join(" ")}
    >
      <ExternalLink className={iconClassName} aria-hidden="true" />
      <span>{label}</span>
    </a>
  );
}
