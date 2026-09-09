/**
 * Les blocs standards de Blockly, en français.
 *
 * Les blocs propres à CodeKids — « 🚀 Avancer », « 💬 Kodi dit », « 🎵 Jouer »
 * — sont définis à la main, donc déjà en français. Mais `controls_repeat_ext`,
 * `controls_if` et les blocs de variables viennent de Blockly, et Blockly parle
 * anglais par défaut. Un enfant de neuf ans lisait donc « repeat 3 times do »
 * dans une séance qui lui parle du bloc « 🔁 Répéter », et « set item to » dans
 * une leçon sur les variables.
 *
 * Trois ateliers utilisent ces blocs — le labyrinthe, le piano et Kodi. Les
 * traductions vivent ici pour qu'ils ne puissent pas diverger.
 */

/** Traduit les blocs standards. À appeler juste après `await import("blockly")`. */
export function messagesFr(Blockly: any) {
  const M = Blockly?.Msg;
  if (!M) return;

  // Boucle — le bloc central de tout le niveau Explorateur.
  M.CONTROLS_REPEAT_TITLE = "🔁 répéter %1 fois";
  M.CONTROLS_REPEAT_INPUT_DO = "faire";

  // Conditions.
  M.CONTROLS_IF_MSG_IF = "si";
  M.CONTROLS_IF_MSG_THEN = "alors";
  M.CONTROLS_IF_MSG_ELSE = "sinon";
  M.CONTROLS_IF_MSG_ELSEIF = "sinon si";

  // Variables.
  M.VARIABLES_SET = "mettre %1 à %2";
  M.VARIABLES_GET = "%1";
  M.VARIABLES_DEFAULT_NAME = "chose";
  M.NEW_VARIABLE = "Créer une variable…";
  M.RENAME_VARIABLE = "Renommer la variable…";
  M.DELETE_VARIABLE = "Supprimer la variable « %1 »";

  // Texte.
  M.TEXT_JOIN_TITLE_CREATEWITH = "assembler";

  // Menu contextuel — visible dès qu'un enfant fait un clic droit.
  M.DUPLICATE_BLOCK = "Dupliquer";
  M.DELETE_BLOCK = "Supprimer le bloc";
  M.DELETE_X_BLOCKS = "Supprimer %1 blocs";
  M.DELETE_ALL_BLOCKS = "Supprimer les %1 blocs ?";
  M.CLEAN_UP = "Ranger les blocs";
  M.COLLAPSE_BLOCK = "Replier le bloc";
  M.EXPAND_BLOCK = "Déplier le bloc";
  M.DISABLE_BLOCK = "Désactiver le bloc";
  M.ENABLE_BLOCK = "Activer le bloc";
  M.ADD_COMMENT = "Ajouter un commentaire";
  M.REMOVE_COMMENT = "Retirer le commentaire";
  M.UNDO = "Annuler";
  M.REDO = "Refaire";
  M.HELP = "Aide";
}
