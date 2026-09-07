/**
 * La progression d'un élève — une seule définition, pour tous les écrans.
 *
 * Quatre définitions coexistaient, et aucune ne correspondait à ce que
 * l'enfant voit dans son espace :
 *
 *   · liste admin / manager  → terminées / TOUTES les leçons `published` de la
 *     plateforme. Les 7 leçons publiées étant toutes des leçons Bâtisseur, un
 *     Explorateur était noté sur des leçons qu'il ne verra jamais : Ryshawn
 *     affichait 0/7 alors qu'il avait terminé une leçon de son propre thème.
 *   · fiche admin / manager  → terminées / lignes de suivi existantes, donc un
 *     dénominateur qui grandit à mesure que l'élève ouvre des leçons.
 *   · tableau de bord parent → même chose, et de toute façon mort : la requête
 *     demandait `updated_at`, colonne qui n'existe pas.
 *
 * Le point commun de ces erreurs : elles filtrent sur `lessons.status`. Or
 * l'espace élève ne regarde jamais ce champ. Il filtre les *thèmes* (publiés)
 * puis `student_theme_access`. Les 92 leçons encore en brouillon sont donc bel
 * et bien servies aux enfants, et toute mesure qui les ignore est fausse.
 *
 * Référence retenue : le parcours réellement ouvert à l'élève — les leçons des
 * thèmes publiés qui lui sont activés, dans l'ordre du programme. C'est la
 * seule définition qu'il ne peut pas contredire en ouvrant sa propre page.
 */

export type LigneProgres = { lesson_id: string; status: string };
export type LeconRef     = { id: string; title: string; chapter_id: string; order_index: number | null };
export type ChapitreRef  = { id: string; theme_id: string; order_index: number | null };
export type ThemeRef     = { id: string; title: string; level: string; order_index: number | null };

/** Le catalogue, thèmes déjà restreints aux publiés. */
export type Catalogue = {
  themes: ThemeRef[];
  chapitres: ChapitreRef[];
  lecons: LeconRef[];
};

export type Parcours = {
  /** Thème de la prochaine leçon non terminée — jamais vide tant qu'il reste du programme. */
  themeCourant: string | null;
  prochaineLecon: string | null;
  /** Rang de ce thème dans le niveau de l'élève, et nombre de thèmes du niveau. */
  rangTheme: number | null;
  themesDuNiveau: number;
  /** Avancement dans le thème courant. */
  faites: number;
  total: number;
  /** Avancement sur l'ensemble des thèmes activés. */
  faitesParcours: number;
  totalParcours: number;
  /** Leçons travaillées en dehors des thèmes activés — anomalie à signaler. */
  horsParcours: number;
  termine: boolean;
  aucunThemeActive: boolean;
};

const parIndex = (a: { order_index: number | null }, b: { order_index: number | null }) =>
  (a.order_index ?? 0) - (b.order_index ?? 0);

function grouper<T, K>(items: T[], cle: (t: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const it of items) {
    const k = cle(it);
    const arr = m.get(k);
    if (arr) arr.push(it); else m.set(k, [it]);
  }
  return m;
}

/**
 * Cœur du calcul, sans accès base — c'est lui qui est éprouvé par
 * `scripts/test-progression.mjs`.
 */
