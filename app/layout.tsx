import type { Metadata } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";

import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap"
});

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap"
});

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
      <body className={`${hankenGrotesk.variable} ${bricolageGrotesque.variable}`}>
        {children}
      </body>
    </html>
  );
}
