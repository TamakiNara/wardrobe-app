import type { Metadata } from "next";

export const APP_NAME = "Wardrobe";

export const ROOT_METADATA: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: "Wardrobe の画面です。",
};

export function buildPageMetadata(
  title: string,
  description?: string,
): Metadata {
  return description ? { title, description } : { title };
}
