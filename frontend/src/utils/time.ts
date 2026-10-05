/** Reloj mm:ss (temporizadores de la sesión en vivo). */
export function fmtTime(secs: number): string {
  const safe = Math.max(0, Math.floor(secs))
  const m = Math.floor(safe / 60).toString().padStart(2, '0')
  const s = (safe % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

/** Duración legible: "1h 5m" o "12m 30s" (resumen de sesión). */
export function fmtDuration(secs: number): string {
  const safe = Math.max(0, Math.floor(secs))
  const h = Math.floor(safe / 3600)
  const m = Math.floor((safe % 3600) / 60)
  const s = safe % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s}s`
}
