// Fórmula de Epley: 1RM = peso × (1 + reps / 30)
export function calculateOneRM(weight: number, reps: number): number {
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

const PERCENTAGES = [
  { pct: 100, repsLabel: '1',    goal: 'Fuerza máxima' },
  { pct: 95,  repsLabel: '2',    goal: 'Fuerza máxima' },
  { pct: 90,  repsLabel: '3–4',  goal: 'Fuerza' },
  { pct: 85,  repsLabel: '5–6',  goal: 'Fuerza–Hipertrofia' },
  { pct: 80,  repsLabel: '8',    goal: 'Hipertrofia' },
  { pct: 75,  repsLabel: '10',   goal: 'Hipertrofia' },
  { pct: 70,  repsLabel: '12',   goal: 'Hipertrofia–Resistencia' },
  { pct: 60,  repsLabel: '15–20',goal: 'Resistencia muscular' },
  { pct: 50,  repsLabel: '20+',  goal: 'Calentamiento / Técnica' },
]

export interface OneRMRow {
  pct: number
  weight: number
  repsLabel: string
  goal: string
}

export function getPercentageTable(oneRM: number): OneRMRow[] {
  return PERCENTAGES.map(({ pct, repsLabel, goal }) => ({
    pct,
    weight: parseFloat((oneRM * pct / 100).toFixed(1)),
    repsLabel,
    goal,
  }))
}
