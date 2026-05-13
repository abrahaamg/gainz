// Fórmula de Epley: 1RM = peso × (1 + reps / 30)
export function calculateOneRM(weight: number, reps: number): number {
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

export type OneRMGoalKey =
  | 'maxStrength'
  | 'strength'
  | 'strengthHypertrophy'
  | 'hypertrophy'
  | 'hypertrophyEndurance'
  | 'endurance'

const PERCENTAGES: { pct: number; repsLabel: string; goalKey: OneRMGoalKey }[] = [
  { pct: 100, repsLabel: '1',    goalKey: 'maxStrength' },
  { pct: 95,  repsLabel: '2',    goalKey: 'maxStrength' },
  { pct: 90,  repsLabel: '3–4',  goalKey: 'strength' },
  { pct: 85,  repsLabel: '5–6',  goalKey: 'strengthHypertrophy' },
  { pct: 80,  repsLabel: '8',    goalKey: 'hypertrophy' },
  { pct: 75,  repsLabel: '10',   goalKey: 'hypertrophy' },
  { pct: 70,  repsLabel: '12',   goalKey: 'hypertrophy' },
  { pct: 60,  repsLabel: '15–20',goalKey: 'hypertrophyEndurance' },
  { pct: 50,  repsLabel: '20+',  goalKey: 'endurance' },
]

export interface OneRMRow {
  pct: number
  weight: number
  repsLabel: string
  goalKey: OneRMGoalKey
}

export function getPercentageTable(oneRM: number): OneRMRow[] {
  return PERCENTAGES.map(({ pct, repsLabel, goalKey }) => ({
    pct,
    weight: parseFloat((oneRM * pct / 100).toFixed(1)),
    repsLabel,
    goalKey,
  }))
}
