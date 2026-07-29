import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CodeKids — Bâtis ta cité numérique",
  description:
    "Plateforme de coaching ludique qui apprend le code, l'algorithmique et la cybersécurité aux enfants de 10 ans à la Terminale.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning className={`${inter.variable} ${nunito.variable}`}>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
