import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm, useWatch } from 'react-hook-form'
import { describe, expect, it } from 'vitest'

import type { MaintenanceType } from '../../lib/types'
import { MaintenanceTypePicker } from './MaintenanceTypePicker'

interface Values {
  type: MaintenanceType | null
}

/** Muestra el valor del formulario para comprobar que el radio queda registrado. */
function PickerForm({ type = null, error }: { type?: MaintenanceType | null; error?: string }) {
  const { register, control } = useForm<Values>({ defaultValues: { type } })
  const value = useWatch({ control, name: 'type' })
  return (
    <>
      <MaintenanceTypePicker registration={register('type')} error={error} />
      <output data-testid="value">{value ?? 'ninguno'}</output>
    </>
  )
}

describe('MaintenanceTypePicker', () => {
  it('muestra los seis tipos como un grupo de radios con nombre', () => {
    render(<PickerForm />)
    const group = screen.getByRole('radiogroup', { name: 'Tipo de mantenimiento' })
    expect(group).toBeInTheDocument()
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(6)
    for (const name of ['Cambio de aceite', 'Filtro de aire', 'Filtro de cabina', 'Bujías', 'Pastillas de freno', 'Batería']) {
      expect(screen.getByRole('radio', { name })).not.toBeChecked()
    }
  })

  it('al tocar una tarjeta elige ese tipo', async () => {
    const user = userEvent.setup()
    render(<PickerForm />)
    await user.click(screen.getByText('Bujías'))
    expect(screen.getByRole('radio', { name: 'Bujías' })).toBeChecked()
    expect(screen.getByTestId('value')).toHaveTextContent('spark_plugs')
  })

  it('respeta el tipo preseleccionado', () => {
    render(<PickerForm type="battery" />)
    expect(screen.getByRole('radio', { name: 'Batería' })).toBeChecked()
  })

  it('anuncia el error y lo asocia al grupo', () => {
    render(<PickerForm error="Elige qué mantenimiento le hiciste." />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Elige qué mantenimiento le hiciste.')
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-describedby', alert.id)
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true')
  })
})
