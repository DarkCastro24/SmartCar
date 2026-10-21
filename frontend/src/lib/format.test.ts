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
    expect(parseIntegerInput('62.784')).toBe(62784)
    expect(parseIntegerInput(' 62 784 ')).toBe(62784)
    expect(parseIntegerInput('1,200,000')).toBe(1200000)
    expect(parseIntegerInput('')).toBeNull()
    expect(parseIntegerInput('   ')).toBeNull()
    expect(parseIntegerInput('abc')).toBeNaN()
  })

  it('deja los decimales como decimales para que el esquema los rechace (no multiplica)', () => {
    expect(parseIntegerInput('62784.5')).toBe(62784.5)
    expect(parseIntegerInput('62,900.5')).toBe(62900.5)
    expect(parseIntegerInput('1.5')).toBe(1.5)
    expect(parseIntegerInput('2,5')).toBe(2.5)
    expect(parseIntegerInput('5000.5')).toBe(5000.5)
  })

  it('entiende decimales con punto o coma', () => {
    expect(parseDecimalInput('9.5')).toBe(9.5)
    expect(parseDecimalInput('9,5')).toBe(9.5)
    expect(parseDecimalInput('45,50')).toBe(45.5)
    expect(parseDecimalInput('$1,234.50')).toBe(1234.5)
    expect(parseDecimalInput('$ 45')).toBe(45)
    expect(parseDecimalInput(' ')).toBeNull()
  })

  it('toma la coma de miles en los montos (no guarda 1,200 como 1.2)', () => {
    expect(parseDecimalInput('1,200')).toBe(1200)
    expect(parseDecimalInput('1,150')).toBe(1150)
    expect(parseDecimalInput('$1,500')).toBe(1500)
    expect(parseDecimalInput('12,345')).toBe(12345)
  })

  it('rechaza mezclas ambiguas en vez de adivinar', () => {
    expect(parseDecimalInput('1.234,50')).toBeNaN()
    expect(parseDecimalInput('1,2345')).toBeNaN()
    expect(parseDecimalInput('12,34,5')).toBeNaN()
  })

  it('en galones acepta hasta 3 decimales con coma', () => {
    expect(parseDecimalInput('9,547', 3)).toBe(9.547)
    expect(parseDecimalInput('9,5', 3)).toBe(9.5)
    expect(parseDecimalInput('9.547', 3)).toBe(9.547)
  })
})
