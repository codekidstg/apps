"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { ThemeId } from "./themes";

const CodeEditor = dynamic(() => import("./CodeEditor"), { ssr: false });

type RunStatus = "idle" | "loading_pyodide" | "running" | "waiting_input" | "success" | "test_failed" | "error";

type Props = {
  starterCode: string;
  initialCode?: string;    // code restauré depuis sauvegarde
  onCodeChange?: (code: string) => void; // appelé à chaque frappe
  hiddenTests?: string;
  expectedOutput?: string;
  onSuccess?: () => void;
  language?: "python" | "javascript" | "html";
  readOnly?: boolean;
  /**
   * Atelier libre : aucun verdict, et un bouton pour arrêter. Dans un éditeur
   * où l'enfant décide, `while True:` arrive le premier jour.
   */
  libre?: boolean;
  /** L'habit de l'éditeur, choisi par l'enfant dans son atelier. */
  theme?: ThemeId;
  /**
   * Comment afficher ce que le programme écrit. L'atelier y glisse un écran de
   * téléphone ou d'ordinateur ; les erreurs et les questions restent en clair,
   * en dessous, là où elles se lisent.
   */
  rendreSortie?: (stdout: string, enMarche: boolean, recolte: Record<string, unknown> | null) => React.ReactNode;
  /**
   * Code exécuté avant celui de l'enfant. C'est lui qui définit les commandes
   * d'une scène — `tirer()`, `encaisser()` — et le journal qu'elles remplissent.
   */
  prelude?: string;
  /** Variables Python à ramener après l'exécution, le journal en tête. */
  collect?: string[];
  /**
   * Le résultat d'une exécution réussie. L'atelier l'enregistre : c'est lui
   * que verra le parent au bout du lien, avant que Python ne se charge chez
   * lui. Sans ça, l'écran partagé reste vide pour toujours.
   */
  onSortie?: (stdout: string) => void;
  /**
   * Page partagée : le parent vient jouer, pas lire. L'éditeur disparaît, il
   * ne reste que le bouton et l'écran.
   */
  cacherEditeur?: boolean;
  /** Le mot sur le bouton : « Exécuter » pour l'enfant, « Jouer » pour le parent. */
  libelleLancer?: string;
};

let workerInstance: Worker | null = null;
function getWorker(): Worker {
  if (!workerInstance) {
    workerInstance = new Worker(new URL("../../workers/pyodide.worker.ts", import.meta.url), {
      type: "module",
    });
  }
  return workerInstance;
}

/**
 * L'avertissement « ~6 Mo » ne concerne que le premier téléchargement, et il
 * n'y en a qu'un par page ouverte. Dans l'atelier, changer de programme remonte
 * l'éditeur à neuf : l'enfant le revoyait à chaque fois, alors que Python était
 * déjà là et que rien n'allait être téléchargé. Hors du composant, donc.
 */
let avertissementVu = false;

/**
 * Arrêter pour de bon.
 *
 * Le message « cancel » oublie le contexte du run, mais il n'interrompt pas un
 * programme déjà parti : Pyodide exécute le code d'un seul tenant, et une
 * boucle sans fin ne rend jamais la main. Seul l'arrêt du worker la coupe. Le
 * suivant sera recréé au prochain lancement — Python se recharge depuis le
 * cache, sans nouvelle consommation de données.
 */
function arreterWorker() {
  workerInstance?.terminate();
  workerInstance = null;
}

