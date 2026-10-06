// Emparejado de nombres importados con el catálogo de ejercicios.
// Orden: coincidencia exacta → alias de jerga → por tokens → difusa.
// Por debajo de MATCH_THRESHOLD el ejercicio queda "sin emparejar" (se devuelve el
// mejor candidato solo como sugerencia): nunca se empareja a ciegas.

export interface CatalogItem {
  id: number
  name: string
}

export interface MatchCandidate<T extends CatalogItem = CatalogItem> {
  item: T
  score: number
}

export interface MatchResult<T extends CatalogItem = CatalogItem> {
  status: 'matched' | 'unmatched'
  /** Mejor candidato (también si no supera el umbral, como sugerencia). null si no hay ninguno razonable. */
  best: T | null
  confidence: number
  /** Hasta 3 alternativas distintas de `best`. */
  alternatives: T[]
}

export const MATCH_THRESHOLD = 0.8
const MIN_SUGGESTION = 0.35
const AMBIGUITY_MARGIN = 0.05
const AMBIGUOUS_CAP = 0.7

const STOPWORDS = new Set(['de', 'del', 'con', 'en', 'la', 'el', 'los', 'las', 'al', 'a', 'y', 'para', 'un', 'una'])

function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function stem(token: string): string {
  if (token.length > 4 && token.endsWith('es')) return token.slice(0, -2)
  if (token.length > 4 && token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1)
  return token
}

function tokenize(s: string): string[] {
  return fold(s)
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .split(' ')
    .filter(t => t && !STOPWORDS.has(t))
    .map(stem)
}

/** Minúsculas, sin tildes, sin paréntesis ni signos y con espacios colapsados. */
export function normalizeName(s: string): string {
  return fold(s.replace(/\([^)]*\)/g, ' '))
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .trim()
}

/** Forma canónica para comparar: sin paréntesis, sin palabras vacías, con raíces. */
function canon(s: string): string {
  return tokenize(s.replace(/\([^)]*\)/g, ' ')).join(' ')
}

