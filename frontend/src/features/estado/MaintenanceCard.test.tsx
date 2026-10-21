import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import type { StatusItem } from '../../lib/types'
import { MaintenanceCard } from './MaintenanceCard'
import { makeStatusItem } from './test-fixtures'

function renderCard(item: StatusItem) {
  return render(
    <MemoryRouter>
      <MaintenanceCard item={item} />
    </MemoryRouter>,
  )
}

describe('<MaintenanceCard>', () => {
  it('muestra el estado, el avance (con tope en 100 %) y el enlace para registrar si está vencido', () => {
    renderCard(
      makeStatusItem({
        type: 'air_filter',
        label: 'Filtro de aire',
        status: 'vencido',
        percent: 108,
        every_miles: 15000,
        every_months: 12,
        miles_left: -1200,
        days_left: 20,
        next_due_mileage: 66700,
        next_due_date: '2026-09-18',
      }),
    )

    expect(screen.getByRole('heading', { name: 'Filtro de aire' })).toBeInTheDocument()
    expect(screen.getByText('Vencido')).toBeInTheDocument()
    expect(screen.getByText('Te pasaste por 1,200 mi')).toBeInTheDocument()
    expect(screen.getByText('Tocaba a las 66,700 mi')).toBeInTheDocument()

    const meter = screen.getByRole('meter', { name: 'Avance del intervalo' })
    expect(meter).toHaveAttribute('aria-valuenow', '100')
    expect(meter).toHaveAttribute('aria-valuetext', '108 % del intervalo')

    expect(screen.getByRole('link', { name: 'Registrar filtro de aire' })).toHaveAttribute(
      'href',
      '/registrar?tipo=mantenimiento&type=air_filter',
    )
  })

  it('sin registros: no muestra medidor y ofrece registrar', () => {
    renderCard(
      makeStatusItem({ status: 'sin_registro', last: null, percent: null, miles_left: null, days_left: null }),
    )
    expect(screen.getAllByText('Sin registro')).toHaveLength(2) // insignia + último mantenimiento
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Registrar/ })).toBeInTheDocument()
  })

  it('al día: muestra lo que falta y no ofrece registrar', () => {
    renderCard(makeStatusItem())
    expect(screen.getByText('Al día')).toBeInTheDocument()
    expect(screen.getByText('Faltan 4,042 mi o 5 meses')).toBeInTheDocument()
    expect(screen.getByText('18 sept 2026 · 61,826 mi')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
