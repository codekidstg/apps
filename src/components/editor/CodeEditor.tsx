"use client";

import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { defaultKeymap, indentWithTab, history, historyKeymap } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";
import { autocompletion, closeBrackets } from "@codemirror/autocomplete";

type Language = "python" | "javascript" | "html";

const langExtension = (lang: Language) => {
  if (lang === "python")     return python();
  if (lang === "javascript") return javascript();
  if (lang === "html")       return html();
  return python();
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  language?: Language;
  readOnly?: boolean;
  minHeight?: string;
};

export default function CodeEditor({ value, onChange, language = "python", readOnly = false, minHeight = "160px" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef      = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          oneDark,
          langExtension(language),
          lineNumbers(),
          highlightActiveLine(),
          history(),
          autocompletion(),
          closeBrackets(),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          EditorState.readOnly.of(readOnly),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChange(update.state.doc.toString());
          }),
          EditorView.theme({
            "&": { borderRadius: "12px", overflow: "hidden", minHeight },
            ".cm-scroller": { fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: "14px", lineHeight: "1.6" },
            ".cm-content": { padding: "12px 0" },
          }),
        ],
      }),
      parent: containerRef.current,
    });

    viewRef.current = view;
    return () => view.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, readOnly]);

  // Sync external value changes (e.g. reset)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return <div ref={containerRef} className="rounded-xl overflow-hidden border border-slate-700" />;
}
