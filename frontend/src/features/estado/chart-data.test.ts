import { describe, expect, it } from 'vitest'

import { parseISODate } from '../../lib/format'
import type { MaintenanceCycleSummary, MpgSegment } from '../../lib/types'
import {
  buildCycleRows,
  buildImpactRows,
  buildMaintenanceMarkers,
  buildMonthlyCosts,
  buildMpgPoints,
  formatAxisMoney,
  lastMonths,
  monthTicks,
  mpgDomain,
  niceTicks,
  sumCosts,
} from './chart-data'
import { makeImpact } from './test-fixtures'

function segment(date: string, mpg: number, start: number, end: number): MpgSegment {
  return { date, mpg, start_mileage: start, end_mileage: end, miles: end - start, gallons: 10 }
}

const SERIES = [
  segment('2026-03-20', 30.1, 56600, 56900),
  segment('2026-04-01', 30.2, 56900, 57200),
  segment('2026-04-20', 34.0, 57200, 57514),
]

describe('gráfica de rendimiento', () => {
  it('asigna cada mantenimiento al tramo que termina en la siguiente carga', () => {
    const impact = [
      makeImpact({ id: 1, date: '2026-03-30', label: 'Cambio de aceite', type: 'oil_change' }),
      makeImpact({ id: 2, date: '2026-04-10', label: 'Bujías' }),
    ]
    const points = buildMpgPoints(SERIES, impact)
    expect(points.map((point) => point.maintenance)).toEqual([[], ['Cambio de aceite'], ['Bujías']])
    expect(points[0].time).toBe(parseISODate('2026-03-20').getTime())
  })

  it('marca solo los mantenimientos dentro del rango y une los del mismo día', () => {
    const impact = [
      makeImpact({ id: 1, date: '2025-01-01', label: 'Batería', type: 'battery' }),
      makeImpact({ id: 2, date: '2026-04-10', label: 'Bujías' }),
      makeImpact({ id: 3, date: '2026-04-10', label: 'Filtro de aire', type: 'air_filter' }),
    ]
    const markers = buildMaintenanceMarkers(impact, buildMpgPoints(SERIES, impact))
    expect(markers).toHaveLength(1)
    expect(markers[0]).toMatchObject({ date: '2026-04-10', label: 'Bujías, Filtro de aire', showIcon: true })
  })

  it('no dibuja el ícono de dos marcas demasiado juntas', () => {
    const impact = [makeImpact({ id: 1, date: '2026-04-01' }), makeImpact({ id: 2, date: '2026-04-02' })]
    const markers = buildMaintenanceMarkers(impact, buildMpgPoints(SERIES, impact))
    expect(markers.map((marker) => marker.showIcon)).toEqual([true, false])
  })

  it('calcula rangos y marcas de mes', () => {
    expect(mpgDomain(buildMpgPoints(SERIES, []))).toEqual([29, 35])
    const ticks = monthTicks([parseISODate('2026-03-20').getTime(), parseISODate('2026-05-02').getTime()])
    expect(ticks).toEqual([parseISODate('2026-04-01').getTime(), parseISODate('2026-05-01').getTime()])
  })
})

describe('gasto por mes', () => {
  it('arma los últimos 12 meses y rellena con cero los meses sin gastos', () => {
    const rows = buildMonthlyCosts(
      [
        { month: '2025-09', maintenance: 18, fuel: 0, total: 18 },
        { month: '2026-09', maintenance: 45, fuel: 111.01, total: 156.01 },
      ],
      '2026-10',
    )
    expect(rows).toHaveLength(12)
    expect(rows[0].month).toBe('2025-11')
    expect(rows[10]).toEqual({ month: '2026-09', maintenance: 45, fuel: 111.01, total: 156.01 })
    expect(rows[11]).toEqual({ month: '2026-10', maintenance: 0, fuel: 0, total: 0 })
    expect(sumCosts(rows)).toEqual({ maintenance: 45, fuel: 111.01, total: 156.01 })
  })

  it('cruza el cambio de año', () => {
    expect(lastMonths('2026-02', 3)).toEqual(['2025-12', '2026-01', '2026-02'])
  })

  it('usa marcas redondas en el eje del dinero', () => {
    expect(niceTicks(214.12)).toEqual([0, 50, 100, 150, 200, 250])
    expect(niceTicks(80)).toEqual([0, 20, 40, 60, 80])
    expect(niceTicks(1450)).toEqual([0, 500, 1000, 1500])
    expect(formatAxisMoney(150)).toBe('$150')
    expect(formatAxisMoney(1500)).toBe('$1.5K')
  })
})

describe('antes y después de cada mantenimiento', () => {
  it('omite los que no tienen MPG antes y después y clasifica el cambio', () => {
    const rows = buildImpactRows([
      makeImpact({ id: 1, date: '2025-12-15', mpg_before: 30.7, mpg_after: 30.2, change_pct: -1.6 }),
      makeImpact({ id: 2, date: '2026-04-10', mpg_before: 30.7, mpg_after: 33.9, change_pct: 10.4 }),
      makeImpact({ id: 3, date: '2026-09-18', mpg_before: 34, mpg_after: 34.1, change_pct: 0.3 }),
      makeImpact({ id: 4, date: '2025-09-18', mpg_before: null, mpg_after: 30.1, change_pct: null }),
    ])
    expect(rows.map((row) => [row.id, row.trend])).toEqual([
      [3, 'igual'],
      [2, 'mejora'],
      [1, 'empeora'],
    ])
  })
})

describe('duración de cada cambio', () => {
  it('muestra solo los tipos con dos registros o más', () => {
    const cycle = (type: MaintenanceCycleSummary['type'], times: number): MaintenanceCycleSummary => ({
      type,
      label: type,
      times,
      avg_miles: times > 1 ? 4913 : null,
      avg_days: times > 1 ? 168 : null,
      cycles: [],
    })
    const rows = buildCycleRows([cycle('battery', 1), cycle('air_filter', 2), cycle('oil_change', 3)])
    expect(rows.map((row) => row.type)).toEqual(['oil_change', 'air_filter'])
    expect(rows[0]).toMatchObject({ times: 3, avgMiles: 4913, avgDays: 168 })
  })
})
