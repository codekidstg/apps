"use client";
import { useState, useEffect } from "react";

/**
 * Les jeux de leçon, partagés.
 *
 * Ils vivaient en fonctions locales dans `QuestReader`, donc invisibles pour
 * le lecteur d'entraînements : un enfant ne pouvait jamais rejouer, en
 * entraînement, le geste qu'il venait de faire en séance. Les entraînements
 * se rabattaient sur des versions papier — trier des cartes au lieu de guider
 * le robot, remplir des trous au lieu de cliquer le bug.
 *
 * Une seule définition, deux lecteurs.
 */

/* Mélange déterministe basé sur une clé stable — même principe que les lecteurs. */
function seededShuffle<T>(arr: T[], seed: string): T[] {
  const result = [...arr];
  let h = seed.split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
  for (let i = result.length - 1; i > 0; i--) {
    h = ((h << 5) - h + i) | 0;
    const j = Math.abs(h) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ── MemoryGame ───────────────────────────────────────────────────────────────
export function MemoryGame({ title, description, pairs, done, onSolved, savedMatched, onStateChange }: {
  blockId: string; title?: string; description?: string; pairs: { left: string; right: string }[];
  done: boolean; onSolved: () => void;
  savedMatched: string[]; onStateChange: (s: string[]) => void;
}) {
  type Card = { id: string; label: string; pairIdx: number };
  const [cards, setCards] = useState<Card[]>(() => {
    const all: Card[] = [];
    pairs.forEach((p, i) => {
      all.push({ id: `L${i}`, label: p.left,  pairIdx: i });
      all.push({ id: `R${i}`, label: p.right, pairIdx: i });
    });
    return all;
  });
  useEffect(() => {
    setCards(prev => {
      const arr = [...prev];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>(savedMatched);
  const [locked, setLocked] = useState(false);

  function flip(id: string) {
    if (locked || flipped.includes(id) || matched.includes(id)) return;
    const next = [...flipped, id];
    setFlipped(next);
    if (next.length === 2) {
      setLocked(true);
      const [a, b] = next.map((fid) => cards.find((c) => c.id === fid)!);
      if (a.pairIdx === b.pairIdx) {
        const newMatched = [...matched, a.id, b.id];
        setMatched(newMatched);
        setFlipped([]);
        setLocked(false);
        onStateChange(newMatched);
        if (newMatched.length === cards.length && !done) onSolved();
      } else {
        setTimeout(() => { setFlipped([]); setLocked(false); }, 900);
      }
    }
  }

  return (
    <div className="rounded-2xl p-6" style={{ background: "#1e293b", border: "1px solid #334155" }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🧠</span>
        <span className="font-black text-white">{title ?? "Jeu Mémoire"}</span>
        {done && <span className="ml-auto text-xs font-mono font-black px-2 py-0.5 rounded-full"
          style={{ background: "#10b98120", color: "#10b981", border: "1px solid #10b98140" }}>✅ Réussi</span>}
      </div>
      {description && <p className="text-sm mb-4 leading-relaxed" style={{ color: "#94a3b8" }}>{description}</p>}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {cards.map((card) => {
          const isFlipped = flipped.includes(card.id) || matched.includes(card.id);
          const isMatched = matched.includes(card.id);
          return (
            <button key={card.id} onClick={() => flip(card.id)}
              className="h-16 rounded-xl text-xs font-bold px-2 py-1 transition-all"
              style={{
                background: isMatched ? "#10b98120" : isFlipped ? "#FDB81315" : "#0f172a",
                border: isMatched ? "2px solid #10b98140" : isFlipped ? "2px solid #FDB81340" : "2px solid #1e293b",
                color: isMatched ? "#10b981" : isFlipped ? "#FDB813" : "#0f172a",
              }}>
              {isFlipped ? card.label : "?"}
            </button>
          );
        })}
      </div>
      <div className="mt-3 text-xs text-center font-mono" style={{ color: "#334155" }}>
        {matched.length / 2}/{pairs.length} paires trouvées
      </div>
    </div>
  );
}

// ── AssociationGame ──────────────────────────────────────────────────────────
// Cartes toujours visibles (pas de retournement) : clique un concept à gauche,
// puis sa définition à droite. Mauvaise paire → flash rouge, on peut réessayer.
export function AssociationGame({ title, description, pairs, done, onSolved, savedMatched, onStateChange }: {
  blockId: string; title?: string; description?: string; pairs: { left: string; right: string }[];
  done: boolean; onSolved: () => void;
  savedMatched: string[]; onStateChange: (s: string[]) => void;
}) {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<string[]>(savedMatched);
  const [wrongAttempt, setWrongAttempt] = useState<{ left: number; right: number } | null>(null);

  const shuffledRight = seededShuffle(
    pairs.map((p, i) => ({ label: p.right, pairIdx: i })),
    `assoc-${pairs.map((p) => p.left).join("|")}`
  );

  function isMatched(pi: number) { return matched.includes(`L${pi}`); }

  function clickLeft(pi: number) {
    if (isMatched(pi) || wrongAttempt) return;
    setSelectedLeft(selectedLeft === pi ? null : pi);
  }

  function clickRight(pi: number) {
    if (selectedLeft == null || isMatched(pi) || wrongAttempt) return;
    if (selectedLeft === pi) {
      const next = [...matched, `L${pi}`, `R${pi}`];
      setMatched(next);
      setSelectedLeft(null);
      onStateChange(next);
      if (next.length === pairs.length * 2 && !done) onSolved();
    } else {
      setWrongAttempt({ left: selectedLeft, right: pi });
      setSelectedLeft(null);
      setTimeout(() => setWrongAttempt(null), 800);
    }
  }

  return (
    <div className="rounded-2xl p-6" style={{ background: "#1e293b", border: "1px solid #334155" }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🔗</span>
        <span className="font-black text-white">{title ?? "Associe les paires"}</span>
        {done && <span className="ml-auto text-xs font-mono font-black px-2 py-0.5 rounded-full"
          style={{ background: "#10b98120", color: "#10b981", border: "1px solid #10b98140" }}>✅ Réussi</span>}
      </div>
      {description && <p className="text-sm mb-4 leading-relaxed" style={{ color: "#94a3b8" }}>{description}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {pairs.map((p, pi) => {
            const isSelected = selectedLeft === pi;
            const isWrong = wrongAttempt?.left === pi;
            const done_ = isMatched(pi);
            return (
              <button key={pi} onClick={() => clickLeft(pi)} disabled={done_}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: done_ ? "#10b98120" : isWrong ? "#ef444420" : isSelected ? "#a78bfa20" : "#0f172a",
                  border: `2px solid ${done_ ? "#10b98160" : isWrong ? "#ef444460" : isSelected ? "#a78bfa" : "#334155"}`,
                  color: done_ ? "#10b981" : isWrong ? "#ef4444" : isSelected ? "#e9d5ff" : "#cbd5e1",
                }}>
                {p.left}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {shuffledRight.map(({ label, pairIdx }) => {
            const isWrong = wrongAttempt?.right === pairIdx;
            const done_ = isMatched(pairIdx);
            return (
              <button key={pairIdx} onClick={() => clickRight(pairIdx)} disabled={done_ || selectedLeft == null}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: done_ ? "#10b98120" : isWrong ? "#ef444420" : "#0f172a",
                  border: `2px solid ${done_ ? "#10b98160" : isWrong ? "#ef444460" : selectedLeft != null ? "#a78bfa40" : "#334155"}`,
                  color: done_ ? "#10b981" : isWrong ? "#ef4444" : "#94a3b8",
                  cursor: selectedLeft == null && !done_ ? "default" : "pointer",
                }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-3 text-xs text-center font-mono" style={{ color: "#334155" }}>
        {matched.length / 2}/{pairs.length} paires trouvées
      </div>
    </div>
  );
}

// ── SortGame ─────────────────────────────────────────────────────────────────
export function SortGame({ title, description, items, hint, done, onSolved, savedOrder, onStateChange }: {
  blockId: string; title?: string; description?: string; items: string[]; hint?: string;
  done: boolean; onSolved: () => void;
  savedOrder: string[]; onStateChange: (s: string[]) => void;
}) {
  const [order, setOrder] = useState<string[]>(() =>
    savedOrder.length === items.length ? savedOrder : [...items]
  );
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (savedOrder.length !== items.length) {
      setOrder([...items].sort(() => Math.random() - 0.5));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Le jeu vient des exercices Python : l'aide y montre la sortie attendue du
   * programme, ce qui aiguille sans jamais donner l'ordre des lignes. Avec des
   * consignes en français — « Avancer », « Cueillir la mangue » —, cette même
   * aide affiche la réponse elle-même, rangée dans le bon ordre.
   *
   * On ne la propose donc que pour du Python ; ailleurs, seul l'indice écrit
   * par l'auteur de l'exercice s'affiche, et à défaut le bouton disparaît.
   */
  const estPython = items.some(item => /print\s*\(/.test(item));
  const expectedOutput = items.map(item => {
    const m = item.match(/print\(["'](.*)["']\)/);
    return m ? m[1] : item;
  }).join("\n");
  const aideDisponible = estPython || !!hint;

  function move(idx: number, dir: -1 | 1) {
    const next = [...order];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setOrder(next);
    setChecked(false);
    onStateChange(next);
  }

  function check() {
    const ok = order.every((item, i) => item === items[i]);
    setChecked(true);
    setCorrect(ok);
    if (ok && !done) onSolved();
  }

  return (
    <div className="rounded-2xl p-6" style={{ background: "#1e293b", border: "1px solid #334155" }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🔢</span>
        <span className="font-black text-white">{title ?? "Remets dans l'ordre"}</span>
        {done && <span className="ml-auto text-xs font-mono font-black px-2 py-0.5 rounded-full"
          style={{ background: "#10b98120", color: "#10b981", border: "1px solid #10b98140" }}>✅ Réussi</span>}
      </div>
      {description && <p className="text-sm mb-4 leading-relaxed whitespace-pre-line" style={{ color: "#94a3b8", fontFamily: description.includes("■") ? "monospace" : "inherit" }}>{description}</p>}
      <div className="space-y-2">
        {order.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-xs w-5 text-right font-mono" style={{ color: "#334155" }}>{idx + 1}.</span>
            <div className="flex-1 rounded-xl px-3 py-2 text-sm font-mono"
              style={{ background: "#0f172a", color: "#FDB813", border: "1px solid #1e293b" }}>{item}</div>
            <div className="flex flex-col gap-0.5">
              <button onClick={() => move(idx, -1)} className="text-xs leading-none hover:opacity-70" style={{ color: "#475569" }}>▲</button>
              <button onClick={() => move(idx,  1)} className="text-xs leading-none hover:opacity-70" style={{ color: "#475569" }}>▼</button>
            </div>
          </div>
        ))}
      </div>
      {checked && (
        <div className="mt-3 text-sm rounded-xl px-4 py-2 font-bold font-mono"
          style={correct
            ? { background: "#10b98115", color: "#10b981", border: "1px solid #10b98130" }
            : { background: "#ef444415", color: "#ef4444", border: "1px solid #ef444430" }}>
          {correct ? "✅ Parfait ! C'est le bon ordre !" : "❌ Pas tout à fait… Essaie encore !"}
        </div>
      )}
      {!done && (
        <div className="mt-3 flex gap-2">
          <button onClick={check} className="flex-1 font-black py-2 rounded-xl text-sm hover:opacity-90 transition-opacity"
            style={{ background: "#FDB813", color: "#0f172a" }}>
            Vérifier l'ordre
          </button>
          {aideDisponible && (
            <button onClick={() => setShowHint(!showHint)} className="text-xs font-bold px-3 py-2 rounded-xl transition-colors"
              style={{ background: "#0f172a", color: "#475569", border: "1px solid #1e293b" }}>
              💡 Aide
            </button>
          )}
        </div>
      )}
      {showHint && aideDisponible && (
        <div className="mt-3 rounded-xl p-4" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
          <div className="text-xs font-mono font-black mb-2" style={{ color: "#334155" }}>
            {estPython ? "Sortie attendue :" : "Indice :"}
          </div>
          {estPython
            ? <pre className="font-mono text-xs leading-relaxed" style={{ color: "#FDB813" }}>{expectedOutput}</pre>
            : <p className="text-sm leading-relaxed" style={{ color: "#FDB813" }}>{hint}</p>}
        </div>
      )}
    </div>
  );
}

// ── BugHuntGame ──────────────────────────────────────────────────────────────
export function BugHuntGame({ title, description, context, instructions, bugIndex, fix, explanation, done, onSolved, savedState, onStateChange }: {
  blockId: string; title?: string; description?: string; context?: string;
  instructions: string[]; bugIndex: number; fix: string; explanation?: string;
  done: boolean; onSolved: () => void;
  savedState: string | null; onStateChange: (s: string) => void;
}) {
  const [selected, setSelected] = useState<number | null>(
    savedState != null && savedState !== "" ? parseInt(savedState) : null
  );
  const [wrong, setWrong] = useState<number | null>(null);
  const solved = selected === bugIndex || done;

  function select(idx: number) {
    if (solved) return;
    if (idx === bugIndex) {
      setSelected(idx);
      onStateChange(String(idx));
      onSolved();
    } else {
      setWrong(idx);
      setTimeout(() => setWrong(null), 800);
    }
  }

  return (
    <div className="rounded-2xl p-6" style={{ background: "#1e293b", border: "1px solid #334155" }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🕵️</span>
        <span className="font-black text-white">{title ?? "Trouve le bug !"}</span>
        {solved && (
          <span className="ml-auto text-xs font-mono font-black px-2 py-0.5 rounded-full"
            style={{ background: "#10b98120", color: "#10b981", border: "1px solid #10b98140" }}>✅ Trouvé !</span>
        )}
      </div>
      {description && <p className="text-sm mb-3 leading-relaxed" style={{ color: "#94a3b8" }}>{description}</p>}
      {context && (
        <div className="rounded-xl px-4 py-3 mb-4 text-sm font-mono whitespace-pre-line" style={{ background: "#0f172a", color: "#60a5fa", border: "1px solid #1e293b" }}>
          {context}
        </div>
      )}

      <div className="space-y-2 mb-4">
        {instructions.map((inst, idx) => {
          const isBug    = solved && idx === bugIndex;
          const isWrong  = wrong === idx;
          return (
            <button key={idx} onClick={() => select(idx)} disabled={solved}
              className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-sm transition-all duration-150"
              style={{
                background: isBug ? "#10b98115" : isWrong ? "#ef444415" : "#0f172a",
                border:     isBug ? "2px solid #10b98140" : isWrong ? "2px solid #ef444440" : "2px solid #1e293b",
                color:      isBug ? "#10b981" : isWrong ? "#ef4444" : "#FDB813",
                cursor:     solved ? "default" : "pointer",
              }}>
              <span className="text-xs font-bold w-5 text-right flex-shrink-0" style={{ color: "#334155" }}>{idx + 1}.</span>
              {/* whitespace-pre : sans lui le HTML mange les espaces de tête, et
                  une erreur de décalage — la moitié de nos chasses au bug —
                  devient invisible. */}
              <span className="flex-1 whitespace-pre overflow-x-auto">{inst}</span>
              {isBug    && <span className="text-xs font-bold" style={{ color: "#10b981" }}>← BUG !</span>}
              {isWrong  && <span className="text-xs font-bold" style={{ color: "#ef4444" }}>✗</span>}
            </button>
          );
        })}
      </div>

      {solved ? (
        <div className="rounded-xl px-5 py-4 space-y-2" style={{ background: "#052e16", border: "1px solid #166534" }}>
          <div className="font-black text-sm" style={{ color: "#10b981" }}>🎉 Bravo — bug trouvé !</div>
          <div className="text-sm font-mono" style={{ color: "#4ade80" }}>
            Ligne {bugIndex + 1} :{" "}
            <span className="whitespace-pre" style={{ color: "#ef4444", textDecoration: "line-through" }}>{instructions[bugIndex]}</span>
            {" → "}
            <span className="whitespace-pre" style={{ color: "#10b981" }}>{fix}</span>
          </div>
          {explanation && <div className="text-xs leading-relaxed mt-1" style={{ color: "#86efac" }}>💡 {explanation}</div>}
        </div>
      ) : (
        <p className="text-xs font-mono text-center" style={{ color: "#334155" }}>
          Clique sur l'instruction incorrecte 👆
        </p>
      )}
    </div>
  );
}

// ── FillBlankGame ─────────────────────────────────────────────────────────────
export function FillBlankGame({ title, template, blanks, done, onSolved, savedAnswers, onStateChange }: {
  blockId: string; title?: string; template: string; blanks: string[];
  done: boolean; onSolved: () => void;
  savedAnswers: string[]; onStateChange: (s: string[]) => void;
}) {
  const parts = template.split("[___]");
  const [answers, setAnswers] = useState<string[]>(() =>
    savedAnswers.length === blanks.length ? savedAnswers : blanks.map(() => "")
  );
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  function check() {
    const res = blanks.map((b, i) => answers[i].trim().toLowerCase() === b.toLowerCase());
    setResults(res);
    setChecked(true);
    if (res.every(Boolean) && !done) onSolved();
  }

  return (
    <div className="rounded-2xl p-6" style={{ background: "#1e293b", border: "1px solid #334155" }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🔤</span>
        <span className="font-black text-white">{title ?? "Complète le code"}</span>
        {done && <span className="ml-auto text-xs font-mono font-black px-2 py-0.5 rounded-full"
          style={{ background: "#10b98120", color: "#10b981", border: "1px solid #10b98140" }}>✅ Réussi</span>}
      </div>
      <div className="rounded-xl p-4 font-mono text-sm leading-loose whitespace-pre-wrap"
        style={{ background: "#0f172a", color: "#FDB813", border: "1px solid #1e293b" }}>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < blanks.length && (
              <input
                type="text"
                value={answers[i]}
                onChange={(e) => { const a = [...answers]; a[i] = e.target.value; setAnswers(a); setChecked(false); onStateChange(a); }}
                className="inline-block w-20 text-center rounded px-1 mx-1 font-bold outline-none"
                style={{
                  borderBottom: !checked ? "2px solid rgba(255,255,255,0.2)" : results[i] ? "2px solid #10b981" : "2px solid #ef4444",
                  background: "rgba(255,255,255,0.05)",
                  color: !checked ? "white" : results[i] ? "#10b981" : "#ef4444",
                }}
                placeholder="___"
              />
            )}
          </span>
        ))}
      </div>
      {checked && !results.every(Boolean) && (
        <div className="mt-3 text-sm rounded-xl px-4 py-2 font-bold font-mono"
          style={{ background: "#FDB81310", color: "#FDB813", border: "1px solid #FDB81330" }}>
          💡 Les cases rouges ne sont pas correctes. Réessaie !
        </div>
      )}
      {!done && (
        <button onClick={check} className="mt-3 w-full font-black py-2 rounded-xl text-sm hover:opacity-90 transition-opacity"
          style={{ background: "#FDB813", color: "#0f172a" }}>
          Vérifier mes réponses
        </button>
      )}
    </div>
  );
}

