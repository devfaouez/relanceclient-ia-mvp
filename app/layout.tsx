import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "RelanceClient IA",
  description: "MVP SaaS de suivi de devis et relances avec validation humaine."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
