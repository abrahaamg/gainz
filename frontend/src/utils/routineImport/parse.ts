// Parser de rutinas pegadas desde Google Docs / Sheets / Excel / Word, CSV o notas libres.
// Función pura, sin React. Devuelve días con filas ya normalizadas.

export type RowWarning = 'swapped' | 'repsCount' | 'weightsCount' | 'missingSets'

export interface ParsedRow {
  rawName: string
  sets: number
  reps: number[]
  weights: number[]
  notes: string
  warnings: RowWarning[]
}

export interface ParsedDay {
  name: string
  rows: ParsedRow[]
}

export interface ParseResult {
  days: ParsedDay[]
}

type Column = 'name' | 'sets' | 'reps' | 'weight' | 'notes'

const HEADER_WORDS: Record<string, Column> = {
  ejercicio: 'name', ejercicios: 'name', nombre: 'name', exercise: 'name',
  series: 'sets', serie: 'sets', sets: 'sets',
  reps: 'reps', rep: 'reps', repeticiones: 'reps',
  peso: 'weight', kg: 'weight', carga: 'weight', weight: 'weight',
  anotaciones: 'notes', anotacion: 'notes', notas: 'notes', nota: 'notes',
  observaciones: 'notes', comentarios: 'notes', notes: 'notes',
}

const DEFAULT_COLUMNS: Column[] = ['name', 'sets', 'reps', 'weight', 'notes']

const NUM = String.raw`\d+(?:[.,]\d+)?`
const NUM_LIST = String.raw`${NUM}(?:\s*[-–/]\s*${NUM})*`
const NUM_LIST_RE = new RegExp(`^${NUM_LIST}$`)
const NOTE_SEP = ' · '

function fold(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function clean(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

function toNumber(s: string): number {
  return Number(s.replace(',', '.'))
}

function numList(s: string): number[] {
  return s.split(/\s*[-–/]\s*/).filter(Boolean).map(toNumber)
}

function appendNote(current: string, extra: string): string {
  const e = clean(extra)
  if (!e) return current
  return current ? current + NOTE_SEP + e : e
}

function headerColumn(cell: string): Column | null {
  return HEADER_WORDS[fold(cell)] ?? null
}

/** Una línea es cabecera si todas sus celdas no vacías son nombres de columna conocidos (≥2). */
function headerFromCells(cells: string[]): boolean {
  const nonEmpty = cells.filter(c => c.trim())
  if (nonEmpty.length < 2) return false
  const cols = nonEmpty.map(headerColumn)
  return !cols.includes(null) && cols.includes('name')
}

// ─── Celdas ───────────────────────────────────────────────────

/** `HACK(verde)` → nombre `HACK` + nota `(verde)`. */
function splitName(cell: string): { name: string; notes: string } {
  let notes = ''
  const name = cell.replace(/\(([^)]*)\)/g, (_m, inner: string) => {
    notes = appendNote(notes, `(${clean(inner)})`)
    return ' '
  })
  return { name: clean(name), notes }
}

/** `20(subir)`, `62-62-57`, `20kg` → pesos y nota. Texto no numérico → solo nota. */
function parseWeightCell(cell: string): { weights: number[]; notes: string } {
  let notes = ''
  const body = cell.replace(/\(([^)]*)\)/g, (_m, inner: string) => {
    notes = appendNote(notes, inner)
    return ' '
  })
  const stripped = clean(body.replace(/\bkgs?\b/gi, ''))
  if (!stripped) return { weights: [], notes }
  if (NUM_LIST_RE.test(stripped)) return { weights: numList(stripped), notes }
  return { weights: [], notes: appendNote(notes, stripped) }
}

function parseRepsCell(cell: string): number[] {
  const s = clean(cell.replace(/\breps?\b/gi, ''))
  return NUM_LIST_RE.test(s) ? numList(s) : []
}

function isSetsCell(cell: string): boolean {
  const s = cell.trim()
  return /^\d{1,2}$/.test(s) && Number(s) >= 1 && Number(s) <= 10
}

