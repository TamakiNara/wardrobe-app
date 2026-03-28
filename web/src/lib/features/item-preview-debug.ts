export function isItemPreviewDebugEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_ITEM_PREVIEW_DEBUG === "true";
}
