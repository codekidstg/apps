type Level = "explorer" | "builder" | "architect" | "default";

const styles: Record<Level, string> = {
  explorer: "bg-explorer-light text-explorer border border-explorer-border",
  builder:  "bg-builder-light text-builder border border-builder-border",
  architect:"bg-architect-light text-brand-orange border border-architect-border",
  default:  "bg-cream text-ink-muted border border-cream-border",
};

export default function Badge({
  children,
  level = "default",
}: {
  children: React.ReactNode;
  level?: Level;
}) {
  return (
    <span className={`inline-block text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full ${styles[level]}`}>
      {children}
    </span>
  );
}
