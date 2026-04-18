"use client";

import { useState, type ImgHTMLAttributes, type ReactNode } from "react";

type SafeImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "onError"
> & {
  src?: string | null;
  fallback: ReactNode;
};

export default function SafeImage({
  src,
  fallback,
  alt,
  ...imageProps
}: SafeImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return <>{fallback}</>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...imageProps}
      src={src}
      alt={alt}
      onError={() => {
        setFailedSrc(src);
      }}
    />
  );
}
