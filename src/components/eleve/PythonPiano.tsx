"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Piano, NOTES, NOTE_FREQ, NOTE_LABEL, audioCtx, jouerSon, normaliseNote, type Note,
} from "./piano";

const CodeEditor = dynamic(() => import("@/components/editor/CodeEditor"), { ssr: false });

let workerInstance: Worker | null = null;
function getWorker() {
  if (!workerInstance) {
    workerInstance = new Worker(new URL("../../workers/pyodide.worker.ts", import.meta.url), { type: "module" });
  }
  return workerInstance;
}

export type PianoConfig = {
  title?: string;
  instructions?: string;
  starter_code?: string;
  /** Mélodie attendue. Absente : composition libre. */
  target?: string[];
  /** Composition libre : nombre de notes minimum. */
  min_notes?: number;
  /** Objectif de concision, comme le labyrinthe. */
  par?: number;
  /** Millisecondes par note. */
  tempo?: number;
};

/**
 * Le piano piloté en Python.
 *
 * Le code de l'enfant ne joue rien pendant qu'il s'exécute : il remplit une
 * liste de notes, que l'on rejoue ensuite au tempo. Même principe que le
 * labyrinthe — Python produit un journal, l'écran le déroule. C'est ce qui
 * permet d'entendre le programme au rythme de la musique et non à celui,
 * instantané, de la machine.
 */