// ─── Alias de jerga ───────────────────────────────────────────
// Clave → nombres reales del catálogo (el primero es el de por defecto, el resto, alternativas).
// Solo entradas que existen en el catálogo o tienen un equivalente claro.
const ALIAS_GROUPS: [string[], string[]][] = [
  [['rear', 'rear delt', 'rear delts', 'pajaro', 'pajaros', 'pajaro invertido', 'reverse fly', 'reverse flys', 'deltoide posterior'],
    ['Reverse Flys (Pájaro)', 'Reverse Flys en Máquina']],
  [['jalon', 'jalon pecho', 'jalon al pecho', 'polea al pecho', 'lat pulldown', 'jalon dorsal'],
    ['Jalón al Pecho Agarre Abierto', 'Jalón al Pecho Agarre Cerrado', 'Jalón al Pecho Agarre Neutro']],
  [['trasnuca', 'tras nuca', 'triceps trasnuca', 'triceps tras nuca', 'extension trasnuca', 'press tras nuca', 'press trasnuca'],
    ['Extensión de Tríceps Trasnuca en Polea', 'Extensión de Tríceps Trasnuca con Mancuerna']],
  [['bayesian', 'curl bayesian', 'bayesian curl'], ['Curl Bayesian']],
  [['gironda', 'remo gironda', 'gironda abierto'], ['Remo Gironda Agarre Abierto', 'Remo Gironda Unilateral']],
  [['remo unil', 'remo unilateral', 'remo mancuerna', 'remo a una mano', 'remo 1 mano', 'remo unilateral mancuerna'],
    ['Remo con Mancuerna Unilateral', 'Remo en Máquina Unilateral', 'Remo Gironda Unilateral']],
  [['hack', 'hack squat', 'sentadilla hack', 'maquina hack'], ['Hack Squat']],
  [['rumano', 'peso muerto rumano', 'pm rumano', 'rdl'], ['Peso Muerto Rumano']],
  [['predicador', 'curl predicador', 'banco predicador', 'scott', 'curl scott'],
    ['Curl en Banco Predicador', 'Curl en Banco Predicador con Mancuerna']],
  [['martillo', 'curl martillo', 'martillos'], ['Curl Martillo']],
  [['adductor', 'adductores', 'aductor', 'aductores', 'aduccion', 'aduccion cadera', 'maquina aductores'],
    ['Aducción de Cadera en Máquina']],
  [['abductor', 'abductores', 'abduccion', 'abduccion cadera', 'maquina abductores'],
    ['Abducción de Cadera en Máquina']],
  [['peck deck', 'pec deck', 'contractora', 'mariposa', 'aperturas maquina'], ['Peck Deck']],
  [['press hombro', 'press de hombro', 'press hombros', 'shoulder press', 'press hombro mancuernas', 'press hombro sentado'],
    ['Press con Mancuernas (Hombro)', 'Press en Máquina (Shoulder Press)', 'Press Militar']],
  [['elevaciones laterales', 'elevacion lateral', 'laterales', 'vuelos laterales', 'lateral raise'],
    ['Elevaciones Laterales con Mancuernas', 'Elevaciones Laterales en Polea']],
  [['elevaciones frontales', 'frontales', 'elevacion frontal'],
    ['Elevaciones Frontales con Mancuernas', 'Elevaciones Frontales con Disco']],
  [['femoral', 'curl femoral', 'femoral sentado', 'curl femoral sentado'], ['Femoral en Máquina Sentado', 'Femoral en Máquina Tumbado']],
  [['femoral tumbado', 'curl femoral tumbado'], ['Femoral en Máquina Tumbado', 'Femoral en Máquina Sentado']],
  [['extension cuadriceps', 'extensiones cuadriceps', 'cuadriceps', 'extension piernas', 'sillon de cuadriceps'],
    ['Extensión de Cuádriceps en Máquina']],
  [['gemelos', 'gemelo', 'elevacion gemelos', 'pantorrillas'],
    ['Elevación de Gemelos de Pie', 'Elevación de Gemelos Sentado', 'Elevación de Gemelos en Prensa']],
  [['prensa', 'prensa piernas', 'leg press'], ['Prensa de Piernas']],
  [['sentadilla', 'sentadillas', 'squat', 'sentadilla barra'], ['Sentadilla con Barra']],
  [['press banca', 'banca', 'bench press', 'press plano'], ['Press de Banca', 'Press de Banca con Mancuernas']],
  [['militar', 'press militar'], ['Press Militar']],
  [['dominadas', 'dominada', 'pull up', 'pull ups'], ['Dominadas', 'Chin-Up (Dominada Supina)']],
  [['fondos', 'fondos paralelas'], ['Fondos en Paralelas', 'Fondos en Banco']],
  [['remo barra', 'remo con barra', 'remo inclinado'], ['Remo con Barra']],
  [['pullover polea'], ['Pullover en Polea']],
  [['pullover mancuerna', 'pullover mancuernas'], ['Pullover con Mancuerna']],
  [['crossover', 'cruces polea', 'cruce de poleas', 'cruces'], ['Crossover en Polea']],
  [['encogimientos', 'trapecio', 'trapecios', 'shrugs'],
    ['Encogimientos de Hombros con Mancuernas', 'Encogimientos de Hombros con Barra']],
  [['patada gluteo', 'patada de gluteo', 'patada gluteo polea'], ['Patada de Glúteo en Polea']],
  [['triceps polea', 'pushdown', 'jalon triceps', 'triceps cuerda'],
    ['Extensión de Tríceps en Polea (Cuerda)', 'Extensión de Tríceps en Polea (Barra)', 'Pushdown en Polea (Barra V)']],
  [['frances', 'press frances', 'skull crusher'], ['Press Francés (Skull Crusher)', 'Press Francés con Mancuernas']],
  [['zancadas', 'zancada', 'lunges'], ['Zancadas con Mancuernas', 'Zancadas Caminando']],
  [['hiperextensiones', 'hiperextension', 'lumbares'], ['Hiperextensión en Banco Romano']],
  [['curl biceps', 'curl barra', 'biceps barra'], ['Curl de Bíceps con Barra', 'Curl con Barra EZ']],
  [['curl mancuerna', 'curl mancuernas', 'biceps mancuerna'], ['Curl con Mancuerna']],
  [['curl barra z', 'curl ez', 'barra z'], ['Curl con Barra EZ']],
]

const ALIASES: Map<string, string[]> = new Map(
  ALIAS_GROUPS.flatMap(([keys, targets]) => keys.map(k => [canon(k), targets] as const)),
)

// ─── Similitud ────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
      diag = tmp
    }
  }
  return prev[b.length]
}

