import { describe, it, expect } from 'vitest'
import {
  GOAL_LABELS,
  DIFFICULTY_LABELS,
  CATEGORY_LABELS,
  MUSCLE_LABELS,
  EQUIPMENT_CATEGORY_LABELS,
  translateMuscle,
} from './labels'

// i18n se inicializa con 'es' como idioma por defecto,
// así que los labels devuelven español.

describe('Labels (i18n proxy)', () => {
  describe('GOAL_LABELS', () => {
    it('contiene los objetivos principales', () => {
      expect(GOAL_LABELS.strength).toBe('Fuerza')
      expect(GOAL_LABELS.hypertrophy).toBe('Hipertrofia')
      expect(GOAL_LABELS.fat_loss).toBe('Pérdida de grasa')
      expect(GOAL_LABELS.general_fitness).toBe('Fitness general')
    })
  })

  describe('DIFFICULTY_LABELS', () => {
    it('tiene los 3 niveles', () => {
      expect(DIFFICULTY_LABELS.easy).toBe('Fácil')
      expect(DIFFICULTY_LABELS.medium).toBe('Media')
      expect(DIFFICULTY_LABELS.hard).toBe('Difícil')
    })
  })

  describe('CATEGORY_LABELS', () => {
    it('tiene las categorías', () => {
      expect(CATEGORY_LABELS.strength).toBe('Fuerza')
      expect(CATEGORY_LABELS.cardio).toBe('Cardio')
      expect(CATEGORY_LABELS.hiit).toBe('HIIT')
      expect(CATEGORY_LABELS.flexibility).toBe('Flexibilidad')
      expect(CATEGORY_LABELS.balance).toBe('Equilibrio')
    })
  })

  describe('MUSCLE_LABELS', () => {
    it('traduce los grupos musculares principales', () => {
      expect(MUSCLE_LABELS.chest).toBe('Pecho')
      expect(MUSCLE_LABELS.lats).toBe('Dorsales')
      expect(MUSCLE_LABELS.glutes).toBe('Glúteos')
      expect(MUSCLE_LABELS.core).toBe('Core')
      expect(MUSCLE_LABELS.full_body).toBe('Cuerpo completo')
    })
  })

  describe('EQUIPMENT_CATEGORY_LABELS', () => {
    it('tiene categorías de equipamiento', () => {
      expect(EQUIPMENT_CATEGORY_LABELS.free_weights).toBe('Pesos libres')
      expect(EQUIPMENT_CATEGORY_LABELS.machines).toBe('Máquinas')
      expect(EQUIPMENT_CATEGORY_LABELS.accessories).toBe('Accesorios')
    })
  })

  describe('translateMuscle', () => {
    it('traduce un muscle_group conocido', () => {
      expect(translateMuscle('chest')).toBe('Pecho')
      expect(translateMuscle('hamstrings')).toBe('Isquiotibiales')
    })

    it('devuelve el key con underscores reemplazados si no existe', () => {
      expect(translateMuscle('unknown_muscle')).toBe('unknown muscle')
    })

    it('devuelve el key tal cual si no tiene underscores y no existe', () => {
      expect(translateMuscle('xyz')).toBe('xyz')
    })
  })
})
