import type { ReactNode } from 'react'

import { cn } from '../../components/ui/cn'

export interface Column<Row> {
  header: string
  cell: (row: Row) => ReactNode
  /** Columnas numéricas: alineadas a la derecha y con cifras tabulares */
  numeric?: boolean
}

interface DataTableProps<Row> {
  caption: string
  columns: Column<Row>[]
  rows: Row[]
  rowKey: (row: Row) => string | number
  footer?: ReactNode[]
}

/** Vista de tabla de una gráfica: los mismos datos, accesibles sin el cursor. */
export function DataTable<Row>({ caption, columns, rows, rowKey, footer }: DataTableProps<Row>) {
  return (
    <div className="max-h-80 overflow-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 bg-surface-2">
          <tr>
            {columns.map((column) => (
              <th
                key={column.header}
                scope="col"
                className={cn(
                  'px-3 py-2 font-medium whitespace-nowrap text-fg-2',
                  column.numeric ? 'text-right' : 'text-left',
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-t border-border">
              {columns.map((column) => (
                <td
                  key={column.header}
                  className={cn('px-3 py-2 whitespace-nowrap text-fg', column.numeric && 'text-right tabular-nums')}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && (
          <tfoot className="sticky bottom-0 bg-surface-2">
            <tr className="border-t border-border-strong">
              {footer.map((cell, index) => (
                <td
                  key={columns[index]?.header ?? index}
                  className={cn(
                    'px-3 py-2 font-semibold text-fg',
                    columns[index]?.numeric && 'text-right whitespace-nowrap tabular-nums',
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
