import { createClient } from "@/lib/supabase/server";
import { getCachedAllTrainings } from "@/lib/cache/queries";
import { redirect } from "next/navigation";
import Link from "next/link";
import AvatarSvg from "@/components/eleve/AvatarSvg";
import { compterReponsesNonVuesEleve } from "@/lib/questions/donnees";
import XPBar from "@/components/eleve/XPBar";
import Logo from "@/components/Logo";
import BadgeToast from "@/components/eleve/BadgeToast";
import SwRegistrar from "@/components/eleve/SwRegistrar";
import OfflineBanner from "@/components/eleve/OfflineBanner";
import BoutonDeconnexion from "@/components/BoutonDeconnexion";
import { atelierOuvertA } from "@/lib/eleve/atelier";
import { getEffectiveNavPermissions } from "@/lib/permissions/access";

type StudentData = {
  display_name: string;
  xp: number;
  student_id: string;
  avatar: { base: string; hat: string | null; accessory: string | null; color: string; accent: string | null } | null;
};

export default async function EleveLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  // profile + student en parallèle
  const [profileRes, studentRes] = await Promise.all([
    supabase.from("profiles").select("display_name, role").eq("id", user.id).single<{ display_name: string; role: string }>(),
    // level_num vient avec : c'est le niveau pédagogique fixé par l'admin, à ne
    // pas confondre avec le palier d'XP qui porte malheureusement les mêmes noms.
    supabase.from("students").select("id, xp, points, atelier_active, level_num").eq("profile_id", user.id).single<{ id: string; xp: number; points: number; atelier_active: boolean; level_num: number | null }>(),
  ]);
  const profile = profileRes.data;
  const student = studentRes.data;

  if (!profile || !["student", "admin"].includes(profile.role ?? "")) redirect("/fr/connexion");

  const xp = student?.xp ?? 0;

  // Badge entraînements + avatar en parallèle
  // allTrainings depuis le cache (5 min) — évite un aller-retour DB à chaque navigation élève
  const [allTrainings, lessonProgRes, trainingProgRes, avatarRes, reponsesNonVues, droits] = await Promise.all([
    getCachedAllTrainings(),
    student ? (supabase.from("lesson_progress") as any).select("lesson_id, status").eq("student_id", student.id) : Promise.resolve({ data: [] }),
    student ? (supabase.from("training_progress") as any).select("training_id").eq("student_id", student.id).gt("attempts", 0) : Promise.resolve({ data: [] }),
    student ? (supabase.from("student_avatar") as any).select("*").eq("student_id", student.id).maybeSingle() : Promise.resolve({ data: null }),
    // La pastille « Mes questions » : une réponse du mentor pas encore lue.
    student ? compterReponsesNonVuesEleve(student.id) : Promise.resolve(0),
    // L'espace élève était le seul à ne pas consulter les droits : les
    // interrupteurs de /admin/droits bloquaient la page mais laissaient
    // l'entrée dans le menu. Un menu qui ne s'éteint pas est un trou silencieux.
    getEffectiveNavPermissions(user.id, "student"),
  ]);

  const startedIds = new Set((lessonProgRes.data ?? []).map((r: any) => r.lesson_id));
  // La salle de jeu s'ouvre séance par séance, quand la séance est TERMINÉE —
  // la même règle que le serveur applique déjà aux exercices eux-mêmes.
  const finiesIds  = new Set((lessonProgRes.data ?? []).filter((r: any) => r.status === "completed").map((r: any) => r.lesson_id));
  const doneIds    = new Set((trainingProgRes.data ?? []).map((r: any) => r.training_id));
  // Deux pastilles, deux comptes : le programme d'un côté, la salle de l'autre.
  // Mélangés, les exercices libres faisaient gonfler le devoir à faire.
  const trainingBadgeCount = student
    ? allTrainings.filter((t) => !t.libre_service && startedIds.has(t.lesson_id) && !doneIds.has(t.id)).length
    : 0;
  const salleBadgeCount = student
    ? allTrainings.filter((t) => t.libre_service && finiesIds.has(t.lesson_id) && !doneIds.has(t.id)).length
    : 0;
  const avatarRaw = avatarRes.data;

  const avatar = avatarRaw as StudentData["avatar"];

  /**
   * Le menu de l'enfant, en trois familles.
   *
   * Rien n'est replié : à douze ans, ce qui est caché n'existe pas, et un
   * sous-menu enterrerait les pastilles — or ce sont elles qui le ramènent.
   * Des titres suffisent à ranger, en laissant les neuf entrées visibles d'un
   * seul coup d'œil.
   *
   * Les familles ne sont pas des tiroirs mais des états d'esprit : ce qui est
   * suivi par le mentor, ce qui n'est jamais noté, et ce qu'il a gagné. La
   * deuxième est la seule qui compte vraiment pour lui — le dire à voix haute
   * enlève la peur de mal faire.
   *
   * À l'intérieur d'une famille, l'ordre suit la fréquence réelle, pas la
   * logique : on ouvre sa Cité tous les jours, son robot une fois par mois.
   */
  const familles = ([
    {
      titre: "J'apprends",
      entrees: [
        { href: "/eleve",              label: "Ma Cité",           icon: "🏙️", cle: "student.apprendre" },
        { href: "/eleve/entrainement", label: "Mon Entraînement",  icon: "💪", cle: "student.entrainement" },
        { href: "/eleve/questions",    label: "Mes questions",     icon: "🙋", cle: "student.questions" },
      ],
    },
    {
      titre: "Je m'amuse",
      entrees: [
        { href: "/eleve/salle-de-jeu", label: "Ma salle de jeu",   icon: "🏟️", cle: "student.salle_de_jeu" },
        // L'atelier libre n'a de sens qu'à partir du Bâtisseur : l'Explorateur
        // travaille en blocs, un éditeur de texte vide ne lui dirait rien.
        ...(atelierOuvertA(null, student?.level_num)
          ? [{ href: "/eleve/atelier", label: "Je code ici", icon: "🛠️", cle: "student.atelier" }]
          : []),
      ],
    },
    {
      titre: "Mes trophées",
      entrees: [
        { href: "/eleve/badges",     label: "Badges",     icon: "⭐", cle: "student.badges" },
        { href: "/eleve/classement", label: "Classement", icon: "🏆", cle: "student.classement" },
        { href: "/eleve/avatar",     label: "Mon robot",  icon: "🤖", cle: "student.avatar" },
      ],
    },
  ] as { titre: string; entrees: { href: string; label: string; icon: string; cle?: string }[] }[])
    .map((f) => ({ ...f, entrees: f.entrees.filter((e) => !e.cle || droits.has(e.cle)) }))
    // Une famille dont toutes les pages sont éteintes ne laisse pas son titre
    // orphelin dans le menu.
    .filter((f) => f.entrees.length > 0);

  // La séance offerte n'est d'aucune famille : c'est une offre, pas une
  // rubrique. Elle s'ouvre et se ferme par `atelier_active`, élève par élève,
  // et pas par les droits.
  const seanceOfferte = student?.atelier_active
    ? { href: "/atelier/lecon", label: "Séance offerte", icon: "🎟️" }
    : null;

  return (
    <div className="min-h-screen flex bg-slate-950 text-white">
      {/* Skip link a11y */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:font-black focus:px-4 focus:py-2 focus:rounded-xl"
        style={{ background: "#FDB813", color: "#0f172a" }}
      >
        Aller au contenu
      </a>
      {/* Sidebar */}
      <aside className="w-64 shrink-0 flex flex-col" style={{ background: "#0f172a", borderRight: "1px solid #1e293b" }}>
        {/* Logo */}
        <div className="px-3 pt-4 pb-3 flex flex-col items-start gap-0.5" style={{ borderBottom: "1px solid #1e293b" }}>
          {/* Le bouton à côté du logo, et le nom de l'espace dessous : à côté
              du bouton, il passait sur deux lignes. */}
          <div className="w-full flex items-center justify-between gap-2">
            <Link href={`/${locale}/eleve`}>
              <Logo size={90} variant="white" />
            </Link>
            <BoutonDeconnexion />
          </div>
          <div className="text-xs font-mono tracking-widest uppercase ml-1" style={{ color: "#334155" }}>◈ Espace Élève</div>
        </div>

        {/* Avatar + nom */}
        <div className="px-4 pt-4 pb-3 flex items-center gap-3" style={{ borderBottom: "1px solid #1e293b" }}>
          <div className="shrink-0 relative">
            <div className="absolute inset-0 rounded-full blur-md opacity-30" style={{ background: avatar?.color ?? "#FDB813" }} />
            <AvatarSvg
              base={avatar?.base}
              hat={avatar?.hat}
              accessory={avatar?.accessory}
              color={avatar?.color}
              accent={avatar?.accent}
              size={44}
            />
          </div>
          <div className="min-w-0">
            <div className="font-black text-white text-sm truncate">{profile.display_name}</div>
            <div className="text-xs mt-0.5 font-mono" style={{ color: "#FDB813" }}>{xp.toLocaleString("fr-FR")} XP</div>
          </div>
        </div>

        {/* XP Bar */}
        <XPBar xp={xp} niveauNum={student?.level_num ?? 1} />

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-4">
          {familles.map((famille) => (
            <div key={famille.titre} className="space-y-1">
              <div className="px-3 pb-0.5 text-[10px] font-black uppercase tracking-widest"
                style={{ color: "#475569" }}>
                {famille.titre}
              </div>
              {famille.entrees.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all hover:bg-slate-800"
                  style={{ color: "#94a3b8" }}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.href === "/eleve/entrainement" && trainingBadgeCount > 0 && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none"
                      style={{ background: "#FDB813", color: "#0f172a" }}>
                      {trainingBadgeCount}
                    </span>
                  )}
                  {item.href === "/eleve/salle-de-jeu" && salleBadgeCount > 0 && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none"
                      style={{ background: "#a78bfa", color: "#1e1b4b" }}
                      aria-label={`${salleBadgeCount} exercice${salleBadgeCount > 1 ? "s" : ""} jamais joué${salleBadgeCount > 1 ? "s" : ""}`}>
                      {salleBadgeCount}
                    </span>
                  )}
                  {item.href === "/eleve/questions" && reponsesNonVues > 0 && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none"
                      style={{ background: "#10b981", color: "#022c22" }}
                      aria-label={`${reponsesNonVues} réponse${reponsesNonVues > 1 ? "s" : ""} de ton mentor`}>
                      {reponsesNonVues}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ))}

          {seanceOfferte && (
            <Link
              href={seanceOfferte.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-black transition-all border border-orange-500/40 hover:border-orange-400"
              style={{ background: "rgba(249,115,22,0.12)", color: "#fb923c" }}
            >
              <span className="text-base">{seanceOfferte.icon}</span>
              <span className="flex-1">{seanceOfferte.label}</span>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none animate-pulse"
                style={{ background: "#f97316", color: "white" }}>
                NEW
              </span>
            </Link>
          )}
        </nav>

      </aside>

      {/* Main */}
      <main id="main-content" className="flex-1 overflow-auto bg-slate-950">
        {children}
      </main>

      <BadgeToast />
      <SwRegistrar />
      <OfflineBanner />
    </div>
  );
}