export default function PythonRunner({
  starterCode,
  initialCode,
  onCodeChange,
  hiddenTests,
  expectedOutput,
  onSuccess,
  language = "python",
  readOnly = false,
  libre = false,
  theme,
  rendreSortie,
  prelude,
  collect,
  onSortie,
  cacherEditeur = false,
  libelleLancer = "Exécuter",
}: Props) {
  const [code, setCode] = useState(initialCode ?? starterCode);

  function handleCodeChange(newCode: string) {
    setCode(newCode);
    onCodeChange?.(newCode);
  }
  const [status, setStatus]     = useState<RunStatus>("idle");
  const [stdout, setStdout]     = useState("");
  const [recolte, setRecolte]   = useState<Record<string, unknown> | null>(null);
  const [errMsg, setErrMsg]     = useState("");
  const [hintMsg, setHintMsg]   = useState("");
  const [passed, setPassed]     = useState(false);
  const [swReady, setSwReady]   = useState(false);
  const [dataWarning, setDataWarning] = useState(!avertissementVu); // une fois par page
  const pendingRun = useRef(false);
  // Saisie interactive : le programme est suspendu tant que l'enfant n'a pas répondu
  const [inputPrompt, setInputPrompt] = useState<string | null>(null);
  const [inputValue, setInputValue]   = useState("");
  const runIdRef  = useRef<string | null>(null);
  const inputRef  = useRef<HTMLInputElement | null>(null);

  // Register Service Worker for Pyodide cache
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then(() => setSwReady(true))
        .catch(() => setSwReady(true)); // still work without SW
    } else {
      setSwReady(true);
    }
  }, []);

  const runCode = useCallback(() => {
    if (status === "loading_pyodide" || status === "running") return;
    setStatus("loading_pyodide");
    setStdout("");
    setRecolte(null);
    setErrMsg("");
    setHintMsg("");
    setPassed(false);
    setInputPrompt(null);
    setInputValue("");

    const worker = getWorker();
    const id = Math.random().toString(36).slice(2);
    runIdRef.current = id;

    function handleMessage(e: MessageEvent) {
      if (e.data.id !== id) return;

      if (e.data.type === "loading") {
        setStatus("running");
        return;
      }

      // Le programme réclame une saisie : on garde l'écoute, il n'est pas terminé
      if (e.data.type === "input_request") {
        setStdout(e.data.stdout as string);
        setInputPrompt((e.data.prompt as string) || "…");
        setStatus("waiting_input");
        setTimeout(() => inputRef.current?.focus(), 50);
        return;
      }

      worker.removeEventListener("message", handleMessage);

      if (e.data.type === "test_failed") {
        setStdout(e.data.stdout as string);
        // Le journal arrive même quand le test échoue : la bassine qui déborde
        // doit se voir, c'est elle qui explique pourquoi c'est raté.
        setRecolte((e.data.collected as Record<string, unknown>) ?? null);
        setHintMsg(e.data.hint as string);
        setStatus("test_failed");
      } else if (e.data.type === "success") {
        const out = e.data.stdout as string;
        setStdout(out);
        setRecolte((e.data.collected as Record<string, unknown>) ?? null);
        onSortie?.(out);

        // Check expected output if no hidden tests
        const ok = expectedOutput
          ? out.trim() === expectedOutput.trim()
          : true; // hidden tests would throw on failure

        setPassed(ok);
        setStatus("success");
        if (ok) onSuccess?.();
      } else {
        setErrMsg(e.data.error as string);
        setStatus("error");
      }
    }

    worker.addEventListener("message", handleMessage);
    worker.postMessage({ id, type: "run", code, tests: hiddenTests, prelude, collect });
  }, [code, hiddenTests, expectedOutput, onSuccess, onSortie, status, prelude, collect]);

  function submitInput() {
    const id = runIdRef.current;
    if (!id || inputPrompt === null) return;
    setStdout(prev => `${prev}${prev ? "\n" : ""}${inputPrompt}${inputValue}`);
    setInputPrompt(null);
    setStatus("running");
    getWorker().postMessage({ id, type: "input", value: inputValue });
    setInputValue("");
  }

  function handleRunClick() {
    if (dataWarning) {
      avertissementVu = true;
      setDataWarning(false);
      pendingRun.current = true;
      return;
    }
    runCode();
  }

  // After dismissing the warning
  useEffect(() => {
    if (!dataWarning && pendingRun.current) {
      pendingRun.current = false;
      runCode();
    }
  }, [dataWarning, runCode]);

  const isLoading = status === "loading_pyodide" || status === "running" || status === "waiting_input";

  return (
    <div className="space-y-3">
      {/* Avertissement data (1re fois uniquement) */}
      {dataWarning && (
        <div className="bg-amber-900/30 border border-amber-700/60 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-amber-400 text-lg shrink-0">📡</span>
          <div className="flex-1">
            <div className="text-sm font-bold text-amber-300">Chargement de l'environnement Python</div>
            <div className="text-xs text-amber-500 mt-0.5">
              ~6 Mo au premier lancement. Conseillé en Wi-Fi. Gratuit ensuite (mis en cache).
            </div>
          </div>
          <button
            onClick={() => { avertissementVu = true; setDataWarning(false); pendingRun.current = true; }}
            className="text-xs font-black text-amber-300 bg-amber-800/60 hover:bg-amber-700/60 px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            OK, lancer
          </button>
        </div>
      )}

      {/* Éditeur */}
      {!cacherEditeur && (
        <CodeEditor
          value={code}
          onChange={handleCodeChange}
          language={language}
          readOnly={readOnly}
          minHeight="180px"
          theme={theme}
        />
      )}

      {/* Barre d'actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleRunClick}
          disabled={isLoading || !swReady}
          className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black px-5 py-2.5 rounded-xl transition-colors"
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⟳</span>
              {status === "loading_pyodide" ? "Chargement Python…" : "Exécution…"}
            </>
          ) : (
            <> ▶ {libelleLancer}</>
          )}
        </button>

        {isLoading && (
          <button
            onClick={() => {
              arreterWorker();
              runIdRef.current = null;
              setInputPrompt(null);
              setStatus("idle");
              setErrMsg("Programme arrêté.");
            }}
            className="text-xs font-black text-red-300 bg-red-900/50 hover:bg-red-800/60 px-3 py-2 rounded-xl transition-colors"
          >
            ■ Arrêter
          </button>
        )}

        {/* « Réinitialiser » veut dire « revenir au code de départ de l'exercice ».
            Dans l'atelier il n'y a pas d'exercice : le code de départ est celui
            que l'enfant est en train d'écrire, et le bouton ne faisait rien. */}
        {!libre && (
          <button
            onClick={() => setCode(starterCode)}
            className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors"
          >
            ↺ Réinitialiser
          </button>
        )}

        {!libre && status === "success" && passed && (
          <span className="text-xs font-black text-emerald-400 animate-pulse">✅ Bravo !</span>
        )}
        {!libre && status === "success" && !passed && expectedOutput && (
          <span className="text-xs font-black text-amber-400">⚠ Résultat inattendu</span>
        )}
        {!libre && status === "test_failed" && (
          <span className="text-xs font-black text-amber-400">💡 Pas encore…</span>
        )}
      </div>

      {/* L'écran de l'atelier : il ne montre que ce que le programme affiche. */}
      {rendreSortie && !errMsg && rendreSortie(stdout, isLoading, recolte)}

      {/* Console output */}
      {((stdout && !rendreSortie) || errMsg || hintMsg) && (
        <div className={`rounded-xl border font-mono text-sm p-4 whitespace-pre-wrap ${
          status === "error"
            ? "bg-red-950/40 border-red-800 text-red-300"
            : status === "test_failed"
            ? "bg-amber-950/40 border-amber-800 text-amber-200"
            : "bg-slate-900 border-slate-700 text-slate-200"
        }`}>
          {errMsg ? (
            // La phrase française d'abord, la trace Python repliée dessous :
            // « SyntaxError: unterminated string literal » ne dit rien à un
            // enfant de douze ans, et c'est pourtant ce qu'il lisait en premier.
            (() => {
              const [brut, francais] = errMsg.split("\n\n💡 ");
              return (
                <>
                  <span className="text-red-400 font-black block mb-1">❌ Ton programme s&apos;est arrêté</span>
                  {francais ? (
                    <>
                      <p className="font-sans text-base text-red-200 mb-2">{francais}</p>
                      <details>
                        <summary className="cursor-pointer list-none text-xs font-sans font-bold text-red-400/70 hover:text-red-300">
                          Voir ce que Python a répondu
                        </summary>
                        <div className="mt-2 text-xs text-red-300/80">{brut}</div>
                      </details>
                    </>
                  ) : brut}
                </>
              );
            })()
          ) : hintMsg ? (
            <>
              {stdout && !rendreSortie && <div className="text-slate-400 mb-3 pb-3 border-b border-amber-900">{stdout}</div>}
              <span className="text-amber-400 font-black block mb-1">💡 Indice</span>
              {hintMsg}
            </>
          ) : stdout}
        </div>
      )}

      {/* Saisie interactive — le programme attend la réponse de l'enfant */}
      {inputPrompt !== null && (
        <div className="rounded-xl border border-emerald-700 bg-slate-900 p-3 space-y-2">
          <div className="text-xs font-black text-emerald-400">⌨️ Ton programme te demande quelque chose</div>
          {/* Sur un téléphone, les trois éléments côte à côte débordaient : un
              champ de texte refuse de descendre sous sa largeur minimale, et
              c'est le bouton — le dernier — qui sortait de l'écran. L'intitulé
              prend donc sa propre ligne, et le champ a le droit de rétrécir. */}
          {inputPrompt !== "…" && (
            <div className="font-mono text-sm text-slate-300 break-words">{inputPrompt}</div>
          )}
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); submitInput(); } }}
              placeholder="Tape ta réponse puis Entrée"
              className="flex-1 min-w-0 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 font-mono text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />
            <button
              onClick={submitInput}
              className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black px-4 py-2 rounded-lg transition-colors shrink-0"
            >
              Envoyer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
