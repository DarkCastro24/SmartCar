import { describe, expect, it } from 'vitest'

import type { Interval, IntervalInput } from '../../lib/types'
import { changedIntervals, describeInterval, intervalRowSchema, toIntervalsFormValues } from './intervals'

const saved: Interval[] = [
  { type: 'oil_change', label: 'Cambio de aceite', every_miles: 5000, every_months: 6, is_custom: false },
  { type: 'spark_plugs', label: 'Bujías', every_miles: 60000, every_months: 60, is_custom: true },
  { type: 'battery', label: 'Batería', every_miles: null, every_months: 48, is_custom: false },
]

const unchanged: IntervalInput[] = saved.map(({ type, every_miles, every_months }) => ({ type, every_miles, every_months }))

describe('changedIntervals', () => {
  it('no envía nada si no hubo cambios', () => {
    expect(changedIntervals(saved, unchanged)).toEqual([])
  })

  it('envía solo las filas que cambiaron', () => {
    const rows = unchanged.map((row) => (row.type === 'oil_change' ? { ...row, every_miles: 7500 } : row))
    expect(changedIntervals(saved, rows)).toEqual([{ type: 'oil_change', every_miles: 7500, every_months: 6 }])
  })

  it('cuenta como cambio dejar un campo vacío o llenar uno que no tenía límite', () => {
    const rows = unchanged.map((row) => {
      if (row.type === 'spark_plugs') return { ...row, every_months: null }
      if (row.type === 'battery') return { ...row, every_miles: 50000 }
      return row
    })
    expect(changedIntervals(saved, rows)).toEqual([
      { type: 'spark_plugs', every_miles: 60000, every_months: null },
      { type: 'battery', every_miles: 50000, every_months: 48 },
    ])
  })

  it('escribir el mismo valor que ya tenía no es un cambio', () => {
    const rows = unchanged.map((row) => ({ ...row }))
    expect(changedIntervals(saved, rows)).toEqual([])
  })

  it('manda solo type, every_miles y every_months', () => {
    const rows = [{ ...unchanged[0], every_months: 3, label: 'extra' }]
    expect(changedIntervals(saved, rows)).toEqual([{ type: 'oil_change', every_miles: 5000, every_months: 3 }])
  })
})

describe('intervalRowSchema', () => {
  const messages = (row: Partial<IntervalInput>) => {
    const result = intervalRowSchema.safeParse({ ...unchanged[0], ...row })
    return result.success ? [] : result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
  }

  it('acepta un solo límite (vacío = sin límite)', () => {
    expect(messages({ every_miles: null, every_months: 48 })).toEqual([])
    expect(messages({ every_miles: 5000, every_months: null })).toEqual([])
  })

  it('exige al menos un límite por fila y marca los dos campos', () => {
    expect(messages({ every_miles: null, every_months: null })).toEqual([
      'every_miles: Indica las millas, los meses o ambos.',
      'every_months: Indica las millas, los meses o ambos.',
    ])
  })

  it('usa los mismos rangos que el backend', () => {
    expect(messages({ every_miles: 100, every_months: 1 })).toEqual([])
    expect(messages({ every_miles: 500_000, every_months: 240 })).toEqual([])
    expect(messages({ every_miles: 99 })).toEqual(['every_miles: Las millas van de 100 a 500,000.'])
    expect(messages({ every_miles: 500_001 })).toEqual(['every_miles: Las millas van de 100 a 500,000.'])
    expect(messages({ every_months: 0 })).toEqual(['every_months: Los meses van de 1 a 240.'])
    expect(messages({ every_months: 241 })).toEqual(['every_months: Los meses van de 1 a 240.'])
  })

  it('rechaza texto que no es número', () => {
    expect(messages({ every_miles: Number.NaN })).toEqual(['every_miles: Escribe las millas solo con números.'])
  })
})

describe('toIntervalsFormValues', () => {
  it('quita la etiqueta y la marca de personalizado', () => {
    expect(toIntervalsFormValues(saved)).toEqual({ intervals: unchanged })
  })
})

describe('describeInterval', () => {
  it('describe millas, meses o ambos', () => {
    expect(describeInterval(5000, 6)).toBe('cada 5,000 mi o 6 meses')
    expect(describeInterval(null, 48)).toBe('cada 48 meses')
    expect(describeInterval(15000, null)).toBe('cada 15,000 mi')
    expect(describeInterval(null, 1)).toBe('cada 1 mes')
  })
})
