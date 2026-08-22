// Web Worker — isole Pyodide du thread principal
/// <reference lib="webworker" />
declare const loadPyodide: (opts: { indexURL: string }) => Promise<PyodideInterface>;

interface PyodideInterface {
  runPythonAsync(code: string): Promise<unknown>;
  setStdout(opts: { batched: (s: string) => void }): void;
  setStderr(opts: { batched: (s: string) => void }): void;
  globals: { set: (k: string, v: unknown) => void; get: (k: string) => unknown };
}

const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.27.5/full/";

let pyodide: PyodideInterface | null = null;
let loading = false;
let loadPromise: Promise<void> | null = null;

async function initPyodide() {
  if (pyodide) return;
  if (loading) return loadPromise!;
  loading = true;
  loadPromise = (async () => {
    // Inject pyodide.js in worker scope
    importScripts(PYODIDE_URL + "pyodide.js");
    pyodide = await loadPyodide({ indexURL: PYODIDE_URL });
  })();
  await loadPromise;
}

/**
 * `input()` interactif sans SharedArrayBuffer.
 *
 * Pyodide tourne dans un worker et `input()` est synchrone : impossible d'attendre
 * la frappe de l'enfant depuis l'intérieur. On procède donc par rejeu — le code
 * est relancé depuis le début à chaque réponse, avec la liste des réponses déjà
 * données. Les programmes de ce niveau sont courts et Pyodide est déjà chargé,
 * donc le rejeu est imperceptible.
 *
 * La graine de `random` est figée pour la durée d'une exécution : sans elle,
 * « Devine le nombre » tirerait un nombre différent à chaque rejeu.
 */
const BOOTSTRAP = `
import builtins, json, random as _rnd

class _NeedInput(Exception):
    pass

_inputs = []
_cursor = 0
_last_prompt = ""

def _codekids_input(prompt=""):
    global _cursor, _last_prompt
    if _cursor < len(_inputs):
        v = _inputs[_cursor]
        _cursor += 1
        # Une seule ligne : le prompt et la réponse, comme dans un vrai terminal
        print(f"{prompt}{v}")
        return v
    _last_prompt = prompt
    raise _NeedInput()

builtins.input = _codekids_input
`;

type RunCtx = { code: string; tests?: string; inputs: string[]; seed: number };
const runs = new Map<string, RunCtx>();

/** Traduction courte des erreurs que rencontre un débutant, ajoutée sous le message réel. */
const INDICES: [RegExp, string][] = [
  [/unterminated string literal/,                 "Il manque un guillemet pour fermer le texte."],
  [/was never closed|unexpected EOF/,             "Il manque une parenthèse fermante."],
  [/NameError: name '([^']+)' is not defined/,    "Python ne connaît pas ce mot. Vérifie l'orthographe."],
  [/expected an indented block|unexpected indent|IndentationError/, "Le décalage au début de la ligne ne va pas."],
  [/can only concatenate str/,                    "Tu colles un texte et un nombre. Transforme le nombre en texte avec str(...)."],
  [/invalid literal for int/,                     "Ce texte ne peut pas devenir un nombre."],
  [/ZeroDivisionError/,                           "Tu divises par zéro — c'est impossible."],
  [/IndexError/,                                  "Tu demandes un élément qui n'existe pas dans la liste."],
  [/KeyError/,                                    "Cette clé n'existe pas dans le dictionnaire."],
  [/invalid syntax/,                              "Python n'a pas compris cette ligne. Regarde les guillemets, les parenthèses et les deux-points."],
];

/** Frames internes de Pyodide — sans intérêt pour l'élève, et effrayantes. */
const INTERNE = /_pyodide|\/lib\/python\d/;