/** Normaliza una fila y detecta incoherencias (reps/peso intercambiados, nº de valores ≠ series). */
function finishRow(raw: {
  rawName: string; sets: number; reps: number[]; weights: number[]; notes: string
}): ParsedRow {
  const warnings: RowWarning[] = []
  const { reps, weights } = raw
  const sets = raw.sets > 0 ? raw.sets : Math.max(reps.length, 1)
  if (raw.sets <= 0) warnings.push('missingSets')

  const looksSwapped =
    reps.length > 0 && weights.length > 0 &&
    Math.max(...reps) > 30 && Math.max(...weights) <= 30 &&
    Math.min(...reps) > Math.max(...weights)
  if (looksSwapped) warnings.push('swapped')
  if (reps.length > 1 && reps.length !== sets) warnings.push('repsCount')
  if (weights.length > 1 && weights.length !== sets) warnings.push('weightsCount')

  return { rawName: raw.rawName, sets, reps, weights, notes: raw.notes, warnings }
}

// ─── Días ─────────────────────────────────────────────────────

const DAY_RE = /^(?:d[ií]a|day|sesi[oó]n|rutina)\s*\d*(?:\s|$|:)/i
const WEEKDAY_RE = /^(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
const SPLIT_RE =
  /^(?:push|pull|legs?|pierna|piernas|torso|empuje|tir[oó]n|full\s?body|upper|lower|superior|inferior)\b/i

function dayName(raw: string): string {
  let s = clean(raw).replace(/[:\-–]+$/, '').trim()
  const m = s.match(/^d[ií]a\s*(\d+)(.*)$/i)
  if (m) return `Día ${m[1]}${clean(m[2]) ? ' ' + clean(m[2]) : ''}`
  if (s === s.toUpperCase() && s.length > 1) s = s.charAt(0) + s.slice(1).toLowerCase()
  return s
}

function isDayLike(line: string): boolean {
  const s = clean(line)
  if (!s || /\d\s*[x×]\s*\d/i.test(s)) return false
  if (DAY_RE.test(s) && s.length <= 40) return true
  if (WEEKDAY_RE.test(s) && s.length <= 40) return true
  return SPLIT_RE.test(s) && s.length <= 30 && !/\d/.test(s)
}

class Builder {
  days: ParsedDay[] = []
  private pendingTitle: string | null = null

  setTitle(title: string) {
    this.pendingTitle = dayName(title)
  }

  /** Cabecera o título de día: abre un día nuevo (reutiliza el actual si aún está vacío). */
  startDay() {
    const current = this.days[this.days.length - 1]
    if (current && current.rows.length === 0) {
      if (this.pendingTitle) current.name = this.pendingTitle
    } else {
      this.days.push({ name: this.pendingTitle ?? '', rows: [] })
    }
    this.pendingTitle = null
  }

  addRow(row: ParsedRow) {
    if (this.days.length === 0) this.startDay()
    this.days[this.days.length - 1].rows.push(row)
  }

  lastRow(): ParsedRow | undefined {
    const d = this.days[this.days.length - 1]
    return d?.rows[d.rows.length - 1]
  }

  finish(): ParseResult {
    const days = this.days.filter(d => d.rows.length > 0)
    days.forEach((d, i) => { if (!d.name) d.name = `Día ${i + 1}` })
    return { days }
  }
}

// ─── Formato tabular (tabuladores / CSV) ──────────────────────

function splitCsvLine(line: string, delim: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (ch === '"') quoted = false
      else cur += ch
    } else if (ch === '"') quoted = true
    else if (ch === delim) { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out
}

function parseTabular(table: string[][]): ParseResult {
  const b = new Builder()
  let columns: Column[] = DEFAULT_COLUMNS

  const nextNonBlank = (from: number) => {
    for (let i = from; i < table.length; i++) if (table[i].some(c => c.trim())) return table[i]
    return null
  }

  table.forEach((cells, i) => {
    const nonEmpty = cells.filter(c => c.trim())
    if (nonEmpty.length === 0) return

    if (headerFromCells(cells)) {
      // Posición real de cada columna (las celdas vacías cuentan)
      columns = cells.map(c => headerColumn(c) ?? 'notes')
      b.startDay()
      return
    }

    if (nonEmpty.length === 1) {
      const text = clean(nonEmpty[0])
      const next = nextNonBlank(i + 1)
      if ((next && headerFromCells(next)) || isDayLike(text)) {
        b.setTitle(text)
        b.startDay()
        return
      }
      const last = b.lastRow()
      if (last) last.notes = appendNote(last.notes, text)
      return
    }

    const get = (c: Column) => {
      const at = columns.indexOf(c)
      return at >= 0 ? (cells[at] ?? '').trim() : ''
    }
    const { name, notes: nameNotes } = splitName(get('name'))
    if (!name) return
    const setsCell = get('sets')
    const w = parseWeightCell(get('weight'))
    b.addRow(finishRow({
      rawName: name,
      sets: /^\d+$/.test(setsCell) ? Number(setsCell) : 0,
      reps: parseRepsCell(get('reps')),
      weights: w.weights,
      notes: appendNote(appendNote(nameNotes, w.notes), get('notes')),
    }))
  })
  return b.finish()
}

// ─── Formato celda por línea (copiar tabla de Google Docs) ────

function parseCellPerLine(lines: string[]): ParseResult {
  const b = new Builder()
  let columns: Column[] = DEFAULT_COLUMNS
  const n = lines.length

  const nextIdx = (from: number): number => {
    let i = from
    while (i < n && !lines[i].trim()) i++
    return i
  }
  const isNumeric = (s: string) => /^\d/.test(s.trim())

  /** Si en `from` empieza una cabecera, devuelve sus columnas y dónde acaba. */
  const headerAt = (from: number): { cols: Column[]; end: number } | null => {
    const cols: Column[] = []
    let i = nextIdx(from)
    while (i < n) {
      const col = headerColumn(lines[i])
      if (!col) break
      cols.push(col)
      i = nextIdx(i + 1)
    }
    return cols.length >= 2 && cols[0] === 'name' ? { cols, end: i } : null
  }

  let i = 0
  while (i < n) {
    const line = lines[i].trim()
    if (!line) { i++; continue }

    const header = headerAt(i)
    if (header) {
      columns = header.cols
      b.startDay()
      i = header.end
      continue
    }

    // Inicio de fila: texto no numérico + series (entero 1-10) + patrón numérico
    if (!isNumeric(line)) {
      const j = nextIdx(i + 1)
      const k = j < n ? nextIdx(j + 1) : n
      if (k < n && isSetsCell(lines[j]) && isNumeric(lines[k]) && NUM_LIST_RE.test(clean(lines[k].replace(/\breps?\b/gi, '')))) {
        const weightFirst = columns.indexOf('weight') >= 0 && columns.indexOf('weight') < columns.indexOf('reps')
        const l = nextIdx(k + 1)
        const hasSecond = l < n && isNumeric(lines[l])
        const a = lines[k]
        const c = hasSecond ? lines[l] : ''
        const repsCell = weightFirst ? c : a
        const weightCell = weightFirst ? a : c
        const { name, notes: nameNotes } = splitName(line)
        const w = parseWeightCell(weightCell)
        b.addRow(finishRow({
          rawName: name || line,
          sets: Number(lines[j]),
          reps: parseRepsCell(repsCell),
          weights: w.weights,
          notes: appendNote(nameNotes, w.notes),
        }))
        i = hasSecond ? l + 1 : k + 1
        continue
      }
    }

    // Título de día suelto ("DIA 1", nombre en mayúsculas) seguido de cabecera
    const after = nextIdx(i + 1)
    if (!isNumeric(line) && after < n && headerAt(after)) {
      b.setTitle(line)
      i++
      continue
    }

    // Texto que no inicia fila: nota de la fila anterior
    const last = b.lastRow()
    if (last) last.notes = appendNote(last.notes, line)
    i++
  }
  return b.finish()
}

// ─── Texto libre (notas del móvil) ────────────────────────────

const SXR_RE = new RegExp(String.raw`(\d{1,2})\s*[x×*]\s*(${NUM_LIST})`, 'i')
const SERIES_DE_RE = new RegExp(String.raw`(\d{1,2})\s*series?\s*(?:de|x)?\s*(${NUM_LIST})(?:\s*reps?)?`, 'i')
const WEIGHT_KG_RE = new RegExp(String.raw`(?:@|con\s+)?\s*(${NUM_LIST})\s*(?:kgs?|kilos?)\b`, 'i')
const WEIGHT_TAIL_RE = new RegExp(String.raw`\|\s*[@-]?\s*(${NUM_LIST})\s*$`)

function hasSetsAndReps(line: string): boolean {
  return SXR_RE.test(line) || SERIES_DE_RE.test(line)
}

function parseFreeLine(line: string): ParsedRow | null {
  let rest = line
  let sets = 0
  let reps: number[] = []
  let weights: number[] = []

  const m = rest.match(SXR_RE) ?? rest.match(SERIES_DE_RE)
  if (m) {
    sets = Number(m[1])
    reps = numList(m[2])
    rest = rest.replace(m[0], ' | ')
  }
  const wm = rest.match(WEIGHT_KG_RE)
  if (wm) {
    weights = numList(wm[1])
    rest = rest.replace(wm[0], ' ')
  } else if (m) {
    // "4x8 60": número suelto tras series x reps
    const tail = rest.match(WEIGHT_TAIL_RE)
    if (tail) {
      weights = numList(tail[1])
      rest = rest.replace(tail[0], ' | ')
    }
  }

  const [namePart, ...afterParts] = rest.split('|')
  const { name, notes: nameNotes } = splitName(namePart)
  const finalName = clean(name.replace(/[:\-–·,\s]+$/, ''))
  if (!finalName) return null
  const extra = clean(afterParts.join(' ').replace(/^[\s:\-–·,]+/, ''))
  return finishRow({ rawName: finalName, sets, reps, weights, notes: appendNote(nameNotes, extra) })
}

function parseFreeText(lines: string[]): ParseResult {
  const b = new Builder()
  const content = lines.map(clean).filter(Boolean)
  content.forEach((line, i) => {
    if (!hasSetsAndReps(line)) {
      const upper = line === line.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(line) && !/\d/.test(line) && line.split(' ').length <= 3
      const nextHasData = i + 1 < content.length && hasSetsAndReps(content[i + 1])
      if (isDayLike(line) || (upper && nextHasData) || /:$/.test(line)) {
        b.setTitle(line)
        b.startDay()
        return
      }
    }
    const row = parseFreeLine(line)
    if (row) b.addRow(row)
  })
  return b.finish()
}

// ─── Entrada ──────────────────────────────────────────────────

function looksCellPerLine(lines: string[]): boolean {
  const texts = lines.map(l => l.trim()).filter(Boolean)
  // Cabecera en vertical: EJERCICIO / SERIES / ...
  for (let i = 0; i + 1 < texts.length; i++) {
    if (headerColumn(texts[i]) === 'name' && headerColumn(texts[i + 1]) !== null) return true
  }
  // Sin cabecera: texto / entero 1-10 / patrón de reps
  for (let i = 0; i + 2 < texts.length; i++) {
    if (!/^\d/.test(texts[i]) && !hasSetsAndReps(texts[i]) && isSetsCell(texts[i + 1]) && NUM_LIST_RE.test(texts[i + 2])) return true
  }
  return false
}

export function parseRoutineText(input: string): ParseResult {
  const text = input.replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ')
  const lines = text.split('\n')
  if (!lines.some(l => l.trim())) return { days: [] }

  if (lines.some(l => l.includes('\t'))) {
    return parseTabular(lines.map(l => l.split('\t')))
  }

  // CSV: la primera línea no vacía es una cabecera separada por ; o ,
  const firstLine = lines.find(l => l.trim()) ?? ''
  for (const delim of [';', ',']) {
    const cells = splitCsvLine(firstLine, delim)
    if (cells.length >= 3 && headerFromCells(cells)) {
      return parseTabular(lines.map(l => splitCsvLine(l, delim)))
    }
  }

  if (looksCellPerLine(lines)) return parseCellPerLine(lines)
  return parseFreeText(lines)
}
