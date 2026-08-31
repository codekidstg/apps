/**
 * Attribue un identifiant aux comptes créés avant la migration 026.
 *
 * À lancer une seule fois, après avoir appliqué 026_username.sql :
 *     node scripts/backfill-usernames.mjs
 *
 * Ne touche ni aux adresses email ni aux mots de passe : les comptes existants
 * gardent leur connexion actuelle et gagnent simplement une seconde façon
 * d'entrer.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter(l => l.includes("="))
    .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const sansAccents = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const nettoie = s => sansAccents(s).toLowerCase()
  .replace(/['’]/g, "").replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

function identifiantDepuisNom(displayName) {
  const mots = (displayName ?? "").trim().split(/\s+/).filter(Boolean);
  if (mots.length === 0) return "";
  if (mots.length === 1) return nettoie(mots[0]);
  const prenom  = nettoie(mots.slice(0, -1).join(" "));
  const initiale = nettoie(mots[mots.length - 1]).charAt(0);
  return initiale ? `${prenom}.${initiale}` : prenom;
}

function libre(base, pris) {
  const b = base.toLowerCase();
  if (!pris.has(b)) return base;
  for (let i = 2; i < 1000; i++) if (!pris.has(`${b}${i}`)) return `${base}${i}`;
  return `${base}-${Date.now().toString(36)}`;
}

const { data, error } = await db.from("profiles").select("id, display_name, username").order("display_name");
if (error) {
  console.error("Échec :", error.message);
  console.error("La migration 026_username.sql a-t-elle été appliquée ?");
  process.exit(1);
}

const pris = new Set((data ?? []).map(p => (p.username ?? "").toLowerCase()).filter(Boolean));

for (const p of data ?? []) {
  if (p.username) { console.log(`  =  ${p.display_name} → ${p.username} (déjà défini)`); continue; }
  const base = identifiantDepuisNom(p.display_name ?? "");
  if (!base) { console.log(`  !  ${p.display_name} → nom inexploitable, ignoré`); continue; }
  const id = libre(base, pris);
  const r = await db.from("profiles").update({ username: id }).eq("id", p.id);
  if (r.error) { console.log(`  ✗  ${p.display_name} → ${r.error.message}`); continue; }
  pris.add(id.toLowerCase());
  console.log(`  ✓  ${p.display_name} → ${id}`);
}
