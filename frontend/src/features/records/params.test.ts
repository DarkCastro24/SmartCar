import { describe, expect, it } from 'vitest'

import {
  dateRangeError,
  filtersFromParams,
  filtersToParams,
  hasActiveFilters,
  historyTabFromParams,
  isISODate,
  presetTypeFromParams,
  registerTabFromParams,
} from './params'

const params = (query: string) => new URLSearchParams(query)

describe('filtros <-> URL', () => {
  it('lee tipo y fechas válidos', () => {
    expect(filtersFromParams(params('type=oil_change&from=2026-01-01&to=2026-06-30'))).toEqual({
      type: 'oil_change',
      from: '2026-01-01',
      to: '2026-06-30',
    })
  })

  it('ignora valores inválidos en vez de romper la consulta', () => {
    expect(filtersFromParams(params('type=turbo&from=ayer&to=2026-02-30'))).toEqual({})
    expect(filtersFromParams(params(''))).toEqual({})
  })

  it('escribe solo los filtros con valor y conserva los demás parámetros', () => {
    const next = filtersToParams({ type: 'battery', from: '2026-03-01' }, params('tab=mantenimientos&to=2026-12-31'))
    expect(next.get('tab')).toBe('mantenimientos')
    expect(next.get('type')).toBe('battery')
    expect(next.get('from')).toBe('2026-03-01')
    expect(next.has('to')).toBe(false)
  })

  it('limpiar filtros deja solo la pestaña', () => {
    expect(filtersToParams({}, params('tab=combustible&from=2026-01-01&to=2026-02-01')).toString()).toBe(
      'tab=combustible',
    )
  })

  it('ida y vuelta da los mismos filtros', () => {
    const filters = { type: 'brake_pads' as const, from: '2026-01-15', to: '2026-08-31' }
    expect(filtersFromParams(filtersToParams(filters))).toEqual(filters)
  })

  it('sabe si hay filtros activos', () => {
    expect(hasActiveFilters({})).toBe(false)
    expect(hasActiveFilters({ from: '2026-01-01' })).toBe(true)
  })
})

describe('rango de fechas', () => {
  it('marca "desde" posterior a "hasta"', () => {
    expect(dateRangeError({ from: '2026-05-01', to: '2026-04-30' })).toMatch(/no puede ser posterior/)
  })

  it('acepta rangos válidos, iguales o abiertos', () => {
    expect(dateRangeError({ from: '2026-04-01', to: '2026-04-30' })).toBeNull()
    expect(dateRangeError({ from: '2026-04-30', to: '2026-04-30' })).toBeNull()
    expect(dateRangeError({ from: '2026-04-30' })).toBeNull()
  })

  it('reconoce fechas ISO reales', () => {
    expect(isISODate('2026-10-18')).toBe(true)
    expect(isISODate('2026-02-29')).toBe(false)
    expect(isISODate('18/10/2026')).toBe(false)
  })
})

describe('pestañas y tipo preseleccionado', () => {
  it('Registrar abre en mantenimiento salvo que la URL diga otra cosa', () => {
    expect(registerTabFromParams(params(''))).toBe('mantenimiento')
    expect(registerTabFromParams(params('tipo=combustible'))).toBe('combustible')
    expect(registerTabFromParams(params('tipo=vehiculo'))).toBe('vehiculo')
    expect(registerTabFromParams(params('tipo=otro'))).toBe('mantenimiento')
  })

  it('Consultar abre en mantenimientos salvo que la URL diga otra cosa', () => {
    expect(historyTabFromParams(params(''))).toBe('mantenimientos')
    expect(historyTabFromParams(params('tab=combustible'))).toBe('combustible')
    expect(historyTabFromParams(params('tab=x'))).toBe('mantenimientos')
  })

  it('preselecciona solo tipos de mantenimiento válidos', () => {
    expect(presetTypeFromParams(params('type=air_filter'))).toBe('air_filter')
    expect(presetTypeFromParams(params('type=nitro'))).toBeNull()
    expect(presetTypeFromParams(params(''))).toBeNull()
  })
})