export default function PythonPiano({
  config, done, onSolved, savedCode, onCodeChange,
}: {
  config: PianoConfig;
  done: boolean;
  onSolved: () => void;
  savedCode?: string;
  onCodeChange?: (c: string) => void;
}) {
  const [code, setCode]       = useState(savedCode ?? config.starter_code ?? 'jouer("Do")\n');
  const [status, setStatus]   = useState<"idle" | "loading" | "running" | "playing" | "ko" | "ok">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [sortie, setSortie]   = useState("");
  const [active, setActive]   = useState<Note | null>(null);
  const [lignes, setLignes]   = useState(0);
  const [reussi, setReussi]   = useState(done);

  const timers = useRef<number[]>([]);
  const tempo  = config.tempo ?? 420;

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  function stoppe() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setActive(null);
  }

  /** Déroule la mélodie produite : une touche s'allume, une note sonne. */
  function joue(notes: (Note | null)[], apres: () => void) {
    stoppe();
    setStatus("playing");
    const ctx = audioCtx();
    if (ctx.state === "suspended") ctx.resume();

    notes.forEach((n, i) => {
      timers.current.push(window.setTimeout(() => {
        setActive(n);
        if (n) jouerSon(NOTE_FREQ[n], tempo * 0.9, ctx);
      }, i * tempo));
    });
    timers.current.push(window.setTimeout(() => { setActive(null); apres(); }, notes.length * tempo + 120));
  }

  /** Compare la mélodie jouée à la mélodie attendue et dit *où* ça diverge. */
  function verdict(brutes: string[]): { ok: boolean; msg: string } {
    if (config.target?.length) {
      const attendu = config.target.map(normaliseNote);
      const obtenu  = brutes.map(normaliseNote);
      if (obtenu.length === attendu.length && attendu.every((n, i) => n === obtenu[i])) {
        return { ok: true, msg: "Mélodie exacte 🎶" };
      }
      const i = attendu.findIndex((n, k) => n !== obtenu[k]);
      if (i === -1 && obtenu.length > attendu.length) {
        return { ok: false, msg: `Trop de notes : ${obtenu.length} au lieu de ${attendu.length}.` };
      }
      if (i === -1) {
        return { ok: false, msg: `Il manque des notes : ${obtenu.length} sur ${attendu.length}.` };
      }
      // silence() produit une entrée vide : la nommer « un silence » plutôt que
      // « rien », sans quoi le message ne dit pas ce qu'il faut ajouter.
      const nom = (n: Note | null | undefined, absent: string) =>
        n ? NOTE_LABEL[n] : absent;
      const att = nom(attendu[i], "un silence");
      const obt = nom(obtenu[i],  obtenu.length > i ? "un silence" : "plus rien");
      const de = /^[aeiouâàéèêîôû]/i.test(att) ? "d'" : "de ";
      return { ok: false, msg: `Couac au ${i + 1}${i === 0 ? "er" : "e"} temps : ${obt} au lieu ${de}${att}.` };
    }

    const mini = config.min_notes ?? 1;
    if (brutes.length < mini) {
      return { ok: false, msg: `Ta mélodie fait ${brutes.length} note${brutes.length > 1 ? "s" : ""} — il en faut au moins ${mini}.` };
    }
    return { ok: true, msg: `Belle mélodie — ${brutes.length} notes 🎶` };
  }

  function lance() {
    if (status === "loading" || status === "running" || status === "playing") return;
    stoppe();
    setMessage(null);
    setSortie("");
    setStatus("loading");
    setLignes(code.split("\n").filter(l => l.trim() && !l.trim().startsWith("#")).length);

    const worker = getWorker();
    const id = Math.random().toString(36).slice(2);

    function onMessage(e: MessageEvent) {
      if (e.data.id !== id) return;
      if (e.data.type === "loading") { setStatus("running"); return; }
      worker.removeEventListener("message", onMessage);

      if (e.data.type === "error") {
        setStatus("ko");
        setMessage(String(e.data.error ?? "Le programme s'est arrêté."));
        return;
      }

      setSortie(String(e.data.stdout ?? ""));
      const brutes = (e.data.collected?._notes ?? []) as string[];

      if (!brutes.length) {
        setStatus("ko");
        setMessage("Aucune note n'a été jouée. As-tu appelé jouer(...) ?");
        return;
      }

      const notes = brutes.map(normaliseNote);
      joue(notes, () => {
        const v = verdict(brutes);
        setStatus(v.ok ? "ok" : "ko");
        setMessage(v.msg);
        if (v.ok && !reussi) { setReussi(true); onSolved(); }
      });
    }

    worker.addEventListener("message", onMessage);
    worker.postMessage({
      id, type: "run", code,
      prelude: PRELUDE,
      collect: ["_notes"],
    });
  }

  const etoiles = config.par ? (lignes <= config.par ? 3 : lignes <= config.par * 1.6 ? 2 : 1) : 0;
  const occupe  = status === "loading" || status === "running" || status === "playing";

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: "#1e293b", border: "1px solid #334155" }}>
      <div className="flex items-center gap-2">
        <span className="text-xl">🎹</span>
        <span className="font-black text-white">{config.title ?? "Le piano"}</span>
        {reussi && (
          <span className="ml-auto text-xs font-mono font-black px-2 py-0.5 rounded-full"
            style={{ background: "#10b98120", color: "#10b981", border: "1px solid #10b98140" }}>✅ Réussi</span>
        )}
      </div>

      {config.instructions && <p className="text-sm text-slate-300">{config.instructions}</p>}

      <div className="rounded-xl py-5 px-3 overflow-x-auto" style={{ background: "#0f172a", border: "1px solid #334155" }}>
        <Piano noteActive={active} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <CodeEditor value={code} onChange={(v: string) => { setCode(v); onCodeChange?.(v); }} minHeight="220px" />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={lance} disabled={occupe}
              className="px-4 py-2 rounded-xl text-sm font-black text-white transition-opacity disabled:opacity-40"
              style={{ background: "#10b981" }}>
              {status === "loading" ? "Chargement…" : status === "playing" ? "🎵 En cours…" : "▶ Jouer"}
            </button>
            <button onClick={() => { stoppe(); setCode(config.starter_code ?? ""); setStatus("idle"); setMessage(null); setSortie(""); }}
              disabled={occupe}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors disabled:opacity-40">
              ↺ Recommencer
            </button>
            {config.par && (
              <span className="text-xs font-mono text-slate-500">
                Objectif : {config.par} lignes {lignes > 0 && `· ${lignes} écrite${lignes > 1 ? "s" : ""}`}
              </span>
            )}
          </div>

          <div className="text-xs font-mono text-slate-500">
            jouer(&quot;Do&quot;) · silence() · notes : {NOTES.map(n => NOTE_LABEL[n]).join(" ")}
          </div>

          {sortie.trim() && (
            <pre className="rounded-xl p-3 text-xs font-mono whitespace-pre-wrap max-h-28 overflow-y-auto"
              style={{ background: "#0f172a", color: "#93c5fd", border: "1px solid #334155" }}>{sortie.trim()}</pre>
          )}

          {message && (
            <div className="rounded-xl px-4 py-3 text-sm font-bold"
              style={
                status === "ok"
                  ? { background: "#10b98115", color: "#10b981", border: "1px solid #10b98140" }
                  : { background: "#ef444415", color: "#fca5a5", border: "1px solid #ef444440" }
              }>
              {message}
              {status === "ok" && config.par && (
                <div className="mt-1 text-xs font-mono opacity-80">
                  {lignes} ligne{lignes > 1 ? "s" : ""} · {"⭐".repeat(etoiles)}{"☆".repeat(3 - etoiles)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * `jouer` n'émet aucun son : il note. La lecture vient après, à l'écran.
 * La limite de 200 notes évite qu'une boucle sans fin fabrique une mélodie
 * infinie — le pendant du garde-fou à 400 pas du labyrinthe.
 */
const PRELUDE = `
_notes = []

class _TropDeNotes(Exception):
    pass

_VALIDES = {"do": "Do", "re": "Re", "ré": "Re", "mi": "Mi", "fa": "Fa",
            "sol": "Sol", "la": "La", "si": "Si"}

def jouer(note):
    if len(_notes) >= 200:
        raise _TropDeNotes()
    cle = str(note).strip().lower()
    if cle not in _VALIDES:
        raise ValueError("Note inconnue : " + str(note) + ". Choisis parmi Do Re Mi Fa Sol La Si.")
    _notes.append(_VALIDES[cle])

def silence():
    if len(_notes) >= 200:
        raise _TropDeNotes()
    _notes.append("")
`;
