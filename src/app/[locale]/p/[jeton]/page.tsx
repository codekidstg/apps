export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import { programmePartage } from "@/lib/eleve/atelier";
import { estInteractif, avecDe } from "@/lib/eleve/atelier-regles";
import ProgrammePartage from "@/components/eleve/ProgrammePartage";

/**
 * Le lien qu'un enfant envoie à ses parents.
 *
 * Publique, sans connexion : elle arrive par WhatsApp, et le parent n'a pas de
 * compte. Elle ne porte donc que ce qu'il faut — le titre du programme et le
 * prénom de l'enfant. Jamais son nom de famille, jamais son école.
 *
 * Elle n'existe que si l'enfant a allumé le partage, et disparaît à la seconde
 * où il l'éteint.
 */

export async function generateMetadata({ params }: {
  params: Promise<{ jeton: string }>;
}): Promise<Metadata> {
  const { jeton } = await params;
  const p = await programmePartage(jeton);
  if (!p) return { title: "Ce lien n'existe plus — CodeKids", robots: { index: false, follow: false } };
  return {
    title: `${p.titre}, par ${p.prenom} — CodeKids`,
    description: `Un programme écrit par ${p.prenom}. Essayez-le.`,
    // Un lien d'enfant n'a rien à faire dans un moteur de recherche.
    robots: { index: false, follow: false },
  };
}

export default async function PagePartage({ params }: {
  params: Promise<{ locale: string; jeton: string }>;
}) {
  const { locale, jeton } = await params;
  const programme = await programmePartage(jeton);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-xl mx-auto px-5 py-8 space-y-6">
        <Link href={`/${locale}`} className="inline-block">
          <Logo size={100} variant="white" />
        </Link>

        {programme ? (
          <>
            <header>
              <h1 className="text-2xl font-black text-white">{programme.titre}</h1>
              <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
                par {programme.prenom}
              </p>
            </header>

            <ProgrammePartage
              titre={programme.titre}
              prenom={programme.prenom}
              code={programme.code}
              sortie={programme.sortie}
              interactif={estInteractif(programme.code)}
            />

            <p className="text-xs text-center pt-4" style={{ color: "#475569" }}>
              Écrit sur CodeKids, dans l&apos;atelier {avecDe(programme.prenom)}.
            </p>
          </>
        ) : (
          <div className="rounded-2xl p-6 text-center space-y-2"
            style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
            <p className="font-black text-white">Ce lien n&apos;existe plus.</p>
            <p className="text-sm" style={{ color: "#94a3b8" }}>
              L&apos;enfant a arrêté le partage, ou l&apos;adresse a été mal recopiée.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
