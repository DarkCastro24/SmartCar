import { describe, expect, it } from 'vitest'

import { parseDecimalInput, parseIntegerInput } from './forms'
import {
  formatDate,
  formatMiles,
  formatMoney,
  formatMonth,
  formatPercent,
  formatRelativeDays,
  parseISODate,
} from './format'

describe('formatos', () => {
  it('formatea millas, dinero y fechas para El Salvador', () => {
    expect(formatMiles(62784)).toBe('62,784 mi')
    expect(formatMoney(1234.5)).toBe('$1,234.50')
    expect(formatDate('2026-10-18')).toBe('18 oct 2026')
    expect(formatMonth('2026-03')).toBe('mar 2026')
    expect(formatMiles(null)).toBe('—')
  })

  it('no corre la fecha un día por la zona horaria', () => {
    const date = parseISODate('2026-01-01')
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 0, 1])
  })

  it('muestra porcentajes con signo y días relativos', () => {
    expect(formatPercent(10.4, true)).toBe('+10.4 %')
    expect(formatPercent(-3.9, true)).toBe('-3.9 %')
    expect(formatRelativeDays(30)).toBe('en 30 días')
    expect(formatRelativeDays(-1)).toBe('hace 1 día')
    expect(formatRelativeDays(0)).toBe('hoy')
  })
})

describe('lectura de números en formularios', () => {
  it('entiende millas con separador de miles', () => {
    expect(parseIntegerInput('62,784')).toBe(62784)
    expect(parseIntegerInput('')).toBeNull()
    expect(parseIntegerInput('abc')).toBeNaN()
  })

  it('entiende decimales con punto o coma', () => {
    expect(parseDecimalInput('9.5')).toBe(9.5)
    expect(parseDecimalInput('9,5')).toBe(9.5)
    expect(parseDecimalInput('$1,234.50')).toBe(1234.5)
    expect(parseDecimalInput(' ')).toBeNull()
  })
})
