import type { ContentStatus } from "@/lib/supabase/types";

const STATUS_STYLES: Record<ContentStatus, { bg: string; color: string }> = {
  draft:     { bg: "#F1F5F9", color: "#64748B" },
  validated: { bg: "#FEF8E1", color: "#D99F0F" },
  published: { bg: "#D1FAE5", color: "#059669" },
  locked:    { bg: "#EEF1F8", color: "#1B2D5E" },
};

const STATUS_LABELS: Record<ContentStatus, string> = {
  draft:     "Brouillon",
  validated: "À valider",
  published: "Publié",
  locked:    "Archivé",
};

export default function StatusBadge({ status }: { status: ContentStatus }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  return (
    <span className="inline-block text-xs font-extrabold px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
  admin:   { bg: "#EDE9FE", color: "#7C3AED" },
  manager: { bg: "#EEF1F8", color: "#1B2D5E" },
  teacher: { bg: "#D1FAE5", color: "#059669" },
  student: { bg: "#FEF8E1", color: "#D99F0F" },
  parent:  { bg: "#F1F5F9", color: "#64748B" },
};

const ROLE_LABELS: Record<string, string> = {
  admin:   "Admin",
  manager: "Manager",
  teacher: "Professeur",
  student: "Élève",
  parent:  "Parent",
};

export function RoleBadge({ role }: { role: string }) {
  const s = ROLE_STYLES[role] ?? { bg: "#F1F5F9", color: "#64748B" };
  return (
    <span className="inline-block text-xs font-extrabold px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

const LEVEL_STYLES: Record<string, { bg: string; color: string }> = {
  explorer:  { bg: "#D1FAE5", color: "#059669" },
  builder:   { bg: "#EDE9FE", color: "#7C3AED" },
  architect: { bg: "#EEF1F8", color: "#1B2D5E" },
};

const LEVEL_LABELS: Record<string, string> = {
  explorer:  "Explorateur",
  builder:   "Bâtisseur",
  architect: "Architecte",
};

export function LevelBadge({ level }: { level: string }) {
  const s = LEVEL_STYLES[level] ?? { bg: "#F1F5F9", color: "#64748B" };
  return (
    <span className="inline-block text-xs font-extrabold px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      {LEVEL_LABELS[level] ?? level}
    </span>
  );
}
