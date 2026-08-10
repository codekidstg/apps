import AnimateurClient from "./AnimateurClient";

export default async function AnimateurPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; pwd?: string }>;
}) {
  const { code, pwd } = await searchParams;
  const MENTOR_PWD = process.env.ATELIER_MENTOR_PWD ?? "codekids2026";

  if (!code || pwd !== MENTOR_PWD) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full space-y-5 text-center">
          <div className="text-4xl">🎓</div>
          <h1 className="text-xl font-black text-white">Tableau de bord Mentor</h1>
          <p className="text-sm text-slate-400">Accès réservé aux animateurs CodeKids.</p>
          <form className="space-y-3 text-left">
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">Code session</label>
              <input name="code" placeholder="Ex: MARS42" defaultValue={code}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white font-mono uppercase outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">Mot de passe mentor</label>
              <input name="pwd" type="password" placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500" />
            </div>
            <button type="submit" className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-white font-black rounded-xl transition-colors">
              Accéder →
            </button>
          </form>
          <p className="text-xs text-slate-600">
            URL : /atelier/animateur?code=XXXX&amp;pwd=••••
          </p>
        </div>
      </div>
    );
  }

  return <AnimateurClient sessionCode={code.toUpperCase()} />;
}
