/**
 * Marque une leçon comme faite pour un élève, avec toutes les bonnes réponses.
 *
 * Sert quand la séance a bien eu lieu avec le mentor mais pas sur l'ordinateur
 * de l'élève. Les réponses sont lues dans le contenu de la leçon, jamais
 * inventées : le quiz reçoit l'index correct, chaque défi et chaque jeu sont
 * marqués résolus.
 *
 *     node scripts/valider-seance.mjs <lessonId> <profileId|nom>
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter(l => l.includes("="))
    .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const [lessonId, cible] = process.argv.slice(2);
if (!lessonId || !cible) {
  console.error("usage : node scripts/valider-seance.mjs <lessonId> <nom de l'élève>");
  process.exit(1);
}

// ── L'élève ──────────────────────────────────────────────────────────────────
const { data: profils } = await db.from("profiles").select("id, display_name").eq("role", "student");
const profil = (profils ?? []).find(p =>
  p.id === cible || (p.display_name ?? "").toLowerCase().includes(cible.toLowerCase()));
if (!profil) { console.error(`Élève introuvable : ${cible}`); process.exit(1); }

const { data: eleve } = await db.from("students").select("id, xp").eq("profile_id", profil.id).single();
if (!eleve) { console.error(`Aucune ligne students pour ${profil.display_name}`); process.exit(1); }

// ── La leçon et ses blocs ────────────────────────────────────────────────────
const { data: lecon } = await db.from("lessons").select("id, title, xp_reward").eq("id", lessonId).single();
const { data: blocs } = await db.from("lesson_blocks")
  .select("id, type, content, order_index").eq("lesson_id", lessonId).order("order_index");

// ── Construire la progression ────────────────────────────────────────────────
const quizAnswers = {};
const quizResults = {};
const codeResults = {};
const codeValues  = {};
const solvedBlockly = {};
const gameStates  = {};

let nbQuiz = 0, nbCode = 0, nbJeux = 0;

for (const b of blocs ?? []) {
  const c = b.content ?? {};

  if (b.type === "quiz") {
    const questions = c.questions ?? [];
    questions.forEach((q, i) => {
      const cle = `${b.id}-${i}`;
      quizAnswers[cle] = q.answer ?? 0;   // l'index correct, lu dans le contenu
      quizResults[cle] = true;
      nbQuiz++;
    });
  }

  if (b.type === "code_challenge") {
    codeResults[b.id] = true;
    // On garde le code de départ : il n'y a pas de « bonne » solution unique,
    // et inventer un programme au nom de l'élève serait un faux.
    if (c.starter_code) codeValues[b.id] = c.starter_code;
    nbCode++;
  }

  if (b.type === "game" || b.type === "blockly") {
    solvedBlockly[b.id] = true;
    nbJeux++;
  }
}

const progression = { quizAnswers, quizResults, codeResults, codeValues, solvedBlockly, gameStates };

// ── Écrire ───────────────────────────────────────────────────────────────────
const { data: existant } = await db.from("lesson_progress")
  .select("id, status, block_progress").eq("student_id", eleve.id).eq("lesson_id", lessonId).maybeSingle();

// Ce que l'élève a déjà tapé lui-même est conservé.
const fusion = {
  ...progression,
  gameStates: { ...(existant?.block_progress?.gameStates ?? {}) },
  codeValues: { ...codeValues, ...(existant?.block_progress?.codeValues ?? {}) },
};

const up = await db.from("lesson_progress").upsert({
  student_id: eleve.id,
  lesson_id:  lessonId,
  status:     "completed",
  score:      100,
  attempts:   1,
  completed_at: new Date().toISOString(),
  block_progress: fusion,
}, { onConflict: "student_id,lesson_id" });
if (up.error) { console.error("ÉCHEC lesson_progress :", up.error.message); process.exit(1); }

// XP : la récompense de la leçon, une seule fois.
let xpAjoute = 0;
if (existant?.status !== "completed") {
  xpAjoute = lecon.xp_reward ?? 50;
  const nx = (eleve.xp ?? 0) + xpAjoute;
  // level_num n'est jamais touché : c'est le niveau pédagogique de l'admin.
  const r = await db.from("students").update({ xp: nx, points: nx }).eq("id", eleve.id);
  if (r.error) console.error("XP non ajoutée :", r.error.message);
}

console.log(`✓ ${profil.display_name} — « ${lecon.title} »`);
console.log(`  ${nbQuiz} réponses de quiz · ${nbCode} défis de code · ${nbJeux} jeux`);
console.log(`  statut : completed · score 100 · +${xpAjoute} XP (total ${(eleve.xp ?? 0) + xpAjoute})`);
