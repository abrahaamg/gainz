import { describe, it, expect, vi } from 'vitest'
import { buildDraft, type DraftExercise } from './draft'
import { parseRoutineText } from './parse'
import { DEFAULT_SPLIT, splitByMuscle } from './plan'
import { applyExerciseEdit, editMode, isOwnExercise, saveEditedExercise, type EditableExercise, type ExerciseChanges } from './exerciseEdit'
import { CATALOG_FIXTURE } from './catalog.fixture'
import ejemplo from './rutina-ejemplo.fixture.txt?raw'
import type { Exercise } from '../../types/exercise'

const USER = 7
const catalogExercise: EditableExercise = {
  id: 10, name: 'Peck Deck', category: 'strength', muscle_group: 'chest', created_by: null,
  description: 'Aperturas en máquina', instructions: '1. Siéntate', notes: null, equipment: ['Máquina'],
  requires_equipment: true, is_unilateral: false, video_url: null, image_url: null,
}
const ownExercise: EditableExercise = { ...catalogExercise, id: 99, name: 'Mi peck', created_by: USER }
const othersExercise: EditableExercise = { ...catalogExercise, id: 98, created_by: 3 }

const changes: ExerciseChanges = {
  name: '  Peck Deck Invertido ', category: 'strength', muscle_group: 'shoulders',
  secondary_muscles: ['chest', 'shoulders', 'triceps'], difficulty: 'hard',
}

const service = () => ({
  create: vi.fn(async (dto: object) => ({ ...catalogExercise, ...dto, id: 500, created_by: USER }) as Exercise),
  update: vi.fn(async (id: number, dto: object) => ({ ...ownExercise, ...dto, id }) as Exercise),
})

describe('propio vs catálogo', () => {
  it('solo es propio si created_by es el usuario', () => {
    expect(isOwnExercise(ownExercise, USER)).toBe(true)
    expect(isOwnExercise(catalogExercise, USER)).toBe(false)
    expect(isOwnExercise(othersExercise, USER)).toBe(false)
    expect(isOwnExercise(ownExercise, undefined)).toBe(false)
    expect(editMode(ownExercise, USER)).toBe('update')
    expect(editMode(catalogExercise, USER)).toBe('copy')
  })

  it('propio → PUT con solo los campos editables y sin crear nada', async () => {
    const svc = service()
    const res = await saveEditedExercise(ownExercise, changes, USER, svc)
    expect(res.mode).toBe('update')
    expect(svc.create).not.toHaveBeenCalled()
    expect(svc.update).toHaveBeenCalledWith(99, {
      name: 'Peck Deck Invertido', category: 'strength', muscle_group: 'shoulders',
      secondary_muscles: ['chest', 'triceps'], difficulty: 'hard',
    })
  })

  it('catálogo → nunca PUT: crea una copia propia no pública con los cambios y el resto de datos', async () => {
    const svc = service()
    const res = await saveEditedExercise(catalogExercise, changes, USER, svc)
    expect(res.mode).toBe('copy')
    expect(svc.update).not.toHaveBeenCalled()
    expect(svc.create).toHaveBeenCalledTimes(1)
    expect(svc.create.mock.calls[0][0]).toMatchObject({
      name: 'Peck Deck Invertido', muscle_group: 'shoulders', difficulty: 'hard', is_public: false,
      description: 'Aperturas en máquina', instructions: '1. Siéntate', equipment: ['Máquina'], requires_equipment: true,
    })
    expect(res.exercise.id).toBe(500)
  })

  it('el ejercicio de otro usuario también se copia, no se edita', async () => {
    const svc = service()
    await saveEditedExercise(othersExercise, changes, USER, svc)
    expect(svc.update).not.toHaveBeenCalled()
    expect(svc.create).toHaveBeenCalled()
  })

  it('si el servicio falla, el error llega a quien llama (el modal lo muestra)', async () => {
    const svc = service()
    svc.update.mockRejectedValueOnce(new Error('403'))
    await expect(saveEditedExercise(ownExercise, changes, USER, svc)).rejects.toThrow('403')
  })
})

describe('aplicar la edición al borrador', () => {
  const catalog: DraftExercise[] = CATALOG_FIXTURE.map(([name, category, muscle_group], i) => ({ id: i + 1, name, category, muscle_group, created_by: null }))
  const days = splitByMuscle(buildDraft(parseRoutineText(ejemplo), catalog), DEFAULT_SPLIT).days
  const pecks = days[1].rows.filter(r => r.rawName === 'PECK DECK')
  const peck = pecks[0].exercise!
  const ownBack: DraftExercise = { ...peck, name: 'Mi peck', muscle_group: 'back', created_by: USER }
  const dayOf = (result: typeof days, key: string) => result.findIndex(d => d.rows.some(r => r.key === key))

  it('copia: solo cambia la fila editada y ninguna fila cambia de día', () => {
    const result = applyExerciseEdit(days, pecks[0].key, { exercise: { ...ownBack, id: 500 }, mode: 'copy' })
    expect(dayOf(result, pecks[0].key)).toBe(1)
    expect(result[1].rows.find(r => r.key === pecks[0].key)?.exercise?.name).toBe('Mi peck')
    expect(result[1].rows.find(r => r.key === pecks[1].key)?.exercise?.id).toBe(peck.id)
  })

  it('propio actualizado: todas las filas con ese ejercicio lo reciben, sin cambiar de día', () => {
    const result = applyExerciseEdit(days, pecks[0].key, { exercise: ownBack, mode: 'update' })
    expect(dayOf(result, pecks[0].key)).toBe(1)
    expect(dayOf(result, pecks[1].key)).toBe(1)
    expect(result[1].rows.filter(r => r.exercise?.name === 'Mi peck')).toHaveLength(2)
  })
})
