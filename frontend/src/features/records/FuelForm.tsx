import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { Checkbox, Field, Input, Textarea } from '../../components/ui/Field'
import { formatDate, formatGallons, formatMiles, formatMoney, todayISO } from '../../lib/format'
import { parseDecimalInput, parseIntegerInput } from '../../lib/forms'
import { useCreateFuelLog, useUpdateFuelLog } from '../../lib/queries'
import type { FuelLog } from '../../lib/types'
import { FormFooter, UnitInput } from '../../components/ui/FormParts'
import { describedBy, serverErrorMessage } from '../../lib/forms'
import { SavedNotice } from './form-parts'
import { fuelDefaults, fuelSchema, type FuelFormOutput, type FuelFormValues } from './schemas'
import { pricePerGallon } from './summary'

const FIELDS = ['date', 'mileage', 'gallons', 'total_cost', 'full_tank', 'notes'] as const

interface FuelFormProps {
  vehicleId: number
  /** Si viene, el formulario edita esa carga; si no, registra una nueva. */
  log?: FuelLog
  /** Millaje actual del vehículo, como ayuda del campo de millas. */
  currentMileage?: number
  onSaved?: (log: FuelLog) => void
  onCancel?: () => void
}

export function FuelForm({ vehicleId, log, currentMileage, onSaved, onCancel }: FuelFormProps) {
  const id = useId()
  const navigate = useNavigate()
  const createMutation = useCreateFuelLog(vehicleId)
  const updateMutation = useUpdateFuelLog()
  const [formError, setFormError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<FuelLog | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FuelFormValues, unknown, FuelFormOutput>({
    resolver: zodResolver(fuelSchema),
    defaultValues: fuelDefaults(log),
  })

  const [gallons, totalCost] = useWatch({ control, name: ['gallons', 'total_cost'] })
  const price = pricePerGallon(gallons, totalCost)

  async function onSubmit(values: FuelFormOutput) {
    setFormError(null)
    try {
      if (log) {
        const saved = await updateMutation.mutateAsync({ id: log.id, ...values })
        toast.success('Cambios guardados', { description: describeLog(saved) })
        onSaved?.(saved)
        return
      }
      const saved = await createMutation.mutateAsync(values)
      toast.success('Carga de combustible registrada', {
        description: describeLog(saved),
        action: { label: 'Ver estado', onClick: () => navigate('/estado') },
      })
      // Formulario limpio para la siguiente carga, con la fecha de hoy
      reset(fuelDefaults())
      setLastSaved(saved)
      onSaved?.(saved)
    } catch (error) {
      const message = serverErrorMessage(error, setError, FIELDS, 'No se pudo guardar la carga de combustible.')
      setFormError(message)
      toast.error(message)
    }
  }

  const mileageHint = currentMileage != null ? `Millaje actual: ${formatMiles(currentMileage)}` : undefined

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Fecha" htmlFor={`${id}-date`} error={errors.date?.message}>
          <Input
            id={`${id}-date`}
            type="date"
            max={todayISO()}
            invalid={Boolean(errors.date)}
            aria-describedby={describedBy(`${id}-date`, errors.date?.message)}
            {...register('date')}
          />
        </Field>

        <Field label="Millaje" htmlFor={`${id}-mileage`} error={errors.mileage?.message} hint={mileageHint}>
          <UnitInput
            id={`${id}-mileage`}
            trailing="mi"
            inputMode="numeric"
            autoComplete="off"
            invalid={Boolean(errors.mileage)}
            aria-describedby={describedBy(`${id}-mileage`, errors.mileage?.message, mileageHint)}
            {...register('mileage', { setValueAs: parseIntegerInput })}
          />
        </Field>

        <Field label="Galones" htmlFor={`${id}-gallons`} error={errors.gallons?.message}>
          <UnitInput
            id={`${id}-gallons`}
            trailing="gal"
            inputMode="decimal"
            autoComplete="off"
            placeholder="Ej. 9.5"
            invalid={Boolean(errors.gallons)}
            aria-describedby={describedBy(`${id}-gallons`, errors.gallons?.message)}
            {...register('gallons', { setValueAs: parseDecimalInput })}
          />
        </Field>

        <Field label="Costo total" optional htmlFor={`${id}-cost`} error={errors.total_cost?.message}>
          <UnitInput
            id={`${id}-cost`}
            leading="$"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            invalid={Boolean(errors.total_cost)}
            aria-describedby={describedBy(`${id}-cost`, errors.total_cost?.message)}
            {...register('total_cost', { setValueAs: parseDecimalInput })}
          />
        </Field>
      </div>

      <p
        aria-live="polite"
        className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-surface-2 px-3 py-2 text-sm text-fg-2"
      >
        <span>Precio por galón</span>
        {price != null ? (
          <strong className="text-base font-semibold tabular-nums text-fg">{formatMoney(price)}</strong>
        ) : (
          <span className="text-right">Escribe galones y costo</span>
        )}
      </p>

      <Checkbox
        id={`${id}-full`}
        label="Llené el tanque"
        description="El rendimiento (MPG) se calcula entre dos cargas con el tanque lleno. Si fue parcial, sus galones se suman a la siguiente carga llena."
        {...register('full_tank')}
      />

      <Field label="Notas" optional htmlFor={`${id}-notes`} error={errors.notes?.message}>
        <Textarea
          id={`${id}-notes`}
          rows={2}
          placeholder="Gasolinera, tipo de combustible…"
          invalid={Boolean(errors.notes)}
          aria-describedby={describedBy(`${id}-notes`, errors.notes?.message)}
          {...register('notes')}
        />
      </Field>

      <FormFooter
        submitLabel={log ? 'Guardar cambios' : 'Guardar carga'}
        submitting={isSubmitting}
        error={formError}
        onCancel={onCancel}
        notice={lastSaved && <SavedNotice>Se guardó: {describeLog(lastSaved)}.</SavedNotice>}
      />
    </form>
  )
}

function describeLog(log: FuelLog) {
  return `${formatGallons(log.gallons)} · ${formatDate(log.date)} · ${formatMiles(log.mileage)}`
}
