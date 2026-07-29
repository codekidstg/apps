"use client";
import BlocklyMusicLoader from "@/components/eleve/BlocklyMusicLoader";

export default function TestMusicPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <h1 className="text-white font-black text-xl mb-4">🎹 Test — Piano BlocklyMusic</h1>
      <BlocklyMusicLoader
        config={{
          title: "Défi 1 — Tes premières notes",
          instructions: "Glisse 3 blocs « 🎵 Jouer Do » dans le programme et clique ▶ Jouer !",
          target_notes: ["Do", "Do", "Do"],
          available_blocks: ["music_play_note"],
          max_blocks: 3,
          tempo: 500,
        }}
        onSolved={() => alert("✅ Résolu !")}
      />
    </div>
  );
}
