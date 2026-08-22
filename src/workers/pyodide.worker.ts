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

function cleanError(msg: string): string {
  return msg.replace(/File "<exec>", /g, "").replace(/\s+\^+\s*/g, "\n");
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
