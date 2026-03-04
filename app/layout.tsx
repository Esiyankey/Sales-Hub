import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AuthProviderSupabase } from "@/lib/auth-context-supabase";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  manifest: "/manifest.json",
  title: "SalesHub - Business Management System",
  description:
    "Complete business management system for inventory, sales, and financial tracking",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};
export const viewport = {
  themeColor: "#2563eb"
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          <AuthProviderSupabase>{children}</AuthProviderSupabase>
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
