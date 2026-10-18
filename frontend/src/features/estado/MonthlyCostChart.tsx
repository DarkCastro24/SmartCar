import { Wallet } from 'lucide-react'
import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  BarStack,
  CartesianGrid,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
  type TooltipContentProps,
} from 'recharts'

import { formatMoney, formatMonth, parseISODate, todayISO } from '../../lib/format'
import type { MonthlyCost } from '../../lib/types'
import { ChartCard, LegendItem } from './ChartCard'
import {
  buildMonthlyCosts,
  formatAxisMoney,
  formatTickMonth,
  niceTicks,
  sumCosts,
  type MonthlyCostRow,
} from './chart-data'
import { MonthTick, TooltipFrame, TooltipRow } from './chart-parts'
import { AXIS_TICK, CHART_COLORS } from './chart-theme'
import { DataTable, type Column } from './DataTable'
import { InlineEmpty } from './InlineEmpty'

const TITLE = 'Gasto por mes'
const DESCRIPTION = 'Mantenimiento y combustible de los últimos 12 meses.'
/** Separación entre segmentos apilados (color de la superficie) */
const SEGMENT_GAP = 2
const MAX_BAR_SIZE = 24

/** Barras apiladas: combustible abajo (constante) y mantenimiento arriba (eventual). */
export function MonthlyCostChart({ byMonth }: { byMonth: MonthlyCost[] }) {
  const rows = useMemo(() => buildMonthlyCosts(byMonth, todayISO().slice(0, 7)), [byMonth])
  const hasData = rows.some((row) => row.total > 0)
  const ticks = niceTicks(Math.max(...rows.map((row) => row.total)))

  if (!hasData) {
    return (
      <section aria-label={TITLE} className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-base font-semibold text-fg">{TITLE}</h2>
        <InlineEmpty
          icon={Wallet}
          title="Sin gastos en los últimos 12 meses"
          description="Cuando registres el costo de tus mantenimientos y cargas de combustible, aquí verás cuánto gastas cada mes."
        />
      </section>
    )
  }

  return (
    <ChartCard
      title={TITLE}
      description={DESCRIPTION}
      legend={
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <LegendItem label="Mantenimiento" swatchClass="bg-series-1" shape="bar" />
          <LegendItem label="Combustible" swatchClass="bg-series-2" shape="bar" />
        </div>
      }
      chart={
        <div className="h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
              <XAxis
                dataKey="month"
                tick={MonthTick}
                tickFormatter={(month: string) => formatTickMonth(parseISODate(`${month}-01`).getTime())}
                tickLine={false}
                stroke={CHART_COLORS.axis}
                height={40}
                minTickGap={4}
              />
              <YAxis
                domain={[0, ticks[ticks.length - 1]]}
                ticks={ticks}
                tickFormatter={formatAxisMoney}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip content={CostTooltip} cursor={{ fill: CHART_COLORS.hover }} isAnimationActive={false} />
              <BarStack radius={[4, 4, 0, 0]}>
                <Bar dataKey="fuel" name="Combustible" fill={CHART_COLORS.series2} maxBarSize={MAX_BAR_SIZE} />
                <Bar
                  dataKey="maintenance"
                  name="Mantenimiento"
                  fill={CHART_COLORS.series1}
                  maxBarSize={MAX_BAR_SIZE}
                  shape={GappedSegment}
                />
              </BarStack>
            </BarChart>
          </ResponsiveContainer>
        </div>
      }
      table={<CostTable rows={rows} />}
    />
  )
}

/** Segmento de arriba: deja 2 px libres sobre el de abajo para separarlos. */
function GappedSegment(props: BarShapeProps) {
  const row = props.payload as MonthlyCostRow | undefined
  const gap = row && row.fuel > 0 ? SEGMENT_GAP : 0
  return <Rectangle {...props} height={Math.max(props.height - gap, 0)} />
}

function CostTooltip({ active, payload }: TooltipContentProps) {
  const row = payload?.[0]?.payload as MonthlyCostRow | undefined
  if (!active || !row) return null
  return (
    <TooltipFrame title={formatMonth(row.month)}>
      <TooltipRow value={formatMoney(row.total)} label="en total" />
      <TooltipRow swatchClass="bg-series-1" value={formatMoney(row.maintenance)} label="mantenimiento" />
      <TooltipRow swatchClass="bg-series-2" value={formatMoney(row.fuel)} label="combustible" />
    </TooltipFrame>
  )
}

const TABLE_COLUMNS: Column<MonthlyCostRow>[] = [
  { header: 'Mes', cell: (row) => formatMonth(row.month) },
  { header: 'Mantenimiento', cell: (row) => formatMoney(row.maintenance), numeric: true },
  { header: 'Combustible', cell: (row) => formatMoney(row.fuel), numeric: true },
  { header: 'Total', cell: (row) => formatMoney(row.total), numeric: true },
]

function CostTable({ rows }: { rows: MonthlyCostRow[] }) {
  const totals = sumCosts(rows)
  return (
    <DataTable
      caption={`${TITLE}: últimos 12 meses`}
      columns={TABLE_COLUMNS}
      rows={[...rows].reverse()}
      rowKey={(row) => row.month}
      footer={['Total', formatMoney(totals.maintenance), formatMoney(totals.fuel), formatMoney(totals.total)]}
    />
  )
}
