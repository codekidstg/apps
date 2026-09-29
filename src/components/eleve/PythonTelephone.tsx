"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const CodeEditor = dynamic(() => import("@/components/editor/CodeEditor"), { ssr: false });

let workerInstance: Worker | null = null;
function getWorker() {
  if (!workerInstance) {
    workerInstance = new Worker(new URL("../../workers/pyodide.worker.ts", import.meta.url), { type: "module" });
  }
  return workerInstance;
}

export type TelephoneConfig = {
  title?: string;
  instructions?: string;
  starter_code?: string;
  /** Nombre minimum de contacts affichés à l'écran. */
  min_contacts?: number;
  /** Mots qui doivent apparaître sur l'écran — le message d'un contact absent, par exemple. */
  doit_afficher?: string[];
  /** Objectif de concision, comme le labyrinthe. */
  par?: number;
};

type Ligne =
  | { type: "contact"; nom: string; numero: string }
  | { type: "message"; texte: string };

/**
 * Le téléphone piloté en Python.
 *
 * Ce moteur existe pour un moment précis : le jalon se présente DEVANT UN
 * PARENT. Entre une console noire pleine de texte et un téléphone qui affiche
 * des contacts, la différence, pour quelqu'un qui ne code pas, c'est « mon
 * enfant tape des trucs » ou « mon enfant a fait une application ».
 *
 * Règle qui tient tout : **le téléphone est un cadre, pas un programme.** Il ne
 * décide de rien, il ne met rien en forme tout seul. Tout ce qui s'affiche
 * dedans vient des trois appels que l'enfant écrit lui-même :
 *
 *     ecran.titre("Le carnet de Samuel")
 *     ecran.contact("Ama", "90 12 34 56")
 *     ecran.message("Contact inconnu")
 *
 * Sans ça, l'enfant présenterait le travail de quelqu'un d'autre — et il le
 * saurait.
 *
 * La console reste affichée à côté : le téléphone montre le résultat, la
 * console montre ce qui s'est passé. Un enfant qui débogue a besoin des deux.
 */
