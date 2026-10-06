// Editar un ejercicio durante la importación. Regla: solo se modifica lo propio (created_by = usuario);
// un ejercicio del catálogo público nunca se toca: se crea una copia propia con los cambios.

import type { CreateExerciseDTO, Difficulty, Exercise, ExerciseCategory } from '../../types/exercise'
import type { DraftDay, DraftExercise } from './draft'

export interface ExerciseChanges {
  name: string
  category: ExerciseCategory
  muscle_group: string
  secondary_muscles: string[]
  difficulty: Difficulty
}

export type EditMode = 'update' | 'copy'

export interface EditService {
  create: (dto: CreateExerciseDTO) => Promise<Exercise>
  update: (id: number, dto: Partial<CreateExerciseDTO>) => Promise<Exercise>
}

export type EditableExercise = Pick<Exercise, 'id' | 'name' | 'category' | 'muscle_group'> & Partial<Exercise>

export function isOwnExercise(ex: { created_by?: number | null }, userId: number | null | undefined): boolean {
  return userId != null && ex.created_by != null && ex.created_by === userId
}

export function editMode(ex: { created_by?: number | null }, userId: number | null | undefined): EditMode {
  return isOwnExercise(ex, userId) ? 'update' : 'copy'
}

/** Guarda los cambios: PUT si es propio; si es del catálogo, POST de una copia propia (el original no se toca). */
export async function saveEditedExercise(
  original: EditableExercise,
  changes: ExerciseChanges,
  userId: number | null | undefined,
  service: EditService,
): Promise<{ exercise: Exercise; mode: EditMode }> {
  const fields = {
    name: changes.name.trim(),
    category: changes.category,
    muscle_group: changes.muscle_group,
    secondary_muscles: changes.secondary_muscles.filter(m => m !== changes.muscle_group),
    difficulty: changes.difficulty,
  }
  if (isOwnExercise(original, userId)) {
    return { exercise: await service.update(original.id, fields), mode: 'update' }
  }
  const copy: CreateExerciseDTO = {
    ...fields,
    description: original.description ?? undefined,
    instructions: original.instructions ?? undefined,
    notes: original.notes ?? undefined,
    video_url: original.video_url ?? undefined,
    image_url: original.image_url ?? undefined,
    requires_equipment: original.requires_equipment,
    is_unilateral: original.is_unilateral,
    equipment: original.equipment,
    is_public: false,
  }
  return { exercise: await service.create(copy), mode: 'copy' }
}

/**
 * Aplica al borrador el resultado de editar. Propio actualizado: todas las filas con ese ejercicio lo
 * reciben. Copia: solo la fila editada. El día de las filas no cambia.
 */
export function applyExerciseEdit(
  days: DraftDay[],
  rowKey: string,
  result: { exercise: DraftExercise; mode: EditMode },
): DraftDay[] {
  const { exercise, mode } = result
  const source = days.flatMap(d => d.rows).find(r => r.key === rowKey)?.exercise
  return days.map(d => ({
    ...d,
    rows: d.rows.map(r => {
      const hit = mode === 'copy' ? r.key === rowKey : source != null && r.exercise?.id === source.id
      if (!hit) return r
      return { ...r, exercise }
    }),
  }))
}
