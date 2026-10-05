import { describe, it, expect } from 'vitest'
import { label, translateMuscle } from './labels'

// i18n se inicializa con 'es' como idioma por defecto,
// así que los labels devuelven español.

describe('label(ns, key)', () => {
  it('traduce objetivos', () => {
    expect(label('goals', 'strength')).toBe('Fuerza')
    expect(label('goals', 'hypertrophy')).toBe('Hipertrofia')
    expect(label('goals', 'fat_loss')).toBe('Pérdida de grasa')
    expect(label('goals', 'general_fitness')).toBe('Fitness general')
  })

  it('traduce los 3 niveles de dificultad', () => {
    expect(label('difficulty', 'easy')).toBe('Fácil')
    expect(label('difficulty', 'medium')).toBe('Media')
    expect(label('difficulty', 'hard')).toBe('Difícil')
  })

  it('traduce categorías', () => {
    expect(label('categories', 'strength')).toBe('Fuerza')
    expect(label('categories', 'hiit')).toBe('HIIT')
    expect(label('categories', 'balance')).toBe('Equilibrio')
  })

  it('traduce músculos', () => {
    expect(label('muscles', 'chest')).toBe('Pecho')
    expect(label('muscles', 'lats')).toBe('Dorsales')
    expect(label('muscles', 'full_body')).toBe('Cuerpo completo')
  })

  it('traduce categorías de equipamiento', () => {
    expect(label('equipmentCategories', 'free_weights')).toBe('Pesos libres')
    expect(label('equipmentCategories', 'machines')).toBe('Máquinas')
    expect(label('equipmentCategories', 'accessories')).toBe('Accesorios')
  })

  it('si no existe devuelve la clave con espacios en vez de guiones bajos', () => {
    expect(label('goals', 'unknown_goal')).toBe('unknown goal')
    expect(label('muscles', 'xyz')).toBe('xyz')
  })
})

describe('translateMuscle', () => {
  it('traduce un muscle_group conocido', () => {
    expect(translateMuscle('chest')).toBe('Pecho')
    expect(translateMuscle('hamstrings')).toBe('Isquiotibiales')
  })

  it('devuelve la clave legible si no existe', () => {
    expect(translateMuscle('unknown_muscle')).toBe('unknown muscle')
    expect(translateMuscle('xyz')).toBe('xyz')
  })
})
