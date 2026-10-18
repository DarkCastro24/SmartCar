/** Colores de las gráficas: variables CSS, así el modo oscuro se aplica solo. */
export const CHART_COLORS = {
  series1: 'var(--series-1)',
  series2: 'var(--series-2)',
  grid: 'var(--grid)',
  axis: 'var(--axis)',
  text: 'var(--fg-2)',
  surface: 'var(--surface)',
  hover: 'var(--surface-2)',
} as const

export const AXIS_TICK = { fill: CHART_COLORS.text, fontSize: 12 }
