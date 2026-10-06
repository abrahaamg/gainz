import type { Routine } from '../types/routine'

/**
 * Las rutinas ajenas (oficiales o públicas de otro usuario) se ocultan; las
 * propias se eliminan. Sin usuario cargado no se ofrece ocultar.
 */
export function canHide(routine: Pick<Routine, 'user_id'>, userId: number | undefined): boolean {
  return userId !== undefined && routine.user_id !== userId
}

/** Separa la lista en las que se ven y las que el usuario ha ocultado. */
export function splitHidden(routines: Routine[]): { visible: Routine[]; hidden: Routine[] } {
  return {
    visible: routines.filter(r => !r.is_hidden),
    hidden: routines.filter(r => r.is_hidden),
  }
}

/** Devuelve la lista con la rutina `id` marcada como oculta o visible. */
export function markHidden(routines: Routine[], id: number, hidden: boolean): Routine[] {
  return routines.map(r => (r.id === id ? { ...r, is_hidden: hidden } : r))
}