function cleanError(msg: string): string {
  const lignes = msg.split("\n");
  const gardees: string[] = [];

  for (let i = 0; i < lignes.length; i++) {
    const l = lignes[i];
    if (/^\s*Traceback \(most recent call last\)/.test(l)) continue;
    // Ligne de chevrons seule : elle pointait une frame interne qu'on vient d'ôter
    if (/^\s*\^+\s*$/.test(l)) continue;
    if (INTERNE.test(l)) {
      // La ligne suivante est le code source de cette frame interne : on la saute aussi.
      if (i + 1 < lignes.length && /^\s{2,}\S/.test(lignes[i + 1]) && !INTERNE.test(lignes[i + 1])) i++;
      continue;
    }
    gardees.push(l.replace(/File "<exec>", /g, ""));
  }

  const propre = gardees.join("\n").replace(/\s+\^+\s*/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const indice = INDICES.find(([re]) => re.test(propre))?.[1];
  return indice ? `${propre}\n\n💡 ${indice}` : propre;
}

async function execute(id: string, ctx: RunCtx) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  pyodide!.setStdout({ batched: (s) => stdout.push(s) });
  pyodide!.setStderr({ batched: (s) => stderr.push(s) });

  // Réinjecte les réponses déjà données et refige la graine avant chaque rejeu
  await pyodide!.runPythonAsync(
    `_inputs = json.loads(${JSON.stringify(JSON.stringify(ctx.inputs))})\n` +
    `_cursor = 0\n` +
    `_rnd.seed(${ctx.seed})\n`
  );

  try {
    await pyodide!.runPythonAsync(ctx.code);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("_NeedInput")) {
      // Le programme réclame une saisie : on rend la main à l'interface
      const prompt = String(pyodide!.globals.get("_last_prompt") ?? "");
      postMessage({ id, type: "input_request", prompt, stdout: stdout.join("\n") });
      return;
    }
    runs.delete(id);
    postMessage({ id, type: "error", error: cleanError(msg) });
    return;
  }

  const capturedOutput = stdout.join("\n");

  // Tests cachés — `output` et `code` disponibles comme globales
  if (ctx.tests) {
    pyodide!.globals.set("output", capturedOutput);
    pyodide!.globals.set("code", ctx.code);
    try {
      await pyodide!.runPythonAsync(ctx.tests);
    } catch (testErr: unknown) {
      const msg = testErr instanceof Error ? testErr.message : String(testErr);
      if (msg.includes("AssertionError")) {
        const hint = msg.split("AssertionError:").pop()?.trim() ?? "Pas encore correct, réessaie !";
        runs.delete(id);
        postMessage({ id, type: "test_failed", stdout: capturedOutput, hint });
        return;
      }
      runs.delete(id);
      postMessage({ id, type: "error", error: cleanError(msg) });
      return;
    }
  }

  runs.delete(id);
  postMessage({ id, type: "success", stdout: capturedOutput, stderr: stderr.join("\n") });
}

self.addEventListener("message", async (e: MessageEvent) => {
  const { id, type, code, tests, value } = e.data as {
    id: string;
    type?: "run" | "input" | "cancel";
    code?: string;
    tests?: string;
    value?: string;
  };

  try {
    if (type === "cancel") { runs.delete(id); return; }

    if (type === "input") {
      const ctx = runs.get(id);
      if (!ctx) return;
      ctx.inputs.push(value ?? "");
      await execute(id, ctx);
      return;
    }

    // "run" (ou message sans type, pour compatibilité)
    postMessage({ id, type: "loading" });
    await initPyodide();
    await pyodide!.runPythonAsync(BOOTSTRAP);

    const ctx: RunCtx = {
      code: code ?? "",
      tests,
      inputs: [],
      seed: Math.floor(Math.random() * 1_000_000),
    };
    runs.set(id, ctx);
    await execute(id, ctx);
  } catch (err: unknown) {
    runs.delete(id);
    const msg = err instanceof Error ? err.message : String(err);
    postMessage({ id, type: "error", error: cleanError(msg) });
  }
});
