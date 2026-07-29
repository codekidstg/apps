"use client";

import { useTransition, useState } from "react";
import { setStudentLevel } from "../actions";

type Level = { num: number; name: string; color: string };

export default function LevelSelect({
  studentId,
  currentLevel,
  levels,
}: {
  studentId: string;
  currentLevel: number;
  levels: Level[];
}) {
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(currentLevel);
  const lvl = levels.find((l) => l.num === value) ?? levels[0];

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newLevel = Number(e.target.value);
    if (!confirm(`Changer le niveau de cet élève vers "${levels.find(l => l.num === newLevel)?.name}" ?`)) return;
    setValue(newLevel);
    startTransition(async () => {
      await setStudentLevel(studentId, newLevel);
    });
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={pending}
      className="text-xs font-bold px-2 py-1 rounded-lg border-0 cursor-pointer disabled:opacity-40"
      style={{ background: lvl.color + "22", color: lvl.color }}
    >
      {levels.map((l) => (
        <option key={l.num} value={l.num}>{l.name}</option>
      ))}
    </select>
  );
}
