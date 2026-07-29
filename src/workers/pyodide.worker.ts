// Web Worker — isole Pyodide du thread principal
/// <reference lib="webworker" />
declare const loadPyodide: (opts: { indexURL: string }) => Promise<PyodideInterface>;

interface PyodideInterface {
  runPythonAsync(code: string): Promise<unknown>;
  setStdout(opts: { batched: (s: string) => void }): void;
  setStderr(opts: { batched: (s: string) => void }): void;
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

self.addEventListener("message", async (e: MessageEvent) => {
  const { id, code, tests } = e.data as {
    id: string;
    code: string;
    tests?: string; // hidden assert block appended after user code
  };

  try {
    postMessage({ id, type: "loading" });
    await initPyodide();

    const stdout: string[] = [];
    const stderr: string[] = [];
    pyodide!.setStdout({ batched: (s) => stdout.push(s) });
    pyodide!.setStderr({ batched: (s) => stderr.push(s) });

    // Phase 1 — run user code
    await pyodide!.runPythonAsync(code);
    const capturedOutput = stdout.join("\n");

    // Phase 2 — run hidden tests with `output` and `code` available as globals
    if (tests) {
      (pyodide as unknown as { globals: { set: (k: string, v: unknown) => void } })
        .globals.set("output", capturedOutput);
      (pyodide as unknown as { globals: { set: (k: string, v: unknown) => void } })
        .globals.set("code", code);
      try {
        await pyodide!.runPythonAsync(tests);
      } catch (testErr: unknown) {
        const msg = testErr instanceof Error ? testErr.message : String(testErr);
        // AssertionError = test échoué → message d'indice, pas d'erreur fatale
        if (msg.includes("AssertionError")) {
          const hint = msg.split("AssertionError:").pop()?.trim() ?? "Pas encore correct, réessaie !";
          postMessage({ id, type: "test_failed", stdout: capturedOutput, hint });
          return;
        }
        throw testErr; // autre erreur dans les tests → remonter normalement
      }
    }

    postMessage({
      id,
      type: "success",
      stdout: capturedOutput,
      stderr: stderr.join("\n"),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Clean up Pyodide stack traces for kids
    const clean = msg.replace(/File "<exec>", /g, "").replace(/\s+\^+\s*/g, "\n");
    postMessage({ id, type: "error", error: clean });
  }
});
