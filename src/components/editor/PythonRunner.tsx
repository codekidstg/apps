"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";

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

export default function PythonRunner({
  starterCode,
  initialCode,
  onCodeChange,
  hiddenTests,
  expectedOutput,
  onSuccess,
  language = "python",
  readOnly = false,
}: Props) {
  const [code, setCode] = useState(initialCode ?? starterCode);

  function handleCodeChange(newCode: string) {
    setCode(newCode);
    onCodeChange?.(newCode);
  }
  const [status, setStatus]     = useState<RunStatus>("idle");
  const [stdout, setStdout]     = useState("");
  const [errMsg, setErrMsg]     = useState("");
  const [hintMsg, setHintMsg]   = useState("");
  const [passed, setPassed]     = useState(false);
  const [swReady, setSwReady]   = useState(false);
  const [dataWarning, setDataWarning] = useState(true); // show on first run
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
        setHintMsg(e.data.hint as string);
        setStatus("test_failed");
      } else if (e.data.type === "success") {
        const out = e.data.stdout as string;
        setStdout(out);

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
    worker.postMessage({ id, type: "run", code, tests: hiddenTests });
  }, [code, hiddenTests, expectedOutput, onSuccess, status]);

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
            onClick={() => { setDataWarning(false); pendingRun.current = true; }}
            className="text-xs font-black text-amber-300 bg-amber-800/60 hover:bg-amber-700/60 px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            OK, lancer
          </button>
        </div>
      )}

      {/* Éditeur */}
      <CodeEditor
        value={code}
        onChange={handleCodeChange}
        language={language}
        readOnly={readOnly}
        minHeight="180px"
      />

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
            <> ▶ Exécuter</>
          )}
        </button>

        <button
          onClick={() => setCode(starterCode)}
          className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors"
        >
          ↺ Réinitialiser
        </button>

        {status === "success" && passed && (
          <span className="text-xs font-black text-emerald-400 animate-pulse">✅ Bravo !</span>
        )}
        {status === "success" && !passed && expectedOutput && (
          <span className="text-xs font-black text-amber-400">⚠ Résultat inattendu</span>
        )}
        {status === "test_failed" && (
          <span className="text-xs font-black text-amber-400">💡 Pas encore…</span>
        )}
      </div>

      {/* Console output */}
      {(stdout || errMsg || hintMsg) && (
        <div className={`rounded-xl border font-mono text-sm p-4 whitespace-pre-wrap ${
          status === "error"
            ? "bg-red-950/40 border-red-800 text-red-300"
            : status === "test_failed"
            ? "bg-amber-950/40 border-amber-800 text-amber-200"
            : "bg-slate-900 border-slate-700 text-slate-200"
        }`}>
          {errMsg ? (
            <>
              <span className="text-red-400 font-black block mb-1">❌ Erreur Python</span>
              {errMsg}
            </>
          ) : hintMsg ? (
            <>
              {stdout && <div className="text-slate-400 mb-3 pb-3 border-b border-amber-900">{stdout}</div>}
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
          <div className="flex items-center gap-2">
            {inputPrompt !== "…" && (
              <span className="font-mono text-sm text-slate-300 shrink-0">{inputPrompt}</span>
            )}
            <input
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); submitInput(); } }}
              placeholder="Tape ta réponse puis Entrée"
              className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 font-mono text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
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
