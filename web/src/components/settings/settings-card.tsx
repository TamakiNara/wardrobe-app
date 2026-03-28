import type { ReactNode } from "react";

type SettingsCardProps = {
  children: ReactNode;
  className?: string;
};

export function SettingsCard({ children, className = "" }: SettingsCardProps) {
  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ${className}`.trim()}
    >
      {children}
    </section>
  );
}
