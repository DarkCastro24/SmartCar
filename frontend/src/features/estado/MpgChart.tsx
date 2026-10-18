import { Fuel, Wrench } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'

import { buttonClasses } from '../../components/ui/button-classes'
import { formatDate, formatGallons, formatMiles, formatNumber } from '../../lib/format'
import type { MaintenanceImpact, MpgSegment } from '../../lib/types'
import { ChartCard } from './ChartCard'
import {
  buildMaintenanceMarkers,
  buildMpgPoints,
  formatTickMonth,
  monthTicks,
  mpgDomain,
  timeDomain,
  type MpgPoint,
} from './chart-data'
import { MonthTick, TooltipFrame, TooltipRow } from './chart-parts'
import { AXIS_TICK, CHART_COLORS } from './chart-theme'
import { DataTable, type Column } from './DataTable'
import { formatMpgFixed, formatMpgValue } from './formats'
import { InlineEmpty } from './InlineEmpty'

const TITLE = 'Rendimiento en el tiempo'
const DESCRIPTION = 'Millas por galón de cada tramo, de tanque lleno a tanque lleno.'

interface MpgChartProps {
  series: MpgSegment[]
  impact: MaintenanceImpact[]
}

/** Gráfica de línea del MPG con marcas en las fechas de mantenimiento. */
export function MpgChart({ series, impact }: MpgChartProps) {
  const points = useMemo(() => buildMpgPoints(series, impact), [series, impact])
  const markers = useMemo(() => buildMaintenanceMarkers(impact, points), [impact, points])

  if (!points.length) {
    return (
      <section aria-label={TITLE} className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-base font-semibold text-fg">{TITLE}</h2>
        <InlineEmpty
          icon={Fuel}
          title="Aún no hay rendimiento que mostrar"
          description="Se necesitan al menos dos cargas con el tanque lleno para calcular las millas por galón."
          action={
            <Link to="/registrar?tipo=combustible" className={buttonClasses('secondary')}>
              Registrar carga
            </Link>
          }
        />
      </section>
    )
  }

  const domain = timeDomain(points)

  return (
    <ChartCard
      title={TITLE}
      description={DESCRIPTION}
      legend={
        markers.length > 0 && (
          <span className="inline-flex items-center gap-2 text-sm text-fg-2">
            <Wrench aria-hidden className="size-3.5" />
            Mantenimiento
          </span>
        )
      }
      chart={
        <div className="h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 22, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
              <XAxis
                dataKey="time"
                type="number"
                scale="time"
                domain={domain}
                ticks={monthTicks(domain)}
                tick={MonthTick}
                tickFormatter={formatTickMonth}
                tickLine={false}
                stroke={CHART_COLORS.axis}
                height={40}
                minTickGap={8}
              />
              <YAxis
                domain={mpgDomain(points)}
                allowDecimals={false}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              {markers.map((marker) => (
                <ReferenceLine
                  key={marker.date}
                  x={marker.time}
                  stroke={CHART_COLORS.axis}
                  label={marker.showIcon ? MarkerIcon : undefined}
                  aria-label={`${marker.label}, ${formatDate(marker.date)}`}
                />
              ))}
              <Tooltip
                content={MpgTooltip}
                cursor={{ stroke: CHART_COLORS.axis, strokeWidth: 1 }}
                isAnimationActive={false}
              />
              <Line
                dataKey="mpg"
                name="Rendimiento"
                type="monotone"
                stroke={CHART_COLORS.series1}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                dot={points.length === 1 ? { r: 4, fill: CHART_COLORS.series1, stroke: CHART_COLORS.surface, strokeWidth: 2 } : false}
                activeDot={{ r: 5, fill: CHART_COLORS.series1, stroke: CHART_COLORS.surface, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      }
      table={<MpgTable points={points} />}
    />
  )
}

/** Ícono discreto arriba de cada marca de mantenimiento. */
function MarkerIcon({ viewBox }: { viewBox?: { x?: number; y?: number } }) {
  if (viewBox?.x == null || viewBox.y == null) return <g />
  return <Wrench x={viewBox.x - 6} y={viewBox.y - 18} width={12} height={12} color={CHART_COLORS.text} aria-hidden />
}

function MpgTooltip({ active, payload }: TooltipContentProps) {
  const point = payload?.[0]?.payload as MpgPoint | undefined
  if (!active || !point) return null
  return (
    <TooltipFrame title={formatDate(point.date)}>
      <TooltipRow swatchClass="bg-series-1" value={formatMpgFixed(point.mpg)} label="en este tramo" />
      <p className="text-xs text-fg-2">
        {formatMiles(point.miles)} · {formatGallons(point.gallons)}
      </p>
      {point.maintenance.length > 0 && (
        <p className="flex items-start gap-1.5 border-t border-border pt-1 text-xs text-fg">
          <Wrench aria-hidden className="mt-0.5 size-3 shrink-0 text-fg-2" />
          {point.maintenance.join(', ')}
        </p>
      )}
    </TooltipFrame>
  )
}

const TABLE_COLUMNS: Column<MpgPoint>[] = [
  { header: 'Fecha', cell: (point) => formatDate(point.date) },
  { header: 'MPG', cell: (point) => formatMpgValue(point.mpg), numeric: true },
  { header: 'Millas', cell: (point) => formatNumber(point.miles), numeric: true },
  { header: 'Galones', cell: (point) => formatGallons(point.gallons), numeric: true },
  { header: 'Mantenimiento', cell: (point) => point.maintenance.join(', ') || '—' },
]

function MpgTable({ points }: { points: MpgPoint[] }) {
  return (
    <DataTable
      caption={`${TITLE}: MPG por tramo de tanque lleno`}
      columns={TABLE_COLUMNS}
      rows={[...points].reverse()}
      rowKey={(point) => `${point.date}-${point.time}-${point.miles}`}
    />
  )
}
