import Link from "next/link";
import AnimateurClient from "./AnimateurClient";
import { getAtelierAccess } from "@/lib/permissions/atelier";

export const dynamic = "force-dynamic";

export default async function AnimateurPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; pwd?: string }>;
}) {
  const { code, pwd } = await searchParams;
  const MENTOR_PWD = process.env.ATELIER_MENTOR_PWD ?? "codekids2026";
  const access = await getAtelierAccess();

  // Prof/manager dont l'admin a coupé l'Atelier : refus net, sans repli mot de passe.
  if (access.kind === "denied") {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full space-y-4 text-center">
          <div className="text-4xl">🔒</div>
          <h1 className="text-xl font-black text-white">Atelier désactivé</h1>
          <p className="text-sm text-slate-400">
            L&apos;accès à l&apos;Atelier n&apos;est pas activé sur ton compte.
            Contacte un administrateur pour l&apos;ouvrir.
          </p>
          <Link href="/" className="inline-block text-xs font-bold text-orange-400 hover:text-orange-300">
            ← Retour
          </Link>
        </div>
      </div>
    );
  }

  // Staff connecté : le mot de passe partagé n'a plus de sens, seul le code manque.
  const isStaff   = access.kind === "staff";
  const authorized = isStaff || pwd === MENTOR_PWD;

  if (!code || !authorized) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full space-y-5 text-center">
          <div className="text-4xl">🎓</div>
          <h1 className="text-xl font-black text-white">Tableau de bord Mentor</h1>
          <p className="text-sm text-slate-400">
            {isStaff
              ? `Bonjour ${access.displayName} — saisis le code de la session à animer.`
              : "Accès réservé aux animateurs CodeKids."}
          </p>
          <form className="space-y-3 text-left">
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">Code session</label>
              <input name="code" placeholder="Ex: MARS42" defaultValue={code}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white font-mono uppercase outline-none focus:border-orange-500" />
            </div>
            {!isStaff && (
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Mot de passe mentor</label>
                <input name="pwd" type="password" placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500" />
              </div>
            )}
            <button type="submit" className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-white font-black rounded-xl transition-colors">
              Accéder →
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <AnimateurClient sessionCode={code.toUpperCase()} />;
}
