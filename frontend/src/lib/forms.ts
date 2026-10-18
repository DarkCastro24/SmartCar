import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

import { getFieldErrors } from './api'

/**
 * Convierte el texto de un input a número para react-hook-form.
 * Se usa con: register('mileage', { setValueAs: parseIntegerInput })
 * "" -> null (campo vacío) · "62,784" -> 62784 · "abc" -> NaN (zod lo marca inválido)
 */
export function parseIntegerInput(value: unknown): number | null {
  if (value === '' || value == null) return null
  if (typeof value === 'number') return value
  const clean = String(value).replace(/[\s,.]/g, '')
  return clean === '' ? null : Number(clean)
}

/** Igual que parseIntegerInput pero acepta decimales: "9.5" o "9,5" -> 9.5 */
export function parseDecimalInput(value: unknown): number | null {
  if (value === '' || value == null) return null
  if (typeof value === 'number') return value
  let text = String(value).trim().replace(/\s/g, '').replace(/^\$/, '')
  if (text === '') return null
  // "9,5" (coma decimal) -> "9.5"; "1,234.50" (coma de miles) -> "1234.50"
  text = text.includes(',') && !text.includes('.') ? text.replace(',', '.') : text.replace(/,/g, '')
  return Number(text)
}

/** Texto vacío -> null (para campos opcionales como notas o placa). */
export function emptyToNull(value: unknown) {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

/**
 * Muestra en cada campo del formulario los errores de validación del backend.
 * Devuelve true si aplicó alguno.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): boolean {
  const serverErrors = getFieldErrors(error)
  let applied = false
  for (const field of fields) {
    const message = serverErrors[field]
    if (message) {
      setError(field, { type: 'server', message })
      applied = true
    }
  }
  return applied
}
