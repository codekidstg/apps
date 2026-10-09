"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Decor, SceneConfig } from "./preludes";

/**
 * Le lecteur de scènes.
 *
 * Il remplace la console noire d'un défi de code par un dessin que le
 * programme de l'enfant fait bouger. Le dessin vit dans `public/scenes/` et
 * documente ses prises en tête de fichier ; ici on ne fait que tirer dessus,
 * événement par événement, d'après le journal rapporté par le prélude.
 *
 * Trois choses à savoir avant de toucher à ce fichier :
 *
 * 1. `input()` relance le programme depuis le début à chaque réponse. Le
 *    journal arrive donc plusieurs fois, de plus en plus long. On garde l'index
 *    du dernier événement joué et on n'anime que la suite — sinon l'animation
 *    recommencerait à zéro à chaque saisie.
 * 2. `appliquer` pose l'état CUMULÉ jusqu'à un index donné. Remettre la scène à
 *    neuf, c'est donc l'appeler avec -1 ; sauter l'animation, c'est l'appeler
 *    avec le dernier index. Rien d'autre à écrire pour ces deux cas.
 * 3. Sous `prefers-reduced-motion`, on saute directement à l'état final. La
 *    scène reste informative, elle ne clignote pas.
 */

type Evt = Record<string, unknown>;

type Props = {
  scene: SceneConfig;
  /** Ce que le prélude a rapporté. `null` tant que rien n'a tourné. */
  recolte: Record<string, unknown> | null;
  enMarche: boolean;
  /** Le programme s'est arrêté sur une erreur. À l'étal, le courant saute. */
  plante?: boolean;
  /** La sortie texte, affichée sous la scène : les print() comptent encore. */
  stdout?: string;
};

const CACHE = new Map<string, Promise<string>>();
function charger(decor: Decor): Promise<string> {
  if (!CACHE.has(decor)) {
    CACHE.set(decor, fetch(`/scenes/${decor}/${decor}.svg`).then((r) => {
      if (!r.ok) throw new Error(`scène ${decor} introuvable`);
      return r.text();
    }));
  }
  return CACHE.get(decor)!;
}

const nb = (v: unknown, defaut = 0) => (typeof v === "number" ? v : defaut);

/**
 * Pose l'état de la scène tel qu'il est APRÈS l'événement `jusqua`.
 * `jusqua = -1` remet tout à neuf. Rend la durée à attendre avant le suivant.
 */
function appliquer(svg: SVGElement, decor: Decor, journal: Evt[], jusqua: number,
                   reglages: Record<string, unknown>, plante = false): number {
  const $ = (id: string) => svg.querySelector<SVGElement>(`#${id}`);
  const pose = (id: string, attr: string, v: string | number) => $(id)?.setAttribute(attr, String(v));
  const vus = journal.slice(0, jusqua + 1);
  const courant = jusqua >= 0 ? journal[jusqua] : null;

  if (decor === "forage") {
    const contenance = nb(reglages.contenance, 40);
    const FOND = 244, PX = 120 / contenance; // l'intérieur fait 120 px de haut
    const litres = vus.reduce((a, e) =>
      a + (e.quoi === "verser" ? nb(e.litres) : e.quoi === "jeter" ? -nb(e.kg) : 0), nb(reglages.depart_kg));
    const h = Math.max(0, Math.min(litres, contenance)) * PX;
    pose("eau-niveau", "y", FOND - h);
    pose("eau-niveau", "height", h);
    pose("eau-surface", "transform", `translate(0,${-h})`);
    pose("eau-surface", "opacity", h > 2 ? 1 : 0);
    const trop = litres > contenance;
    pose("debordement", "opacity", trop ? 1 : 0);
    pose("flaque", "opacity", trop ? 0.55 : 0);

    if (courant?.quoi === "verser") {
      pose("seau", "transform", "translate(176 -96) rotate(104 178 250)");
      pose("filet-eau", "opacity", 1);
      return 620;
    }
    pose("seau", "transform", "translate(0 0)");
    pose("filet-eau", "opacity", 0);
    return courant ? 380 : 0;
  }

  if (decor === "etal") {
    const servis = vus.filter((e) => e.quoi === "encaisser");
    const passes = vus.filter((e) => e.quoi === "encaisser" || e.quoi === "refuser").length;
    const total = servis.reduce((a, e) => a + (parseInt(String(e.papier).replace(/\s/g, ""), 10) || 0), 0);
    for (let i = 1; i <= 5; i++) pose(`billet-${i}`, "opacity", i <= servis.length ? 1 : 0);
    const caisse = $("total-texte"); if (caisse) caisse.textContent = `${total} F`;
    pose("file", "transform", `translate(${-58 * passes} 0)`);
    const papier = $("papier-texte");
    if (papier && courant?.papier) papier.textContent = `"${String(courant.papier)}"`;
    pose("papier", "opacity", courant ? 1 : 0);
    pose("papier", "transform", courant ? "translate(96 -34) scale(.9)" : "translate(0 0)");
    pose("tampon-refus", "opacity", courant?.quoi === "refuser" ? 1 : 0);
    pose("tiroir", "transform", courant?.quoi === "encaisser" ? "translate(0 10)" : "translate(0 0)");
    // Le délestage : il n'arrive qu'au tout dernier événement, parce que le
    // programme s'est arrêté là. L'ampoule, le ventilateur et les clients
    // restants partent ensemble.
    const fini = jusqua >= journal.length - 1;
    const noir = plante && fini;
    // Le papier qui a tué la boutique n'a jamais produit d'événement : le
    // programme est mort avant de l'encaisser. On le retrouve par sa place
    // dans la file, et on le laisse en l'air, figé, sous les yeux de l'enfant.
    if (noir) {
      const liste = (reglages.papiers as string[]) ?? [];
      const coupable = liste[passes];
      if (coupable !== undefined && papier) {
        papier.textContent = `"${coupable}"`;
        pose("papier", "opacity", 1);
        pose("papier", "transform", "translate(96 -34) scale(.9)");
        pose("tampon-refus", "opacity", 0);
      }
    }
    pose("nuit", "opacity", noir ? 0.92 : 0);
    pose("ampoule", "opacity", noir ? 0 : 1);
    pose("halo", "opacity", noir ? 0 : 1);
    svg.querySelector("#pales")?.setAttribute("style", noir ? "animation-duration:6s" : "");
    return courant ? 700 : 0;
  }

  // cahier — l'enfant écrit de vrais fichiers, le prélude enveloppe `open`
  let surTable = 0, lignes: string[] = [], nuit = false;
  for (const e of vus) {
    if (e.quoi === "ajouter") surTable++;
    if (e.quoi === "effacer") lignes = [];                       // open(..., "w") vide le cahier
    if (e.quoi === "noter") lignes.push(String(e.texte));
    if (e.quoi === "relire") surTable += String(e.texte ?? "").split("\n").filter((x) => x.trim()).length;
    if (e.quoi === "fermer") { surTable = 0; nuit = true; }
  }
  for (let i = 1; i <= 5; i++) {
    const g = $(`note-${i}`);
    if (!g) continue;
    g.setAttribute("opacity", i <= surTable ? "1" : "0");
    g.style.transform = nuit && i > surTable ? "translate(-110px,-205px) rotate(-24deg)" : "";
  }
  for (let i = 1; i <= 4; i++) {
    const t = $(`ligne-${i}`);
    if (!t) continue;
    t.setAttribute("opacity", i <= lignes.length ? "1" : "0");
    if (i <= lignes.length) t.textContent = lignes[i - 1].replace(/\n/g, " ").trim().slice(0, 14);
  }
  for (const id of ["ciel-nuit", "lampe-allumee", "lueur-lampe"]) pose(id, "opacity", nuit ? 1 : 0);
  pose("nuit", "opacity", nuit ? 0.78 : 0);
  pose("plume", "opacity", courant?.quoi === "noter" ? 1 : 0);
  return courant ? 650 : 0;
}

