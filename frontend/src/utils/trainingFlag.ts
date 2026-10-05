// Marca "el perfil de entrenamiento cambió, regenera recomendaciones", aislada por usuario.
const PREFIX = 'gainz_training_changed'
const key = (uid: number) => `${PREFIX}:${uid}`

export function isTrainingChanged(uid: number | undefined): boolean {
  if (uid === undefined) return false
  try { return localStorage.getItem(key(uid)) === '1' } catch { return false }
}

export function setTrainingChanged(uid: number | undefined) {
  if (uid === undefined) return
  try { localStorage.setItem(key(uid), '1') } catch { /* sin localStorage */ }
}

export function clearTrainingChanged(uid: number | undefined) {
  if (uid === undefined) return
  try { localStorage.removeItem(key(uid)) } catch { /* sin localStorage */ }
}

// Limpia todas las marcas (también la clave antigua sin uid) al cerrar sesión.
export function clearAllTrainingFlags() {
  try {
    Object.keys(localStorage)
      .filter(k => k === PREFIX || k.startsWith(`${PREFIX}:`))
      .forEach(k => localStorage.removeItem(k))
  } catch { /* sin localStorage */ }
}