export function calculerParcours(
  progres: LigneProgres[],
  catalogue: Catalogue,
  themesActives: Set<string>,
  niveau: string,
): Parcours {
  const chapitresParTheme = grouper(catalogue.chapitres, (c) => c.theme_id);
  const leconsParChapitre = grouper(catalogue.lecons, (l) => l.chapter_id);

  // L'ordre du programme : thème, puis chapitre, puis leçon. Le même que celui
  // qui désigne la « prochaine quête » dans l'espace élève.
  const leconsDuTheme = (t: ThemeRef): LeconRef[] =>
    [...(chapitresParTheme.get(t.id) ?? [])].sort(parIndex)
      .flatMap((ch) => [...(leconsParChapitre.get(ch.id) ?? [])].sort(parIndex));

  const themesDuParcours = catalogue.themes.filter((t) => themesActives.has(t.id)).sort(parIndex);
  const parcours = themesDuParcours.flatMap((t) =>
    leconsDuTheme(t).map((lecon) => ({ lecon, theme: t })),
  );

  const statut = new Map(progres.map((p) => [p.lesson_id, p.status]));
  const estFaite = (id: string) => statut.get(id) === "completed";

  const idsDuParcours = new Set(parcours.map((x) => x.lecon.id));
  const horsParcours = progres.filter(
    (p) => p.status !== "not_started" && !idsDuParcours.has(p.lesson_id),
  ).length;

  const prochain = parcours.find((x) => !estFaite(x.lecon.id));
  // Parcours terminé : on reste sur le dernier thème plutôt que d'afficher un vide.
  const themeCourant = prochain?.theme ?? themesDuParcours[themesDuParcours.length - 1] ?? null;

  const leconsCourantes = themeCourant ? leconsDuTheme(themeCourant) : [];
  const themesNiveau = catalogue.themes.filter((t) => t.level === niveau).sort(parIndex);
  const rang = themeCourant ? themesNiveau.findIndex((t) => t.id === themeCourant.id) + 1 : 0;

  return {
    themeCourant: themeCourant?.title ?? null,
    prochaineLecon: prochain?.lecon.title ?? null,
    // Un thème d'un autre niveau que celui de l'élève n'a pas de rang ici.
    rangTheme: rang > 0 ? rang : null,
    themesDuNiveau: themesNiveau.length,
    faites: leconsCourantes.filter((l) => estFaite(l.id)).length,
    total: leconsCourantes.length,
    faitesParcours: parcours.filter((x) => estFaite(x.lecon.id)).length,
    totalParcours: parcours.length,
    horsParcours,
    termine: parcours.length > 0 && !prochain,
    aucunThemeActive: themesDuParcours.length === 0,
  };
}

export const PARCOURS_VIDE: Parcours = {
  themeCourant: null, prochaineLecon: null, rangTheme: null, themesDuNiveau: 0,
  faites: 0, total: 0, faitesParcours: 0, totalParcours: 0, horsParcours: 0,
  termine: false, aucunThemeActive: true,
};

/**
 * Charge le parcours de plusieurs élèves d'un coup.
 *
 * Chaque requête est contrôlée : une colonne absente renvoyait jusqu'ici un
 * `data` nul et un écran muet, sans la moindre trace.
 */
export async function chargerParcours(
  admin: any,
  eleves: { id: string; niveau: string }[],
): Promise<Map<string, Parcours>> {
  const resultat = new Map<string, Parcours>();
  for (const e of eleves) resultat.set(e.id, PARCOURS_VIDE);
  if (eleves.length === 0) return resultat;

  const ids = eleves.map((e) => e.id);
  const [themesRes, chapitresRes, leconsRes, accesRes, progresRes] = await Promise.all([
    admin.from("themes").select("id, title, level, order_index").eq("status", "published"),
    admin.from("chapters").select("id, theme_id, order_index"),
    admin.from("lessons").select("id, title, chapter_id, order_index"),
    admin.from("student_theme_access").select("student_id, theme_id").in("student_id", ids),
    admin.from("lesson_progress").select("student_id, lesson_id, status").in("student_id", ids),
  ]);

  for (const [nom, res] of [
    ["themes", themesRes], ["chapters", chapitresRes], ["lessons", leconsRes],
    ["student_theme_access", accesRes], ["lesson_progress", progresRes],
  ] as const) {
    if (res.error) console.error(`[progression] ${nom} : ${res.error.message}`);
  }

  const catalogue: Catalogue = {
    themes: themesRes.data ?? [],
    chapitres: chapitresRes.data ?? [],
    lecons: leconsRes.data ?? [],
  };

  const accesParEleve = grouper(accesRes.data ?? [], (a: any) => a.student_id);
  const progresParEleve = grouper(progresRes.data ?? [], (p: any) => p.student_id);

  for (const e of eleves) {
    resultat.set(e.id, calculerParcours(
      progresParEleve.get(e.id) ?? [],
      catalogue,
      new Set((accesParEleve.get(e.id) ?? []).map((a: any) => a.theme_id)),
      e.niveau,
    ));
  }
  return resultat;
}