export default function PythonTelephone({
  config, done, onSolved, savedCode, onCodeChange,
}: {
  config: TelephoneConfig;
  done: boolean;
  onSolved: () => void;
  savedCode?: string;
  onCodeChange?: (c: string) => void;
}) {
  const [code, setCode]     = useState(savedCode ?? config.starter_code ?? 'ecran.titre("Mon carnet")\n');
  const [status, setStatus] = useState<"idle" | "loading" | "running" | "saisie" | "ko" | "ok">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [sortie, setSortie]   = useState("");
  const [titre, setTitre]     = useState("");
  const [lignes, setLignes]   = useState<Ligne[]>([]);
  const [reussi, setReussi]   = useState(done);

  // La saisie : le programme s'arrête et attend une réponse. C'est ce qui rend
  // la démonstration vivante — le parent donne un nom, l'enfant le tape.
  const [invite, setInvite]   = useState<string | null>(null);
  const [saisie, setSaisie]   = useState("");
  const champ = useRef<HTMLInputElement | null>(null);
  const idCourant = useRef<string | null>(null);

  useEffect(() => { if (invite !== null) setTimeout(() => champ.current?.focus(), 50); }, [invite]);

  function verdict(t: string, l: Ligne[]): { ok: boolean; msg: string } {
    const contacts = l.filter((x) => x.type === "contact").length;
    const mini = config.min_contacts ?? 0;
    if (mini && contacts < mini) {
      return { ok: false, msg: `Ton écran affiche ${contacts} contact${contacts > 1 ? "s" : ""} — il en faut au moins ${mini}.` };
    }
    const ecrit = (t + " " + l.map((x) => (x.type === "contact" ? `${x.nom} ${x.numero}` : x.texte)).join(" ")).toLowerCase();
    for (const mot of config.doit_afficher ?? []) {
      if (!ecrit.includes(mot.toLowerCase())) {
        return { ok: false, msg: `Il manque « ${mot} » sur l'écran. Relis la consigne : tous les cas doivent s'afficher.` };
      }
    }
    if (!t.trim()) return { ok: false, msg: "Ton téléphone n'a pas de titre. Commence par ecran.titre(...)." };
    return { ok: true, msg: "Ton carnet s'affiche — montre-le 📱" };
  }

  function terminer(collecte: any, stdout: string) {
    const t = String(collecte?.titre ?? "");
    const l = (collecte?.lignes ?? []) as Ligne[];
    setTitre(t); setLignes(l); setSortie(stdout);
    if (!t && !l.length) {
      setStatus("ko");
      setMessage("L'écran est resté vide. As-tu appelé ecran.titre(...) et ecran.contact(...) ?");
      return;
    }
    const v = verdict(t, l);
    setStatus(v.ok ? "ok" : "ko");
    setMessage(v.msg);
    if (v.ok && !reussi) { setReussi(true); onSolved(); }
  }

  function lance() {
    if (status === "loading" || status === "running" || status === "saisie") return;
    setMessage(null); setSortie(""); setTitre(""); setLignes([]);
    setStatus("loading");

    const worker = getWorker();
    const id = Math.random().toString(36).slice(2);
    idCourant.current = id;

    function onMessage(e: MessageEvent) {
      if (e.data.id !== id) return;
      if (e.data.type === "loading") { setStatus("running"); return; }

      // Le programme réclame une saisie : il n'est pas fini, on garde l'écoute.
      if (e.data.type === "input_request") {
        setSortie(String(e.data.stdout ?? ""));
        setInvite(String(e.data.prompt ?? "…"));
        setStatus("saisie");
        return;
      }

      worker.removeEventListener("message", onMessage);
      if (e.data.type === "error") {
        setStatus("ko");
        setMessage(String(e.data.error ?? "Le programme s'est arrêté."));
        return;
      }
      terminer(e.data.collected?._ecran, String(e.data.stdout ?? ""));
    }

    worker.addEventListener("message", onMessage);
    worker.postMessage({ id, type: "run", code, prelude: PRELUDE, collect: ["_ecran"] });
  }

  function repondre() {
    const id = idCourant.current;
    if (!id || invite === null) return;
    setSortie((p) => `${p}${p ? "\n" : ""}${invite}${saisie}`);
    setInvite(null);
    setStatus("running");
    getWorker().postMessage({ id, type: "input", value: saisie });
    setSaisie("");
  }

  const occupe = status === "loading" || status === "running";

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: "#1e293b", border: "1px solid #334155" }}>
      <div className="flex items-center gap-2">
        <span className="text-xl">📱</span>
        <span className="font-black text-white">{config.title ?? "Le téléphone"}</span>
        {reussi && (
          <span className="ml-auto text-xs font-mono font-black px-2 py-0.5 rounded-full"
            style={{ background: "#10b98120", color: "#10b981", border: "1px solid #10b98140" }}>✅ Réussi</span>
        )}
      </div>

      {config.instructions && <p className="text-sm text-slate-300 whitespace-pre-line">{config.instructions}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <CodeEditor value={code} onChange={(v: string) => { setCode(v); onCodeChange?.(v); }} minHeight="260px" />
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={lance} disabled={occupe || status === "saisie"}
              className="text-sm font-black px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
              style={{ background: "#10b981", color: "#052e16" }}>
              {occupe ? "…" : "▶ Lancer sur le téléphone"}
            </button>
            {message && (
              <span className="text-xs font-bold" style={{ color: status === "ok" ? "#10b981" : "#fca5a5" }}>{message}</span>
            )}
          </div>

          {/* La saisie : c'est là que le parent donne un nom et que l'enfant le tape. */}
          {invite !== null && (
            <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: "#0f172a", border: "1px solid #FDB81340" }}>
              <span className="font-mono text-sm shrink-0" style={{ color: "#FDB813" }}>{invite}</span>
              <input ref={champ} value={saisie} onChange={(e) => setSaisie(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") repondre(); }}
                className="flex-1 min-w-0 bg-transparent outline-none text-sm font-mono text-white" />
              <button onClick={repondre} className="text-xs font-black px-3 py-1 rounded-lg shrink-0"
                style={{ background: "#FDB813", color: "#0f172a" }}>OK</button>
            </div>
          )}

          {sortie && (
            <details className="rounded-xl overflow-hidden" style={{ background: "#0f172a", border: "1px solid #334155" }}>
              <summary className="px-3 py-2 text-xs font-bold cursor-pointer" style={{ color: "#94a3b8" }}>
                Console — ce qui s&apos;est passé
              </summary>
              <pre className="px-3 pb-3 text-xs font-mono whitespace-pre-wrap" style={{ color: "#cbd5e1" }}>{sortie}</pre>
            </details>
          )}
        </div>

        {/* ── Le téléphone ─────────────────────────────────────────────── */}
        <div className="flex justify-center">
          <div className="rounded-[2rem] p-2 shadow-2xl" style={{ background: "#0b1220", border: "3px solid #334155", width: 272 }}>
            <div className="rounded-[1.6rem] overflow-hidden" style={{ background: "#f8fafc", height: 420, display: "flex", flexDirection: "column" }}>
              {/* La barre du haut, et l'encoche */}
              <div className="relative flex items-center justify-between px-4 pt-2 pb-1 text-[10px] font-bold" style={{ color: "#64748b" }}>
                <span>9:41</span>
                <div className="absolute left-1/2 -translate-x-1/2 top-1 rounded-b-xl" style={{ width: 70, height: 14, background: "#0b1220" }} />
                <span>▮▮▮</span>
              </div>

              <div className="px-4 py-3" style={{ background: "#1B2D5E" }}>
                <div className="text-white font-black text-sm truncate">{titre || "—"}</div>
                <div className="text-[10px]" style={{ color: "#93c5fd" }}>
                  {lignes.filter((l) => l.type === "contact").length} contact{lignes.filter((l) => l.type === "contact").length > 1 ? "s" : ""}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {lignes.length === 0 ? (
                  <div className="h-full flex items-center justify-center px-6 text-center text-xs" style={{ color: "#94a3b8" }}>
                    Lance ton programme pour remplir l&apos;écran.
                  </div>
                ) : lignes.map((l, i) =>
                  l.type === "contact" ? (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                        style={{ background: "#1B2D5E15", color: "#1B2D5E" }}>
                        {l.nom.trim().charAt(0).toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate" style={{ color: "#0f172a" }}>{l.nom}</div>
                        <div className="text-xs font-mono" style={{ color: "#64748b" }}>{l.numero}</div>
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="mx-4 my-2 rounded-xl px-3 py-2 text-xs font-bold text-center"
                      style={{ background: "#fef3c7", color: "#92400e" }}>
                      {l.texte}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Les trois mots que l'enfant écrit. Pas un de plus : le téléphone dessine ce
 * qu'on lui donne, il n'invente rien.
 */
const PRELUDE = `
_ecran = {"titre": "", "lignes": []}

class _EcranPlein(Exception):
    pass

def _place(ligne):
    if len(_ecran["lignes"]) >= 60:
        raise _EcranPlein()
    _ecran["lignes"].append(ligne)

class _Ecran:
    def titre(self, texte):
        _ecran["titre"] = str(texte)

    def contact(self, nom, numero):
        _place({"type": "contact", "nom": str(nom), "numero": str(numero)})

    def message(self, texte):
        _place({"type": "message", "texte": str(texte)})

ecran = _Ecran()
`;