export default function Scene({ scene, recolte, enMarche, plante = false, stdout }: Props) {
  const boite = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGElement | null>(null);
  const joue = useRef(-1);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [pret, setPret] = useState(false);

  // Sans ces deux mémos, le tableau change d'identité à chaque rendu : l'effet
  // se redéclencherait sans fin et l'animation repartirait de zéro.
  const journal = useMemo(() => (recolte?._journal as Evt[] | undefined) ?? [], [recolte]);
  const reglages = useMemo(() => scene.reglages ?? {}, [scene.reglages]);

  useEffect(() => {
    let vivant = true;
    charger(scene.decor)
      .then((texte) => {
        if (!vivant || !boite.current) return;
        boite.current.innerHTML = texte.slice(texte.indexOf("<svg"));
        const svg = boite.current.querySelector("svg");
        if (svg) {
          svg.setAttribute("style", "width:100%;height:auto;display:block");
          svgRef.current = svg as unknown as SVGElement;
        }
        setPret(true);
      })
      .catch(() => setErreur("Le décor n'a pas pu être chargé. Ton programme tourne quand même."));
    return () => { vivant = false; if (minuteur.current) clearTimeout(minuteur.current); };
  }, [scene.decor]);

  const derouler = useCallback((depuis: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const suite = (i: number) => {
      if (i >= journal.length) return;
      const attente = appliquer(svg, scene.decor, journal, i, reglages, plante);
      joue.current = i;
      minuteur.current = setTimeout(() => suite(i + 1), attente);
    };
    suite(depuis);
  }, [journal, scene.decor, reglages, plante]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !pret) return;
    if (minuteur.current) clearTimeout(minuteur.current);

    // Rien n'a encore tourné, ou le programme repart : on remet à neuf.
    if (journal.length === 0 || journal.length <= joue.current) {
      joue.current = -1;
      appliquer(svg, scene.decor, journal, -1, reglages, plante);
      if (journal.length === 0) return;
    }
    const sobre = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (sobre) {
      appliquer(svg, scene.decor, journal, journal.length - 1, reglages, plante);
      joue.current = journal.length - 1;
      return;
    }
    derouler(joue.current + 1);
  }, [journal, pret, scene.decor, reglages, plante, derouler]);

  return (
    <div className="space-y-2">
      <div ref={boite}
           className="rounded-2xl overflow-hidden"
           style={{ background: "#050f1a", border: "1px solid #1e293b",
                    opacity: enMarche ? 0.75 : 1, transition: "opacity .2s" }} />
      {erreur && (
        <p className="text-xs font-mono" style={{ color: "#f59e0b" }}>⚠ {erreur}</p>
      )}
      {stdout && (
        <pre className="rounded-xl px-4 py-3 text-xs font-mono whitespace-pre-wrap overflow-x-auto"
             style={{ background: "#0f172a", border: "1px solid #1e293b", color: "#94a3b8" }}>{stdout}</pre>
      )}
    </div>
  );
}
