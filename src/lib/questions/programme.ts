/**
 * Le programme Blockly de l'enfant, rendu lisible pour son mentor.
 *
 * Le XML que Blockly sauvegarde est illisible. Sans cette traduction, le
 * mentor recevait « ça marche pas » sans rien pour comprendre ; avec elle, il
 * voit « Avancer, Avancer, Ramasser » et peut répondre « ton Ramasser est une
 * case trop tôt ».
 *
 * Navigateur uniquement : on s'appuie sur DOMParser.
 */

const LIBELLES: Record<string, string> = {
  robot_move:       "Avancer",
  robot_turn_left:  "Tourner à gauche",
  robot_turn_right: "Tourner à droite",
  robot_pick:       "Ramasser",
  // Le mot que l'enfant lit sur son bloc, pas un autre.
  music_pause:      "Silence",
};

export function programmeLisible(xml: unknown): string | null {
  if (typeof xml !== "string" || !xml.trim() || typeof DOMParser === "undefined") return null;

  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(xml, "text/xml");
  } catch {
    return null;
  }
  if (doc.getElementsByTagName("parsererror").length) return null;

  const lignes: string[] = [];
  const enfants = (e: Element, nom: string) => [...e.children].filter((c) => c.localName === nom);

  const lire = (depart: Element | null, profondeur: number) => {
    let bloc = depart;
    while (bloc) {
      const type = bloc.getAttribute("type") ?? "";
      const retrait = "   ".repeat(profondeur);

      if (type === "controls_repeat_ext" || type === "controls_repeat") {
        const valeur = enfants(bloc, "value").find((v) => v.getAttribute("name") === "TIMES");
        const nombre = valeur?.getElementsByTagName("field")[0]?.textContent
          ?? enfants(bloc, "field").find((f) => f.getAttribute("name") === "TIMES")?.textContent
          ?? "?";
        lignes.push(`${retrait}Répéter ${nombre} fois :`);
        const interieur = enfants(bloc, "statement").find((s) => s.getAttribute("name") === "DO");
        lire(interieur ? enfants(interieur, "block")[0] ?? null : null, profondeur + 1);
      } else if (type === "music_play_note") {
        const note = enfants(bloc, "field")[0]?.textContent;
        lignes.push(`${retrait}Jouer ${note ?? "une note"}`);
      } else if (type === "music_drum") {
        const frappe = enfants(bloc, "field")[0]?.textContent;
        lignes.push(`${retrait}${frappe ?? "Frappe"}`);
      } else {
        lignes.push(`${retrait}${LIBELLES[type] ?? type}`);
      }

      const suivant = enfants(bloc, "next")[0];
      bloc = suivant ? enfants(suivant, "block")[0] ?? null : null;
    }
  };

  // L'espace de travail peut contenir plusieurs piles : un bloc oublié sur le
  // côté est justement le genre d'erreur que le mentor doit voir.
  const piles = enfants(doc.documentElement, "block");
  piles.forEach((pile, i) => {
    if (i > 0) lignes.push("— bloc posé à part, non relié —");
    lire(pile, 0);
  });

  return lignes.length ? lignes.join("\n") : "(programme vide)";
}
