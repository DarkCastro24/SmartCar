import { describe, expect, it } from 'vitest'

import {
  describeDue,
  describeInterval,
  describeLastService,
  describeRemaining,
  formatDuration,
  sortByUrgency,
  summarizeStatus,
} from './status-text'
import { makeStatusItem } from './test-fixtures'

describe('orden por urgencia', () => {
  it('pone primero vencido, luego próximo, sin registro y al día', () => {
    const items = [
      makeStatusItem({ type: 'oil_change', status: 'al_dia', percent: 19 }),
      makeStatusItem({ type: 'battery', status: 'sin_registro', percent: null }),
      makeStatusItem({ type: 'air_filter', status: 'proximo', percent: 90 }),
      makeStatusItem({ type: 'brake_pads', status: 'vencido', percent: 108 }),
    ]
    expect(sortByUrgency(items).map((item) => item.status)).toEqual(['vencido', 'proximo', 'sin_registro', 'al_dia'])
  })

  it('con el mismo estado pone primero el más avanzado y no cambia la lista original', () => {
    const items = [
      makeStatusItem({ type: 'oil_change', percent: 19 }),
      makeStatusItem({ type: 'brake_pads', percent: 30 }),
    ]
    expect(sortByUrgency(items).map((item) => item.type)).toEqual(['brake_pads', 'oil_change'])
    expect(items[0].type).toBe('oil_change')
  })
})

describe('lo que falta en lenguaje natural', () => {
  it('dice cuánto falta por millas o por tiempo', () => {
    expect(describeRemaining(makeStatusItem({ miles_left: 500, days_left: 30 }))).toBe('Faltan 500 mi o 30 días')
    expect(describeRemaining(makeStatusItem({ miles_left: 4042, days_left: 151 }))).toBe('Faltan 4,042 mi o 5 meses')
    expect(describeRemaining(makeStatusItem({ miles_left: null, days_left: 1 }))).toBe('Falta 1 día')
  })

  it('dice cuánto se pasó cuando está vencido (valores negativos)', () => {
    const byMiles = makeStatusItem({ status: 'vencido', miles_left: -1200, days_left: 20 })
    const byDays = makeStatusItem({ status: 'vencido', miles_left: 3916, days_left: -30 })
    const byBoth = makeStatusItem({ status: 'vencido', miles_left: -150, days_left: -2 })
    expect(describeRemaining(byMiles)).toBe('Te pasaste por 1,200 mi')
    expect(describeRemaining(byDays)).toBe('Vencido hace 30 días')
    expect(describeRemaining(byBoth)).toBe('Te pasaste por 150 mi y 2 días')
    expect(describeRemaining(makeStatusItem({ status: 'vencido', miles_left: 0, days_left: 10 }))).toBe('Toca hoy')
  })

  it('pide registrar cuando no hay registros', () => {
    const item = makeStatusItem({ status: 'sin_registro', last: null, percent: null, miles_left: null, days_left: null })
    expect(describeRemaining(item)).toBe('Registra el último para saber cuándo toca')
    expect(describeDue(item)).toBeNull()
    expect(describeLastService(item)).toBe('Sin registro')
  })

  it('dice cuándo toca, en pasado si ya venció', () => {
    expect(describeDue(makeStatusItem())).toBe('Toca el 18 mar 2027 o a las 66,826 mi')
    expect(describeDue(makeStatusItem({ next_due_mileage: null }))).toBe('Toca el 18 mar 2027')
    expect(describeDue(makeStatusItem({ status: 'vencido' }))).toBe('Tocaba el 18 mar 2027 o a las 66,826 mi')
  })

  it('si ya venció, dice solo el límite que se pasó', () => {
    const base = { status: 'vencido' as const, next_due_date: '2026-09-18', next_due_mileage: 66700 }
    // Venció por fecha pero aún le faltan millas: no "o a las 66,700 mi"
    expect(describeDue(makeStatusItem({ ...base, days_left: -31, miles_left: 3916 }))).toBe('Tocaba el 18 sept 2026')
    expect(describeDue(makeStatusItem({ ...base, days_left: 20, miles_left: -1200 }))).toBe('Tocaba a las 66,700 mi')
    expect(describeDue(makeStatusItem({ ...base, days_left: -2, miles_left: -150 }))).toBe(
      'Tocaba el 18 sept 2026 o a las 66,700 mi',
    )
    expect(describeDue(makeStatusItem({ ...base, days_left: null, miles_left: 0, next_due_date: null }))).toBe(
      'Tocaba a las 66,700 mi',
    )
  })

  it('describe el último mantenimiento y el intervalo', () => {
    expect(describeLastService(makeStatusItem())).toBe('18 sept 2026 · 61,826 mi')
    expect(describeInterval(5000, 6)).toBe('Cada 5,000 mi o 6 meses')
    expect(describeInterval(null, 48)).toBe('Cada 4 años')
    expect(describeInterval(15000, 12)).toBe('Cada 15,000 mi o 1 año')
    expect(describeInterval(null, null)).toBe('Sin intervalo definido')
  })

  it('convierte días en meses o años cuando son muchos', () => {
    expect(formatDuration(1)).toBe('1 día')
    expect(formatDuration(89)).toBe('89 días')
    expect(formatDuration(395)).toBe('13 meses')
    expect(formatDuration(730)).toBe('2 años')
    expect(formatDuration(1635)).toBe('4 años y 6 meses')
    expect(formatDuration(168, { exactDays: true })).toBe('168 días')
  })
})

describe('resumen del estado general', () => {
  it('cuenta vencidos, próximos y sin registro', () => {
    expect(summarizeStatus({ vencido: 1, proximo: 1, sin_registro: 0, al_dia: 4 })).toBe('1 vencido · 1 próximo')
    expect(summarizeStatus({ vencido: 2, proximo: 0, sin_registro: 3, al_dia: 1 })).toBe('2 vencidos · 3 sin registro')
    expect(summarizeStatus({ vencido: 0, proximo: 0, sin_registro: 0, al_dia: 6 })).toBe('Todo al día')
  })
})
