type Props = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
};

export default function PageHeader({ title, subtitle, actions, breadcrumb }: Props) {
  return (
    <div style={{ background: "white", borderBottom: "1px solid #E2E8F0", padding: "20px 32px" }}>
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="flex items-center gap-2 text-xs font-bold mb-3" style={{ color: "#94A3B8" }}>
          {breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span style={{ color: "#E2E8F0" }}>›</span>}
              {crumb.href ? (
                <a href={crumb.href} className="hover:underline transition-colors" style={{ color: "#64748B" }}>{crumb.label}</a>
              ) : (
                <span style={{ color: "#1B2D5E" }}>{crumb.label}</span>
              )}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="font-black text-2xl" style={{ color: "#1B2D5E" }}>{title}</h1>
          {subtitle && <p className="text-sm mt-1 font-bold" style={{ color: "#64748B" }}>{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
