import Link from "next/link";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="bg-brand-blue text-white">
      <div className="max-w-7xl mx-auto px-7 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* Brand */}
        <div>
          <div className="mb-4">
            <Logo size={70} variant="white" />
          </div>
          <p className="text-sm text-brand-blue-soft leading-relaxed mb-4">
            L&apos;enfant qui code aujourd&apos;hui bâtit le monde de demain.
          </p>
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-amber" />
            <span className="text-xs font-extrabold text-brand-amber">Inscriptions ouvertes · Rentrée 2026</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-extrabold uppercase tracking-widest text-brand-blue-soft mb-1">Navigation</span>
          <Link href="#niveaux" className="text-sm text-blue-200 hover:text-white transition-colors font-bold">Les niveaux</Link>
          <Link href="#apropos" className="text-sm text-blue-200 hover:text-white transition-colors font-bold">À propos</Link>
          <a
            href="mailto:codekidstg@proton.me?subject=Inscription codeKids — Rentrée 2026"
            className="text-sm text-brand-amber hover:text-white transition-colors font-extrabold"
          >
            Inscrire mon enfant →
          </a>
        </div>

        {/* Contact riche */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-extrabold uppercase tracking-widest text-brand-blue-soft mb-1">Contact</span>

          <div className="flex flex-col gap-2">
            <a href="tel:+22891746278" className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors font-bold">
              <span className="text-brand-amber">📞</span> +228 91 74 62 78
            </a>
            <a href="tel:+33753348033" className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors font-bold">
              <span className="text-brand-amber">📞</span> +33 7 53 34 80 33
            </a>
            <a href="tel:+33688919215" className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors font-bold">
              <span className="text-brand-amber">📞</span> +33 6 88 91 92 15
            </a>
            <a href="mailto:codekidstg@proton.me" className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors font-bold">
              <span className="text-brand-amber">✉️</span> codekidstg@proton.me
            </a>
          </div>

          <div className="mt-1 pt-3 border-t border-white/10">
            <span className="text-xs font-extrabold text-brand-blue-soft uppercase tracking-widest">Présence</span>
            <p className="text-sm text-blue-200 font-bold mt-1">
              Lomé · Abidjan · Cotonou · Ouagadougou
            </p>
          </div>

          <p className="text-xs text-brand-blue-soft font-bold italic mt-1">
            Séance d&apos;immersion offerte aux parents
          </p>
        </div>
      </div>

      <div className="border-t border-blue-800 py-5 text-center text-xs text-blue-300 font-bold">
        © {new Date().getFullYear()} codeKids · Tous droits réservés
      </div>
    </footer>
  );
}
