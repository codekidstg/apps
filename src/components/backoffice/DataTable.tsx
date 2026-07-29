type Column<T> = {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  width?: string;
};

type Props<T extends { id: string }> = {
  columns: Column<T>[];
  data: T[];
  emptyText?: string;
};

export default function DataTable<T extends { id: string }>({
  columns, data, emptyText = "Aucun résultat.",
}: Props<T>) {
  return (
    <div className="bg-white rounded-2xl border border-cream-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-cream-border bg-cream">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left px-5 py-3 text-xs font-extrabold uppercase tracking-widest text-ink-light"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-12 text-center text-ink-muted font-bold">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row.id} className="border-b border-cream-border last:border-0 hover:bg-cream transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-3.5">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