function tokenSim(a: string, b: string): number {
  if (a === b) return 1
  if (a.length < 4 || b.length < 4) return 0
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length)
}

// ─── Índice y emparejado ──────────────────────────────────────

interface IndexEntry<T extends CatalogItem> {
  item: T
  exact: string
  tokens: string[]
}

export interface MatchIndex<T extends CatalogItem = CatalogItem> {
  entries: IndexEntry<T>[]
}

export function buildMatchIndex<T extends CatalogItem>(catalog: T[]): MatchIndex<T> {
  return {
    entries: catalog.map(item => ({
      item,
      exact: canon(item.name),
      // Aquí los paréntesis se conservan: "Reverse Flys (Pájaro)" también responde a "pájaro"
      tokens: tokenize(item.name),
    })),
  }
}

function scoreEntry<T extends CatalogItem>(q: string[], e: IndexEntry<T>): number {
  const c = e.tokens
  if (q.length === 0 || c.length === 0) return 0
  const cSet = new Set(c)
  const qSet = new Set(q)
  const qInC = q.every(t => cSet.has(t))
  if (qInC) return 0.75 + 0.2 * (qSet.size / cSet.size)
  const cInQ = c.every(t => qSet.has(t))
  if (cInQ) return 0.7 + 0.1 * (cSet.size / qSet.size)

  let sumQ = 0
  const hitC = new Set<string>()
  for (const t of q) {
    let best = 0
    let bestTok = ''
    for (const ct of c) {
      const s = tokenSim(t, ct)
      if (s > best) { best = s; bestTok = ct }
    }
    if (best >= 0.8) { sumQ += best; hitC.add(bestTok) }
  }
  const cQ = sumQ / q.length
  const cC = hitC.size / c.length
  if (cQ < 0.5) return cQ * cC
  return 0.35 + 0.6 * cQ * cC
}

export function matchExercise<T extends CatalogItem>(rawName: string, index: MatchIndex<T>): MatchResult<T> {
  const key = canon(rawName)
  const none: MatchResult<T> = { status: 'unmatched', best: null, confidence: 0, alternatives: [] }
  if (!key) return none

  const scored = new Map<number, MatchCandidate<T>>()
  const put = (item: T, score: number) => {
    const prev = scored.get(item.id)
    if (!prev || score > prev.score) scored.set(item.id, { item, score })
  }

  // 1) Exacta
  for (const e of index.entries) if (e.exact === key) put(e.item, 1)

  // 2) Alias de jerga (solo con los destinos que existan en el catálogo)
  const targets = ALIASES.get(key)
  if (targets) {
    const found = targets
      .map(t => index.entries.find(e => e.exact === canon(t)))
      .filter((e): e is IndexEntry<T> => Boolean(e))
    found.forEach((e, i) => put(e.item, i === 0 ? 0.92 : 0.7))
  }

  // 3) Tokens y 4) difusa
  const q = tokenize(rawName.replace(/\([^)]*\)/g, ' '))
  const tokenScores: MatchCandidate<T>[] = index.entries
    .map(e => ({ item: e.item, score: scoreEntry(q, e) }))
    .filter(c => c.score >= MIN_SUGGESTION)
  tokenScores.forEach(c => put(c.item, c.score))

  const ranked = [...scored.values()].sort((a, b) => b.score - a.score || a.item.name.length - b.item.name.length)
  if (ranked.length === 0) return none

  const [top, second] = ranked
  let confidence = top.score
  // Dos candidatos casi empatados que no son exacto ni alias: ambiguo, que decida el usuario
  if (confidence < 0.92 && second && confidence - second.score < AMBIGUITY_MARGIN) {
    confidence = Math.min(confidence, AMBIGUOUS_CAP)
  }

  return {
    status: confidence >= MATCH_THRESHOLD ? 'matched' : 'unmatched',
    best: top.item,
    confidence,
    alternatives: ranked.slice(1, 4).map(c => c.item),
  }
}

/** Filtro de búsqueda para selectores: todos los tokens de la consulta deben aparecer en el nombre. */
export function searchCatalog<T extends CatalogItem>(query: string, catalog: T[], limit = 30): T[] {
  const q = fold(query).split(/\s+/).filter(Boolean)
  if (q.length === 0) return catalog.slice(0, limit)
  const hay = (name: string) => fold(name)
  return catalog.filter(c => q.every(t => hay(c.name).includes(t))).slice(0, limit)
}
