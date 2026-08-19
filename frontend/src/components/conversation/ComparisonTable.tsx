import type { ComparisonTableData } from "@/conversation/types";

export function ComparisonTable({ table }: { table: ComparisonTableData }) {
  const productKey = table.columns[0]?.key ?? "product";

  return (
    <section className="mt-4 min-w-0">
      {table.caption ? (
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted">
          {table.caption}
        </p>
      ) : null}

      <ul className="space-y-3 lg:hidden">
        {table.rows.map((row, index) => (
          <li
            key={`${row[productKey] ?? "row"}-${index}`}
            className="rounded-2xl border border-line bg-surface px-4 py-3"
          >
            <p className="font-extrabold tracking-[-0.02em] text-heading">
              {row[productKey]}
            </p>
            <dl className="mt-2 space-y-2">
              {table.columns
                .filter((column) => column.key !== productKey)
                .map((column) => (
                  <div key={column.key} className="min-w-0">
                    <dt className="text-[0.7rem] font-bold tracking-wide text-muted uppercase">
                      {column.label}
                    </dt>
                    <dd className="text-sm leading-5 font-medium break-words text-body">
                      {row[column.key]}
                    </dd>
                  </div>
                ))}
            </dl>
          </li>
        ))}
      </ul>

      <div className="hidden min-w-0 lg:block">
        <table className="w-full table-fixed border-collapse text-left text-sm">
          {table.caption ? (
            <caption className="sr-only">{table.caption}</caption>
          ) : null}
          <thead>
            <tr className="border-b border-line bg-brand-soft">
              {table.columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-3 py-2.5 font-extrabold text-heading"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, index) => (
              <tr
                key={`${row[productKey] ?? "row"}-${index}`}
                className="border-b border-line align-top last:border-b-0"
              >
                {table.columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-3 py-3 font-medium break-words text-body"
                  >
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
