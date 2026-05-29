import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "RelanceClient IA — Relancez vos devis, signez plus de chantiers",
  description:
    "L’outil de relance pour artisans du bâtiment. Suivez vos devis, relancez au bon moment, signez plus de chantiers."
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
