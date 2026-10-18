import { zodResolver } from '@hookform/resolvers/zod'
import { Save } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '../../components/ui/Button'
import { ErrorState, LoadingState } from '../../components/ui/States'
import { getErrorMessage } from '../../lib/api'
import { MAINTENANCE_META } from '../../lib/maintenance'
import { useIntervals, useMaintenanceTypes, useResetInterval, useSaveIntervals } from '../../lib/queries'
import type { Interval, MaintenanceType } from '../../lib/types'
import { FormError } from '../../components/ui/FormParts'
import { IntervalRow } from './IntervalRow'
import {
  changedIntervals,
  describeInterval,
  intervalsFormSchema,
  toIntervalsFormValues,
  type IntervalsFormValues,
} from './intervals'

interface IntervalsEditorProps {
  vehicleId: number
  /** Se llama después de guardar los cambios. */
  onSaved?: () => void
  onCancel?: () => void
}

/** Cada cuánto toca cada mantenimiento de un vehículo. */
export function IntervalsEditor({ vehicleId, onSaved, onCancel }: IntervalsEditorProps) {
  const query = useIntervals(vehicleId)

  if (query.isPending) return <LoadingState label="Cargando intervalos…" />
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />
  return <IntervalsForm vehicleId={vehicleId} saved={query.data} onSaved={onSaved} onCancel={onCancel} />
}

interface IntervalsFormProps extends IntervalsEditorProps {
  saved: Interval[]
}

function IntervalsForm({ vehicleId, saved, onSaved, onCancel }: IntervalsFormProps) {
  const saveMutation = useSaveIntervals(vehicleId)
  const resetMutation = useResetInterval(vehicleId)
  const { data: types } = useMaintenanceTypes()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<IntervalsFormValues>({
    resolver: zodResolver(intervalsFormSchema),
    // Solo al montar: si el caché se refresca, no se pierden los cambios sin guardar
    defaultValues: toIntervalsFormValues(saved),
  })

  const rows = useWatch({ control, name: 'intervals' })
  const changes = changedIntervals(saved, rows)
  const changedTypes = new Set(changes.map((item) => item.type))

  async function onSubmit(values: IntervalsFormValues) {
    const items = changedIntervals(saved, values.intervals)
    if (items.length === 0) return
    setFormError(null)
    try {
      await saveMutation.mutateAsync(items)
      toast.success(items.length === 1 ? 'Intervalo guardado' : 'Intervalos guardados', {
        description: items.map((item) => MAINTENANCE_META[item.type].label).join(', '),
      })
      onSaved?.()
    } catch (error) {
      setFormError(getErrorMessage(error, 'No se pudieron guardar los intervalos.'))
    }
  }

  async function resetRow(index: number, type: MaintenanceType) {
    try {
      const updated = await resetMutation.mutateAsync(type)
      const row = updated.find((item) => item.type === type)
      if (!row) return
      // Solo esa fila vuelve al sugerido; las demás conservan lo que se esté editando
      setValue(`intervals.${index}.every_miles`, row.every_miles)
      setValue(`intervals.${index}.every_months`, row.every_months)
      clearErrors(`intervals.${index}`)
      toast.success('Intervalo restablecido', {
        description: `${row.label}: ${describeInterval(row.every_miles, row.every_months)}`,
      })
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo restablecer el intervalo.'))
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <p className="text-sm text-fg-2">
        Cada cuánto toca cada mantenimiento (lo que llegue primero). Los valores sugeridos se pueden cambiar según el
        manual del carro; deja vacío lo que no aplique.
      </p>

      <ul className="divide-y divide-border">
        {saved.map((interval, index) => (
          <IntervalRow
            key={interval.type}
            index={index}
            interval={interval}
            suggested={types?.find((item) => item.value === interval.type)}
            register={register}
            errors={errors.intervals?.[index]}
            changed={changedTypes.has(interval.type)}
            resetting={resetMutation.isPending && resetMutation.variables === interval.type}
            onReset={() => void resetRow(index, interval.type)}
          />
        ))}
      </ul>

      {/* Pie fijo: en el teléfono el botón de guardar queda a la vista al desplazarse */}
      <div className="sticky bottom-0 -mx-5 -mb-5 space-y-3 border-t border-border bg-surface px-5 py-3">
        {formError && <FormError message={formError} />}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p role="status" className="text-sm text-fg-2">
            {pendingLabel(changes.length)}
          </p>
          <div className="flex gap-2 *:flex-1 sm:*:flex-none">
            {onCancel && (
              <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={changes.length === 0}
              icon={<Save aria-hidden className="size-4" />}
            >
              Guardar
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}

function pendingLabel(count: number) {
  if (count === 0) return 'Sin cambios por guardar'
  return count === 1 ? '1 intervalo por guardar' : `${count} intervalos por guardar`
}
