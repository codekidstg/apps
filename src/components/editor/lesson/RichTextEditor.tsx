"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { useEffect, useCallback } from "react";

interface Props {
  value: string;
  onChange: (html: string) => void;
}

const BTN = "px-2 py-1 rounded text-xs font-bold transition-colors hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed";
const ACTIVE = "bg-slate-200 text-slate-900";

export default function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: false }),
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false as any);
    }
  }, [value, editor]);

  const addTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt("URL de l'image :");
    if (url) editor?.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const setLink = useCallback(() => {
    const prev = editor?.getAttributes("link").href ?? "";
    const url  = window.prompt("URL du lien :", prev);
    if (url === null) return;
    if (url === "") { editor?.chain().focus().unsetLink().run(); return; }
    editor?.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50">
        {/* Format texte */}
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${BTN} ${editor.isActive("bold") ? ACTIVE : ""}`} title="Gras">B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${BTN} italic ${editor.isActive("italic") ? ACTIVE : ""}`} title="Italique">I</button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`${BTN} underline ${editor.isActive("underline") ? ACTIVE : ""}`} title="Souligné">U</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`${BTN} ${editor.isActive("highlight") ? "bg-yellow-200" : ""}`} title="Surligné">✎</button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Titres */}
        {([1,2,3] as const).map(lvl => (
          <button key={lvl} type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: lvl }).run()}
            className={`${BTN} ${editor.isActive("heading", { level: lvl }) ? ACTIVE : ""}`}
            title={`Titre ${lvl}`}>H{lvl}</button>
        ))}

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Listes */}
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${BTN} ${editor.isActive("bulletList") ? ACTIVE : ""}`} title="Liste à puces">• —</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${BTN} ${editor.isActive("orderedList") ? ACTIVE : ""}`} title="Liste numérotée">1.</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`${BTN} ${editor.isActive("blockquote") ? ACTIVE : ""}`} title="Citation">❝</button>
        <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`${BTN} font-mono ${editor.isActive("codeBlock") ? ACTIVE : ""}`} title="Bloc code">{"<>"}</button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Alignement */}
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`${BTN} ${editor.isActive({ textAlign: "left" }) ? ACTIVE : ""}`} title="Gauche">⬤←</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`${BTN} ${editor.isActive({ textAlign: "center" }) ? ACTIVE : ""}`} title="Centre">⬤</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`${BTN} ${editor.isActive({ textAlign: "right" }) ? ACTIVE : ""}`} title="Droite">→⬤</button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Tableau */}
        <button type="button" onClick={addTable}
          className={BTN} title="Insérer un tableau">⊞ Tableau</button>
        {editor.isActive("table") && (
          <>
            <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()}
              className={BTN} title="Ajouter colonne">+col</button>
            <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()}
              className={BTN} title="Ajouter ligne">+ligne</button>
            <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()}
              className={`${BTN} text-red-500`} title="Supprimer colonne">-col</button>
            <button type="button" onClick={() => editor.chain().focus().deleteRow().run()}
              className={`${BTN} text-red-500`} title="Supprimer ligne">-ligne</button>
            <button type="button" onClick={() => editor.chain().focus().deleteTable().run()}
              className={`${BTN} text-red-600`} title="Supprimer tableau">✕ table</button>
          </>
        )}

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Image + Lien */}
        <button type="button" onClick={addImage} className={BTN} title="Insérer une image">🖼</button>
        <button type="button" onClick={setLink}
          className={`${BTN} ${editor.isActive("link") ? ACTIVE : ""}`} title="Lien">🔗</button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Undo / Redo */}
        <button type="button" onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()} className={BTN} title="Annuler">↩</button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()} className={BTN} title="Refaire">↪</button>
      </div>

      {/* Zone d'édition */}
      <EditorContent editor={editor} />

      <style>{`
        .tiptap table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
        .tiptap th, .tiptap td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
        .tiptap th { background: #f1f5f9; font-weight: 700; }
        .tiptap tr:nth-child(even) td { background: #f8fafc; }
        .tiptap blockquote { border-left: 3px solid #6366f1; padding-left: 1rem; color: #475569; margin: 0.5rem 0; }
        .tiptap pre { background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 0.5rem; font-size: 0.85rem; overflow-x: auto; }
        .tiptap code:not(pre code) { background: #f1f5f9; color: #7c3aed; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; }
        .tiptap img { max-width: 100%; border-radius: 8px; margin: 0.5rem 0; }
        .tiptap a { color: #6366f1; text-decoration: underline; }
        .tiptap h1 { font-size: 1.6rem; font-weight: 900; margin: 1rem 0 0.5rem; }
        .tiptap h2 { font-size: 1.3rem; font-weight: 800; margin: 0.8rem 0 0.4rem; }
        .tiptap h3 { font-size: 1.1rem; font-weight: 700; margin: 0.6rem 0 0.3rem; }
        .tiptap ul { list-style: disc; padding-left: 1.5rem; }
        .tiptap ol { list-style: decimal; padding-left: 1.5rem; }
        .tiptap p { margin: 0.3rem 0; }
        .tiptap mark { background: #fef08a; padding: 1px 2px; border-radius: 2px; }
      `}</style>
    </div>
  );
}
