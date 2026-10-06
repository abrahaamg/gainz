import { describe, it, expect } from 'vitest'
import { buildMatchIndex, matchExercise, normalizeName, searchCatalog, MATCH_THRESHOLD } from './match'
import { parseRoutineText } from './parse'
import { CATALOG_FIXTURE } from './catalog.fixture'
import ejemplo from './rutina-ejemplo.fixture.txt?raw'

const catalog = CATALOG_FIXTURE.map(([name], i) => ({ id: i + 1, name }))
const index = buildMatchIndex(catalog)
const match = (raw: string) => matchExercise(raw, index)

describe('normalizeName', () => {
  it('minúsculas, sin tildes, sin paréntesis ni espacios sobrantes', () => {
    expect(normalizeName('  JALÓN   Al  Pecho (agarre) ')).toBe('jalon al pecho')
    expect(normalizeName('Extensión CUÁDRICEPS')).toBe('extension cuadriceps')
  })
})

describe('matchExercise', () => {
  it('nombre exacto del catálogo, con otras mayúsculas/tildes → confianza 1', () => {
    const r = match('  PECK   DECK ')
    expect(r.status).toBe('matched')
    expect(r.best?.name).toBe('Peck Deck')
    expect(r.confidence).toBe(1)
    expect(match('jalon al pecho agarre neutro').best?.name).toBe('Jalón al Pecho Agarre Neutro')
  })

  it.each([
    ['REAR', 'Reverse Flys (Pájaro)'],
    ['JALÓN', 'Jalón al Pecho Agarre Abierto'],
    ['TRASNUCA', 'Extensión de Tríceps Trasnuca en Polea'],
    ['BAYESIAN', 'Curl Bayesian'],
    ['GIRONDA ABIERTO', 'Remo Gironda Agarre Abierto'],
    ['REMO UNIL', 'Remo con Mancuerna Unilateral'],
    ['HACK', 'Hack Squat'],
    ['HACK(verde)', 'Hack Squat'],
    ['RUMANO', 'Peso Muerto Rumano'],
    ['PREDICADOR', 'Curl en Banco Predicador'],
    ['MARTILLO', 'Curl Martillo'],
    ['ADDUCTOR', 'Aducción de Cadera en Máquina'],
    ['FEMORAL SENTADO', 'Femoral en Máquina Sentado'],
    ['EXTENSIÓN CUÁDRICEPS', 'Extensión de Cuádriceps en Máquina'],
    ['ELEVACIONES LATERALES', 'Elevaciones Laterales con Mancuernas'],
    ['PRESS HOMBRO', 'Press con Mancuernas (Hombro)'],
  ])('jerga %s → %s', (raw, expected) => {
    const r = match(raw)
    expect(r.status).toBe('matched')
    expect(r.best?.name).toBe(expected)
  })

  it('por tokens: una consulta contenida en un único nombre del catálogo', () => {
    const r = match('hip thrust maquina')
    expect(r.status).toBe('matched')
    expect(r.best?.name).toBe('Hip Thrust en Máquina')
  })

  it('difusa: tolera erratas', () => {
    const r = match('pres de banca')
    expect(r.status).toBe('matched')
    expect(r.best?.name).toBe('Press de Banca')
  })

  it('ambiguo (varios candidatos casi iguales) → sin emparejar, con alternativas', () => {
    const r = match('PULLOVER')
    expect(r.status).toBe('unmatched')
    expect(r.confidence).toBeLessThan(MATCH_THRESHOLD)
    const names = [r.best?.name, ...r.alternatives.map(a => a.name)]
    expect(names).toEqual(expect.arrayContaining(['Pullover con Mancuerna', 'Pullover en Polea']))
  })

  it('sin equivalente en el catálogo → sin emparejar (nunca a ciegas)', () => {
    for (const raw of ['ANTEBRAZO', 'ABS', 'REMO ALTO', 'xyzzy']) {
      expect(match(raw).status).toBe('unmatched')
    }
    expect(match('xyzzy').best).toBeNull()
  })

  it('devuelve como máximo 3 alternativas distintas del mejor', () => {
    const r = match('REMO ALTO')
    expect(r.best).not.toBeNull()
    expect(r.alternatives.length).toBeLessThanOrEqual(3)
    expect(r.alternatives.every(a => a.id !== r.best!.id)).toBe(true)
  })

  it('los alias solo aplican si el destino existe en el catálogo', () => {
    const small = buildMatchIndex([{ id: 1, name: 'Dominadas' }])
    expect(matchExercise('hack', small).status).toBe('unmatched')
  })
})

describe('ejemplo real contra el catálogo real', () => {
  const rows = parseRoutineText(ejemplo).days.flatMap(d => d.rows)
  const results = rows.map(r => ({ raw: r.rawName, res: match(r.rawName) }))

  it('empareja solas las filas con equivalente claro y deja el resto por revisar', () => {
    const unmatched = results.filter(r => r.res.status === 'unmatched').map(r => r.raw)
    expect(unmatched.sort()).toEqual(['ABS', 'ANTEBRAZO', 'HIP THRUST', 'PRESS INCLINADO', 'PULLOVER', 'REMO ALTO'])
    expect(results.filter(r => r.res.status === 'matched')).toHaveLength(17)
  })
})

describe('searchCatalog', () => {
  it('todos los tokens deben aparecer, sin tildes', () => {
    const names = searchCatalog('jalon pecho', catalog).map(c => c.name)
    expect(names).toHaveLength(3)
    expect(searchCatalog('', catalog, 5)).toHaveLength(5)
  })
})
