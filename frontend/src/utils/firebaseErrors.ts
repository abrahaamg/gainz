// Traduce códigos de error de Firebase Auth a claves de es.json (auth.*).
const CODE_TO_KEY: Record<string, string> = {
  'auth/user-not-found': 'auth.wrongCredentials',
  'auth/wrong-password': 'auth.wrongCredentials',
  'auth/invalid-credential': 'auth.wrongCredentials',
  'auth/too-many-requests': 'auth.tooManyAttempts',
  'auth/email-already-in-use': 'auth.emailInUse',
  'auth/invalid-email': 'auth.invalidEmail',
  'auth/weak-password': 'auth.passwordTooShort',
  'auth/network-request-failed': 'auth.networkError',
  'auth/popup-blocked': 'auth.popupBlocked',
  'auth/user-disabled': 'auth.userDisabled',
}

// Códigos que no son un error real (el usuario cerró el popup).
const SILENT = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request'])

// Devuelve la clave i18n a mostrar, o null si no hay que mostrar error.
export function firebaseErrorKey(err: unknown, fallbackKey: string): string | null {
  const code = (err as { code?: string } | null)?.code
  if (code && SILENT.has(code)) return null
  return (code && CODE_TO_KEY[code]) || fallbackKey
}
