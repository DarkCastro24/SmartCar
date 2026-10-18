import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { api } from '../../lib/api'
import type { Vehicle } from '../../lib/types'
import { VehicleForm } from './VehicleForm'

const corolla: Vehicle = {
  id: 4,
  make: 'Toyota',
  model: 'Corolla',
  year: 2018,
  plate: 'P123-456',
  color: 'Gris',
  initial_mileage: 52000,
  created_at: '2026-10-18T23:06:53+00:00',
}

/** Caché nuevo por prueba y sin reintentos, para que los errores lleguen enseguida. */
function renderWithQuery(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

function response<T>(data: T, status = 200): AxiosResponse<T> {
  return { data, status, statusText: '', headers: {}, config: { headers: new AxiosHeaders() } }
}

afterEach(() => vi.restoreAllMocks())

describe('VehicleForm en modo edición', () => {
  it('precarga los datos del vehículo', () => {
    renderWithQuery(<VehicleForm vehicle={corolla} onCancel={() => {}} />)

    expect(screen.getByLabelText('Marca')).toHaveValue('Toyota')
    expect(screen.getByLabelText('Modelo')).toHaveValue('Corolla')
    expect(screen.getByLabelText(/^Año/)).toHaveValue('2018')
    expect(screen.getByLabelText(/^Placa/)).toHaveValue('P123-456')
    expect(screen.getByLabelText(/^Color/)).toHaveValue('Gris')
    expect(screen.getByLabelText('Millaje inicial')).toHaveValue('52000')
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })

  it('guarda los cambios con PUT y avisa con el vehículo guardado', async () => {
    const user = userEvent.setup()
    const onSaved = vi.fn()
    const updated = { ...corolla, plate: 'P999-111', color: null }
    const put = vi.spyOn(api, 'put').mockResolvedValue(response(updated))
    renderWithQuery(<VehicleForm vehicle={corolla} onSaved={onSaved} />)

    await user.clear(screen.getByLabelText(/^Placa/))
    await user.type(screen.getByLabelText(/^Placa/), ' p999-111 ')
    await user.clear(screen.getByLabelText(/^Color/))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(updated))
    expect(put).toHaveBeenCalledWith('/vehicles/4', {
      make: 'Toyota',
      model: 'Corolla',
      year: 2018,
      plate: 'P999-111',
      color: null,
      initial_mileage: 52000,
    })
  })
})

describe('VehicleForm al registrar', () => {
  it('pide el millaje actual y no muestra Cancelar sin onCancel', () => {
    renderWithQuery(<VehicleForm />)
    expect(screen.getByLabelText('Millaje actual')).toHaveValue('')
    expect(screen.getByText('Lo que marca hoy el odómetro.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
  })

  it('valida marca y modelo antes de llamar a la API', async () => {
    const user = userEvent.setup()
    const post = vi.spyOn(api, 'post')
    renderWithQuery(<VehicleForm />)

    await user.click(screen.getByRole('button', { name: 'Guardar vehículo' }))

    expect(await screen.findByText('Escribe la marca.')).toBeInTheDocument()
    expect(screen.getByText('Escribe el modelo.')).toBeInTheDocument()
    expect(screen.getByLabelText('Marca')).toHaveAttribute('aria-invalid', 'true')
    expect(post).not.toHaveBeenCalled()
  })

  it('muestra en su campo los errores del backend', async () => {
    const user = userEvent.setup()
    const error = new AxiosError('Bad Request', 'ERR_BAD_REQUEST', undefined, undefined, {
      ...response({ msg: 'Datos inválidos', errors: { plate: ['Esa placa ya está registrada.'] } }, 400),
    })
    vi.spyOn(api, 'post').mockRejectedValue(error)
    renderWithQuery(<VehicleForm />)

    await user.type(screen.getByLabelText('Marca'), 'Nissan')
    await user.type(screen.getByLabelText('Modelo'), 'Sentra')
    await user.type(screen.getByLabelText(/^Placa/), 'P555-000')
    await user.click(screen.getByRole('button', { name: 'Guardar vehículo' }))

    expect(await screen.findByText('Esa placa ya está registrada.')).toBeInTheDocument()
    expect(screen.getByText('Revisa los campos marcados.')).toBeInTheDocument()
  })
})
