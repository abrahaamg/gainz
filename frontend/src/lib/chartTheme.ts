// Tema compartido de las gráficas (Recharts) de Dashboard y Progress.
export const CHART_THEME = {
  accent: '#F5C400',
  grid: 'rgba(255,255,255,0.06)',
  gridDash: '3 3',
  /** Ticks de ejes: #a3a3a3 sobre fondo oscuro (contraste ≥ 4.5:1) */
  tick: { fontSize: 12, fill: '#a3a3a3' },
  tooltip: {
    background: '#1a1a1a',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '1rem',
    fontSize: 12,
    color: '#fff',
  },
  /** Radar: rejilla polar */
  polarGrid: 'rgba(255,255,255,0.1)',
  /** Línea secundaria (progresión de peso) */
  line: '#ffffff',
  dotStroke: '#1a1a1a',
} as const

/** Props comunes de <XAxis>/<YAxis> para el tema. */
export const AXIS_PROPS = {
  tick: CHART_THEME.tick,
  stroke: CHART_THEME.grid,
  tickLine: false,
} as const
