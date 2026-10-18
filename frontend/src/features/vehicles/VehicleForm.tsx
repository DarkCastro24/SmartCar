import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Field, Input } from '../../components/ui/Field'
import { getErrorMessage } from '../../lib/api'
import { vehicleName } from '../../lib/format'
import { applyServerErrors, parseIntegerInput } from '../../lib/forms'
import { useCreateVehicle, useUpdateVehicle } from '../../lib/queries'
import type { Vehicle } from '../../lib/types'
import { FormFooter, UnitInput } from '../../components/ui/FormParts'
import { describedBy } from '../../lib/forms'
import {
  VEHICLE_FIELDS,
  vehicleDefaults,
  vehicleSchema,
  type VehicleFormOutput,
  type VehicleFormValues,
} from './vehicle-schema'

export interface VehicleFormProps {
  /** Si viene, el formulario edita ese vehículo; si no, registra uno nuevo. */
  vehicle?: Vehicle
  /** Se llama con el vehículo guardado (nuevo o editado). */
  onSaved?: (vehicle: Vehicle) => void
  onCancel?: () => void
}

export function VehicleForm({ vehicle, onSaved, onCancel }: VehicleFormProps) {
  const id = useId()
  const createMutation = useCreateVehicle()
  const updateMutation = useUpdateVehicle()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormValues, unknown, VehicleFormOutput>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: vehicleDefaults(vehicle),
  })

  async function onSubmit(values: VehicleFormOutput) {
    setFormError(null)
    try {
      const saved = vehicle
        ? await updateMutation.mutateAsync({ id: vehicle.id, ...values })
        : await createMutation.mutateAsync(values)
      toast.success(vehicle ? 'Cambios guardados' : 'Vehículo registrado', { description: vehicleName(saved) })
      onSaved?.(saved)
    } catch (error) {
      const applied = applyServerErrors(error, setError, VEHICLE_FIELDS)
      setFormError(applied ? 'Revisa los campos marcados.' : getErrorMessage(error, 'No se pudo guardar el vehículo.'))
    }
  }

  // Al editar, el millaje es el de cuando se registró; el actual sale de los registros
  const mileageLabel = vehicle ? 'Millaje inicial' : 'Millaje actual'
  const mileageHint = vehicle ? 'Lo que marcaba el odómetro al registrarlo.' : 'Lo que marca hoy el odómetro.'
  const fieldId = (name: string) => `${id}-${name}`

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Marca" htmlFor={fieldId('make')} error={errors.make?.message} className="col-span-2 sm:col-span-1">
          <Input
            id={fieldId('make')}
            placeholder="Toyota"
            autoComplete="off"
            autoCapitalize="words"
            invalid={Boolean(errors.make)}
            aria-describedby={describedBy(fieldId('make'), errors.make?.message)}
            {...register('make')}
          />
        </Field>

        <Field label="Modelo" htmlFor={fieldId('model')} error={errors.model?.message} className="col-span-2 sm:col-span-1">
          <Input
            id={fieldId('model')}
            placeholder="Corolla"
            autoComplete="off"
            autoCapitalize="words"
            invalid={Boolean(errors.model)}
            aria-describedby={describedBy(fieldId('model'), errors.model?.message)}
            {...register('model')}
          />
        </Field>

        <Field label="Año" optional htmlFor={fieldId('year')} error={errors.year?.message}>
          <Input
            id={fieldId('year')}
            inputMode="numeric"
            maxLength={4}
            placeholder="2018"
            autoComplete="off"
            className="tabular-nums"
            invalid={Boolean(errors.year)}
            aria-describedby={describedBy(fieldId('year'), errors.year?.message)}
            {...register('year', { setValueAs: parseIntegerInput })}
          />
        </Field>

        <Field label="Placa" optional htmlFor={fieldId('plate')} error={errors.plate?.message}>
          <Input
            id={fieldId('plate')}
            placeholder="P123-456"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            // Se ve en mayúsculas mientras se escribe y así se guarda
            className="uppercase"
            invalid={Boolean(errors.plate)}
            aria-describedby={describedBy(fieldId('plate'), errors.plate?.message)}
            {...register('plate')}
          />
        </Field>

        <Field label="Color" optional htmlFor={fieldId('color')} error={errors.color?.message} className="col-span-2 sm:col-span-1">
          <Input
            id={fieldId('color')}
            placeholder="Gris"
            autoComplete="off"
            invalid={Boolean(errors.color)}
            aria-describedby={describedBy(fieldId('color'), errors.color?.message)}
            {...register('color')}
          />
        </Field>

        <Field
          label={mileageLabel}
          htmlFor={fieldId('mileage')}
          error={errors.initial_mileage?.message}
          hint={mileageHint}
          className="col-span-2 sm:col-span-1"
        >
          <UnitInput
            id={fieldId('mileage')}
            trailing="mi"
            inputMode="numeric"
            placeholder="0"
            autoComplete="off"
            invalid={Boolean(errors.initial_mileage)}
            aria-describedby={describedBy(fieldId('mileage'), errors.initial_mileage?.message, mileageHint)}
            {...register('initial_mileage', { setValueAs: parseIntegerInput })}
          />
        </Field>
      </div>

      <FormFooter
        submitLabel={vehicle ? 'Guardar cambios' : 'Guardar vehículo'}
        submitting={isSubmitting}
        error={formError}
        onCancel={onCancel}
      />
    </form>
  )
}
