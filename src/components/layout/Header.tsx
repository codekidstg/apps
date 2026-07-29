"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import Logo from "@/components/Logo";

export default function Header() {
  const t = useTranslations("navigation");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-cream-border">
      <div className="max-w-7xl mx-auto px-7 h-16 flex items-center justify-between">

        <Link href="/">
          <Logo size={88} />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="#niveaux" className="text-sm font-bold text-ink-muted hover:text-ink transition-colors">
            {t("levels")}
          </Link>
          <Link href="#apropos" className="text-sm font-bold text-ink-muted hover:text-ink transition-colors">
            À propos
          </Link>
          <a
            href="mailto:codekidstg@proton.me?subject=Inscription codeKids — Rentrée 2026"
            className="bg-brand-orange text-white text-sm font-extrabold px-5 py-2.5 rounded-xl hover:bg-brand-orange-dark transition-colors"
          >
            Inscrire mon enfant
          </a>
        </nav>

        <button
          className="md:hidden p-2 rounded-lg text-ink-muted hover:bg-cream transition-colors"
          aria-label="Menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="block w-5 h-0.5 bg-current mb-1" />
          <span className="block w-5 h-0.5 bg-current mb-1" />
          <span className="block w-5 h-0.5 bg-current" />
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-cream-border bg-white px-7 py-5 flex flex-col gap-4">
          <Link href="#niveaux" className="text-sm font-bold text-ink-muted" onClick={() => setMenuOpen(false)}>{t("levels")}</Link>
          <Link href="#apropos" className="text-sm font-bold text-ink-muted" onClick={() => setMenuOpen(false)}>À propos</Link>
          <a
            href="mailto:codekidstg@proton.me?subject=Inscription codeKids — Rentrée 2026"
            className="bg-brand-orange text-white text-sm font-extrabold px-5 py-2.5 rounded-xl text-center"
            onClick={() => setMenuOpen(false)}
          >
            Inscrire mon enfant
          </a>
        </div>
      )}
    </header>
  );
}
