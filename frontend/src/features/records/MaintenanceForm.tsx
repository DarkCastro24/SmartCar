import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useId, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { Field, Input, Textarea } from '../../components/ui/Field'
import { isUnauthorized } from '../../lib/api'
import { formatDate, formatMiles } from '../../lib/format'
import { parseDecimalInput, parseIntegerInput } from '../../lib/forms'
import { useToday } from '../../lib/hooks'
import { useCreateMaintenance, useUpdateMaintenance } from '../../lib/queries'
import type { MaintenanceRecord, MaintenanceType } from '../../lib/types'
import { FormFooter, UnitInput } from '../../components/ui/FormParts'
import { describedBy, serverErrorMessage } from '../../lib/forms'
import { SavedNotice } from './form-parts'
import { MaintenanceTypePicker } from './MaintenanceTypePicker'
import {
  maintenanceDefaults,
  maintenanceSchema,
  type MaintenanceFormOutput,
  type MaintenanceFormValues,
} from './schemas'

const FIELDS = ['type', 'date', 'mileage', 'cost', 'notes'] as const

interface MaintenanceFormProps {
  vehicleId: number
  /** Si viene, el formulario edita ese registro; si no, registra uno nuevo. */
  record?: MaintenanceRecord
  /** Tipo preseleccionado al registrar (?type= desde el Estado general). */
  defaultType?: MaintenanceType | null
  /** Millaje actual del vehículo, como ayuda del campo de millas. */
  currentMileage?: number
  onSaved?: (record: MaintenanceRecord) => void
  onCancel?: () => void
}

export function MaintenanceForm({
  vehicleId,
  record,
  defaultType = null,
  currentMileage,
  onSaved,
  onCancel,
}: MaintenanceFormProps) {
  const id = useId()
  const navigate = useNavigate()
  const createMutation = useCreateMaintenance(vehicleId)
  const updateMutation = useUpdateMaintenance()
  const [formError, setFormError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<MaintenanceRecord | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceFormValues, unknown, MaintenanceFormOutput>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: maintenanceDefaults(record, defaultType),
  })

  // Si la app sigue abierta al pasar la medianoche, la fecha propuesta pasa a hoy
  // (solo al registrar y si el usuario no la cambió)
  const today = useToday()
  const autoDate = useRef(today)
  useEffect(() => {
    if (autoDate.current === today) return
    if (!record && getValues('date') === autoDate.current) setValue('date', today)
    autoDate.current = today
  }, [today, record, getValues, setValue])

  async function onSubmit(values: MaintenanceFormOutput) {
    setFormError(null)
    try {
      if (record) {
        const saved = await updateMutation.mutateAsync({ id: record.id, ...values })
        toast.success('Cambios guardados', { description: describeRecord(saved) })
        onSaved?.(saved)
        return
      }
      const saved = await createMutation.mutateAsync(values)
      toast.success('Mantenimiento registrado', {
        description: describeRecord(saved),
        action: { label: 'Ver estado', onClick: () => navigate('/estado') },
      })
      // Formulario limpio para el siguiente registro, con la fecha de hoy
      reset(maintenanceDefaults())
      setLastSaved(saved)
      onSaved?.(saved)
    } catch (error) {
      if (isUnauthorized(error)) return // AuthProvider ya avisa y lleva al login
      // El error queda junto al botón (role=alert); un toast lo repetiría
      setFormError(serverErrorMessage(error, setError, FIELDS, 'No se pudo guardar el mantenimiento.'))
    }
  }

  const mileageHint = currentMileage != null ? `Millaje actual: ${formatMiles(currentMileage)}` : undefined

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <MaintenanceTypePicker registration={register('type')} error={errors.type?.message} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Fecha" htmlFor={`${id}-date`} error={errors.date?.message}>
          <Input
            id={`${id}-date`}
            type="date"
            max={today}
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

        <Field label="Costo" optional htmlFor={`${id}-cost`} error={errors.cost?.message}>
          <UnitInput
            id={`${id}-cost`}
            leading="$"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            invalid={Boolean(errors.cost)}
            aria-describedby={describedBy(`${id}-cost`, errors.cost?.message)}
            {...register('cost', { setValueAs: parseDecimalInput })}
          />
        </Field>
      </div>

      <Field label="Notas" optional htmlFor={`${id}-notes`} error={errors.notes?.message}>
        <Textarea
          id={`${id}-notes`}
          rows={3}
          placeholder="Taller, marca del repuesto, observaciones…"
          invalid={Boolean(errors.notes)}
          aria-describedby={describedBy(`${id}-notes`, errors.notes?.message)}
          {...register('notes')}
        />
      </Field>

      <FormFooter
        submitLabel={record ? 'Guardar cambios' : 'Guardar mantenimiento'}
        submitting={isSubmitting}
        error={formError}
        onCancel={onCancel}
        notice={lastSaved && <SavedNotice>Se guardó: {describeRecord(lastSaved)}.</SavedNotice>}
      />
    </form>
  )
}

function describeRecord(record: MaintenanceRecord) {
  return `${record.label} · ${formatDate(record.date)} · ${formatMiles(record.mileage)}`
}
