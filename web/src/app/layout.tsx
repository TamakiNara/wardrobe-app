import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppShell from "@/components/navigation/app-shell";
import { ROOT_METADATA } from "@/lib/metadata";
import { hasAuthenticatedUser } from "@/lib/server/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = ROOT_METADATA;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hasSession = await hasAuthenticatedUser();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppShell hasSession={hasSession}>{children}</AppShell>
      </body>
    </html>
  );
}
